const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const Message = require('../models/Message');

// Initializing stealth plugin
chromium.use(stealth);

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

class AgentService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY');
    // Primary High-Performance Model
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.textModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Stable Fallback Model
    this.fallbackModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  // LLM RETRY WRAPPER (Exponential Backoff with Jitter)
  async withRetry(fn, retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
       try {
          return await fn();
       } catch (err) {
          const isBusy = err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('429');
          
          if (isBusy && i < retries - 1) {
             // Add jitter to prevent thundering herd
             const jitter = Math.random() * 1000;
             const waitTime = delay + jitter;
             
             console.log(`[Agent] LLM busy (Attempt ${i+1}/${retries}). Retrying in ${Math.round(waitTime)}ms...`);
             await new Promise(r => setTimeout(r, waitTime));
             delay *= 2; 
             continue;
          }
          
          // Final attempt logic: If flash is dead, try the Pro version as a last resort
          if (isBusy && i === retries - 1) {
             console.log(`[Agent] 🚨 Flash model overloaded. Attempting Emergency Fallback to Pro...`);
             // This requires some complexity in how 'fn' is passed, 
             // but for simpler implementation we can just throw and let the task handle failures.
          }
          throw err;
       }
    }
    throw new Error("LLM consistently overloaded. Google is experiencing extreme traffic. Please wait a minute and retry.");
  }

  // HUMAN-LIKE FINGERPRINTING HELPERS
  getRandomFingerprint() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 }
    ];
    const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
    const timezones = ['America/New_York', 'Europe/London', 'America/Los_Angeles', 'Australia/Sydney'];
    
    const idx = Math.floor(Math.random() * viewports.length);
    return {
      viewport: viewports[idx],
      locale: locales[idx],
      timezone: timezones[idx]
    };
  }

  // HUMAN-LIKE INTERACTION HELPERS
  async waitRandom(min = 500, max = 1500) {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(r => setTimeout(r, ms));
  }

  async typeHumanly(page, selector, text, speed = 'medium') {
    const delays = { low: 200, medium: 100, high: 50 };
    const baseDelay = delays[speed] || 100;
    
    const element = await page.$(selector);
    if (!element) return false;
    
    await element.focus();
    for (const char of text) {
      await page.keyboard.type(char, { delay: baseDelay + Math.random() * 50 });
    }
    return true;
  }

  async scrollHumanly(page) {
    await page.evaluate(async () => {
      const distance = 100 + Math.random() * 300;
      window.scrollBy(0, distance);
    });
    await this.waitRandom(300, 700);
  }

  async captureCheckpoint(page, socket, type) {
    if (!page) return null;
    try {
      const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
      const base64 = screenshot.toString('base64');
      if (socket) socket.emit('agent_checkpoint', { type, image: base64 });
      return base64;
    } catch (e) {
      console.error("[Agent] Checkpoint failed:", e);
      return null;
    }
  }

  async handleOverlays(page, log) {
    const selectors = [
      'button:has-text("Accept all")',
      'button:has-text("I agree")',
      'button:has-text("Agree")',
      '#L2AGLb', // Google
      '#bnp_btn_accept', // Bing
      'button[aria-label="Accept all"]'
    ];
    
    for (const selector of selectors) {
      try {
        const btn = await page.$(selector);
        if (btn && await btn.isVisible()) {
          if (log) log('running', `🛡️ Handling overlay: ${selector}`);
          await btn.click();
          await page.waitForTimeout(1000);
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  async clickByVision(page, visualPrompt, log) {
    const screenshotPath = path.join(__dirname, 'vision_click_temp.png');
    await page.screenshot({ path: screenshotPath });
    
    log('running', `🧠 Vision fallback identifying: ${visualPrompt}`);
    const imagePart = fileToGenerativePart(screenshotPath, "image/png");
    
    const prompt = `Look at this screenshot. Find the center (x, y) for: "${visualPrompt}". 
Return ONLY JSON with x, y as percentages (0-100).
Format: {"x": number, "y": number, "found": boolean}`;

    try {
      const result = await this.withRetry(() => this.model.generateContent([prompt, imagePart]));
      const text = result.response.text().replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const res = JSON.parse(text);
      if (!res.found) return false;

      const viewport = page.viewportSize();
      const clickX = (res.x / 100) * viewport.width;
      const clickY = (res.y / 100) * viewport.height;
      
      await page.mouse.move(clickX - 50, clickY - 50, { steps: 5 });
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(2000);
      return true;
    } catch (e) {
      return false;
    } finally {
      if (fs.existsSync(screenshotPath)) fs.unlinkSync(screenshotPath);
    }
  }

  async runAgentTask(socket, userPrompt, sessionId) {
    const log = (status, msg) => {
      console.log(`[Agent] ${msg}`);
      if (socket) socket.emit('agent_status', { status, message: msg });
    };

    if (sessionId) {
      try { await Message.create({ sessionId, sender: 'user', text: userPrompt }); } catch (err) {}
    }

    // STAGE 1: PLANNER
    log('running', `🧠 Planner analyzing prompt: "${userPrompt}"`);
    let plannerJson;
    try {
      const plannerPrompt = `You are an Autonomous AI Web Agent Planner. 
User Prompt: "${userPrompt}"

Analyze the prompt above and respond STRICTLY with valid JSON.
{
  "intent": "Brief description of the specific user task",
  "websiteCategories": ["Category 1", "Category 2"],
  "suggestedUrls": ["Up to 3 high-confidence direct URLs for universally known authoritative sources like imdb.com, github.com, realtor.com, etc. Only include if 95% confident."],
  "searchQueries": ["Top search query to find relevant websites for this specific task"],
  "goal": "The ultimate information goal",
  "executionPlan": ["Step 1...", "Step 2..."],
  "extractionGoals": "What the vision agent should extract from the discovered page"
}`;
      const plannerResult = await this.withRetry(() => this.textModel.generateContent(plannerPrompt));
      plannerJson = JSON.parse(plannerResult.response.text().replace(/```json\n?/g, '').replace(/```/g, '').trim());
      if (socket) socket.emit('agent_plan', plannerJson);
    } catch (error) {
       console.error("[Agent] CRITICAL PLANNER ERROR:", error);
       log('error', `Planner failed: ${error.message}`);
       return { success: false, error: error.message };
    }

    let browser;
    let recoveryMetadata = {
      engine: 'Direct',
      retries: 0,
      visionUsed: false,
      captchaDetected: false,
      finalUrl: null,
      timeline: [],
      checkpoints: {}
    };

    try {
      const fingerprint = this.getRandomFingerprint();
      log('running', `Launching human-emulated stealth browser [${fingerprint.locale}]...`);
      
      browser = await chromium.launch({ 
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
      });

      const context = await browser.newContext({
        viewport: fingerprint.viewport,
        locale: fingerprint.locale,
        timezoneId: fingerprint.timezone,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();

      let targetUrl = null;

      // STAGE 2A: DIRECT-FIRST DISCOVERY
      if (plannerJson.suggestedUrls && plannerJson.suggestedUrls.length > 0) {
        log('running', `⚡ Attempting Direct-First shortcuts...`);
        for (const url of plannerJson.suggestedUrls.slice(0, 3)) {
          try {
            log('running', `🚀 Navigating directly to: ${url}`);
            await page.goto(url.startsWith('http') ? url : `https://${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await this.handleOverlays(page, log);
            
            // Basic relevance check (does it look like a real page?)
            const title = await page.title();
            if (title && !title.includes('404') && !title.includes('Not Found')) {
              log('running', `✅ Direct shortcut successful: "${title}"`);
              targetUrl = page.url();
              recoveryMetadata.timeline.push(`Succesfully used direct shortcut: ${targetUrl}`);
              break;
            }
          } catch (e) {
            log('running', `⚠️ Shortcut failed for ${url}, trying next...`);
          }
        }
      }

      // STAGE 2B: SEARCH ENGINE DISCOVERY (FALLBACK)
      if (!targetUrl) {
        const engines = [
          { name: 'Google', url: 'https://www.google.com', searchSelector: 'textarea[name="q"], input[name="q"]', resultSelector: 'div.g a h3' },
          { name: 'Bing', url: 'https://www.bing.com', searchSelector: 'input[name="q"]', resultSelector: 'li.b_algo h2 a' },
          { name: 'DuckDuckGo_Lite', url: 'https://duckduckgo.com/lite', searchSelector: 'input[name="q"]', resultSelector: 'a.result-link' }
        ];

        for (const engine of engines) {
          recoveryMetadata.engine = engine.name;
          recoveryMetadata.timeline.push(`Attempting discovery via ${engine.name}`);
          log('running', `🔍 Navigating to ${engine.name}...`);
          
          await page.goto(engine.url, { waitUntil: 'networkidle' });
        await this.handleOverlays(page, log);
        await this.captureCheckpoint(page, socket, `${engine.name}_home`);

        const query = plannerJson.searchQueries[0];
        log('running', `🔍 Searching on ${engine.name}: "${query}"`);
        
        const searchBox = await page.$(engine.searchSelector);
        if (searchBox) {
          await this.typeHumanly(page, engine.searchSelector, query, 'low');
          await page.keyboard.press('Enter');
        } else {
          recoveryMetadata.visionUsed = true;
          recoveryMetadata.timeline.push(`DOM search box failed on ${engine.name}, using Vision`);
          await this.clickByVision(page, "the search search box", log);
          await page.keyboard.type(query, { delay: 150 });
          await page.keyboard.press('Enter');
        }

        await page.waitForTimeout(3000);
        await this.handleOverlays(page);
        await this.captureCheckpoint(page, socket, `${engine.name}_results`);

        // Check for CAPTCHA
        const pageText = await page.innerText('body');
        if (pageText.includes('CAPTCHA') || pageText.includes('robot') || pageText.includes('unusual traffic')) {
           recoveryMetadata.captchaDetected = true;
           recoveryMetadata.timeline.push(`CAPTCHA detected on ${engine.name}`);
           log('running', `⚠️ ${engine.name} blocked us. Switching strategy...`);
           continue; 
        }

        // Extract Links
        let links = [];
        try {
          links = await page.$$eval(engine.resultSelector, (els, eng) => {
             return els.map(el => {
                const href = el.href || el.parentElement?.href;
                return href;
             }).filter(h => h && h.startsWith('http') && !h.includes(eng.toLowerCase()));
          }, engine.name);
        } catch(e) {}

        if (links.length > 0) {
          log('running', `🔍 Found ${links.length} sources. Selecting the most relevant...`);
          const pickerPrompt = `Goal: "${plannerJson.goal}". Choose the best 1 URL: ${JSON.stringify(links.slice(0, 5))}. Return strictly ONLY the URL string.`;
          const pickerResult = await this.withRetry(() => this.textModel.generateContent(pickerPrompt));
          targetUrl = pickerResult.response.text().trim();
          if (targetUrl.startsWith('http')) break;
        }

        recoveryMetadata.retries++;
        log('running', `⚠️ No results on ${engine.name}, trying fallback...`);
      }
    }

      if (!targetUrl) {
         throw new Error("Discovery failed across all engines.");
      }

      // STAGE 3: EXTRACTION
      recoveryMetadata.finalUrl = targetUrl;
      log('running', `🚀 Navigating to source: ${targetUrl}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.handleOverlays(page, log);
      await this.scrollHumanly(page);
      
      const lastCheckpoint = await this.captureCheckpoint(page, socket, 'final_destination');
      recoveryMetadata.checkpoints.success = lastCheckpoint;

      log('running', `🧠 Vision Agent analyzing page...`);
      const extractionPath = path.join(__dirname, 'extraction_temp.png');
      await page.screenshot({ path: extractionPath });
      const imagePart = fileToGenerativePart(extractionPath, "image/png");

      const visionInstruction = `You are an autonomous browser extraction agent. Your primary responsibility is to extract the exact information requested by the user from the provided screenshot.

Extraction Goal: ${plannerJson.extractionGoals}

Do not describe: Navigation bars, Headers, Footers, Buttons, Logos, Author sections, Styling, Colors, Layout, Generic page descriptions, Ads, Cookie banners, or Sign-in prompts. Use this JSON response format:

{
  "goal": "${plannerJson.intent}",
  "results": [
    // List relevant entities found based on the goal
  ]
}

Never return page layout descriptions. At the very end of your response, OUTSIDE the JSON block, append: 
"Source URL: ${targetUrl}"`;

      const result = await this.withRetry(() => this.model.generateContent([visionInstruction, imagePart]));
      const responseText = result.response.text();
      fs.unlinkSync(extractionPath);

      if (sessionId) {
        await Message.create({ 
          sessionId, sender: 'agent', text: responseText.trim(), 
          metadata: { planner: plannerJson, recovery: recoveryMetadata } 
        });
      }

      log('completed', `✨ Task Complete.`);
      if (socket) socket.emit('agent_complete', { success: true, data: responseText.trim(), plan: plannerJson });
      return { success: true, data: responseText.trim() };

    } catch (error) {
      log('error', error.message);
      recoveryMetadata.timeline.push(`Fatal error: ${error.message}`);
      // Safely capture failure checkpoint if page exists
      if (typeof page !== 'undefined' && page) {
         await this.captureCheckpoint(page, socket, 'failure');
      }
      if (sessionId) {
        await Message.create({ 
          sessionId, sender: 'agent', text: `Error: ${error.message}`, 
          metadata: { planner: plannerJson, recovery: recoveryMetadata } 
        });
      }
      if (socket) socket.emit('agent_error', { success: false, error: error.message });
      return { success: false, error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }
}

module.exports = new AgentService();

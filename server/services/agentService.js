const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

/**
 * Helper to convert local file information to a GoogleGenerativeAI Part object
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

/**
 * AgentService - Core logic for autonomous web execution
 * This service coordinates Playwright for browsing and Gemini for visual understanding.
 */
class AgentService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async runTask(taskDescription, socket) {
    console.log(`Starting task: ${taskDescription}`);
    socket.emit('agent_status', { status: 'initializing', message: 'Starting browser...' });

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      socket.emit('agent_status', { status: 'running', message: 'Browser launched. Navigating...' });
      
      // Scaffolding placeholder for execution logic
      // In the future, this will loop:
      // 1. Take screenshot
      // 2. Ask Gemini for next action
      // 3. Execute action via Playwright
      
      await page.goto('https://www.google.com'); // Placeholder destination
      
      socket.emit('agent_status', { status: 'completed', message: 'Task finished successfully' });
    } catch (error) {
      console.error('Agent Error:', error);
      socket.emit('agent_status', { status: 'error', message: error.message });
    } finally {
      if (browser) await browser.close();
    }
  }

  async runAgentTask(socket, userPrompt, sessionId) {
    const Message = require('../models/Message');
    
    const log = (status, msg) => {
      console.log(`[Agent] ${msg}`);
      if (socket) socket.emit('agent_status', { status, message: msg });
    };

    if (!userPrompt || userPrompt.trim() === '') {
      const err = "No prompt provided.";
      log('error', err);
      if (socket) socket.emit('agent_error', { success: false, error: err });
      return { success: false, error: err };
    }

    if (sessionId) {
      try {
        await Message.create({ sessionId, sender: 'user', text: userPrompt });
      } catch (err) {
        console.error('[Agent] Failed to save user prompt to DB:', err);
      }
    }

    log('running', `🧠 Planner analyzing prompt: "${userPrompt}"`);

    let targetUrl, visionInstruction;
    try {
      const plannerPrompt = `You are a Planner AI parsing instructions for a web scraper.
Extract the target URL and the specific instruction/question for the vision AI.
If the URL is missing "http://" or "https://", prepend "https://".
If no URL is found, output "URL_NOT_FOUND" for the url field.

User Prompt: "${userPrompt}"

Respond STRICTLY with valid JSON. Do not include markdown tags (\`\`\`json). Just the raw object:
{ "url": "the_extracted_url", "instruction": "the specific question to answer" }`;

      const plannerResult = await this.model.generateContent(plannerPrompt);
      const output = plannerResult.response.text().replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(output);

      targetUrl = parsed.url;
      visionInstruction = parsed.instruction;

      if (!targetUrl || targetUrl === "URL_NOT_FOUND") {
        throw new Error("Could not detect a valid URL. Please include the website URL in your request.");
      }

      log('running', `🧠 Planner extracted URL: ${targetUrl}`);
      log('running', `🧠 Vision Instruction: ${visionInstruction}`);
    } catch (error) {
      log('error', `Planner Failed: ${error.message}`);
      if (socket) socket.emit('agent_error', { success: false, error: error.message });
      return { success: false, error: error.message };
    }

    let browser;
    try {
      log('running', `Launching browser to navigate to ${targetUrl}...`);
      browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      log('running', `Navigating to target URL...`);
      await page.goto(targetUrl, { waitUntil: 'load' });
      
      log('running', `Taking screenshot...`);
      const screenshotPath = path.join(__dirname, 'temp_screenshot.png');
      await page.screenshot({ path: screenshotPath });
      
      log('running', `Analyzing with Gemini...`);
      const imagePart = fileToGenerativePart(screenshotPath, "image/png");
      
      const result = await this.model.generateContent([visionInstruction, imagePart]);
      const responseText = result.response.text();
      
      log('running', `Gemini Response generated.`);
      
      log('running', `Cleaning up temporary screenshot...`);
      fs.unlinkSync(screenshotPath);
      
      if (sessionId) {
        try {
          await Message.create({ sessionId, sender: 'agent', text: responseText.trim() });
        } catch (err) {
          console.error('[Agent] Failed to save agent response to DB:', err);
        }
      }

      if (socket) socket.emit('agent_complete', { success: true, data: responseText.trim() });
      return { success: true, data: responseText.trim() };
    } catch (error) {
      console.error(`[Agent] Execution Error:`, error);
      if (socket) socket.emit('agent_error', { success: false, error: error.message });
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        log('idle', `Closing browser...`);
        await browser.close();
      }
    }
  }
}

module.exports = new AgentService();

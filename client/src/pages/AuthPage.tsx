import React, { useState } from 'react';
import { LogIn, UserPlus, Globe} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email, password } 
        : { email, password, displayName };

      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      const { token } = response.data;
      
      if (token) {
        // Store the JWT token in a cookie for exactly 30 days
        const expires = new Date();
        expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
        document.cookie = `token=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
        
        navigate('/chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-black transition-colors duration-300">
      <div className="w-full max-w-md p-8 space-y-8 bg-white border border-slate-200 rounded-2xl shadow-xl dark:bg-zinc-900 dark:border-red-900/50 dark:shadow-red-900/20 transition-all duration-300">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-red-500 dark:to-orange-500">
            Neuro-Path
          </h1>
          <p className="mt-2 text-slate-500 dark:text-zinc-400">
            {isLogin ? 'Welcome back, Commander' : 'Join the autonomous revolution'}
          </p>
        </div>

        <div className="space-y-4">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full px-4 py-3 space-x-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:text-white dark:bg-zinc-800 dark:border-red-900/50 dark:hover:bg-zinc-700 transition-all group"
          >
            <Globe className="w-5 h-5 text-blue-600 dark:text-red-500 group-hover:scale-110 transition-transform" />
            <span>Continue with Google</span>
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-red-900/50"></div>
            <span className="flex-shrink mx-4 text-sm text-slate-400 dark:text-zinc-500 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-200 dark:border-red-900/50"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg">
                {error}
              </div>
            )}
            {!isLogin && (
              <div>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full Name" 
                  className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:border-red-900 dark:text-white dark:focus:ring-red-500 rounded-lg transition-all"
                  required
                />
              </div>
            )}
            <div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:border-red-900 dark:text-white dark:focus:ring-red-500 rounded-lg transition-all"
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="w-full px-4 py-3 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-black dark:border-red-900 dark:text-white dark:focus:ring-red-500 rounded-lg transition-all"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-4 font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 dark:bg-red-600 dark:hover:bg-red-700 dark:shadow-red-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            </button>
          </form>
        </div>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

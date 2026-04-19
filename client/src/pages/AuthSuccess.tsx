import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the JWT token in a cookie for future authenticated requests (valid for 30 days)
      const expires = new Date();
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = `token=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
      
      // Redirect the user to the agent interface
      navigate('/chat', { replace: true });
    } else {
      // If something went wrong, go back to login
      navigate('/auth', { replace: true });
    }
  }, [navigate, searchParams]);

  // Show a premium loading state while we catch the redirect
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white space-y-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <h2 className="text-xl font-semibold tracking-wide animate-pulse">Authenticating Sequence...</h2>
    </div>
  );
};

export default AuthSuccess;

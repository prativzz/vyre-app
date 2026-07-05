import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const success = await login(email, password);
    if (success) navigate('/');
    else setError('Invalid email or password');
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const success = await googleLogin(tokenResponse.access_token);
      if (success) navigate('/');
      else setError('Google Login Failed');
    },
    onError: () => {
      setError('Google Login Failed');
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050505] via-[#0a0a0b] to-[#111] p-4 relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card rounded-2xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Vyre
          </h1>
          <p className="text-gray-400 mt-2">Welcome back</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4" autoComplete="off">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            className="input-modern w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="input-modern w-full pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <button type="submit" className="btn-primary w-full">
            Login
          </button>
          
          <div className="flex items-center space-x-3 my-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-2.5 rounded-xl transition-colors duration-200 shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.47-2.68c-1.08.72-2.45 1.14-4.46 1.14-3.43 0-6.34-2.31-7.38-5.42H1v2.81C2.98 20.9 7.15 24 12 24z" />
              <path fill="#4285F4" d="M23.64 12.2c0-.85-.08-1.68-.21-2.49H12v4.71h6.52c-.28 1.54-1.14 2.85-2.45 3.73l3.47 2.68c2.03-1.88 3.21-4.65 3.21-7.74a12.87 12.87 0 0 0-.11-1.29z" />
              <path fill="#FBBC05" d="M4.62 14.13A7.16 7.16 0 0 1 4.24 12c0-.75.14-1.48.38-2.13V7.06H1a12.01 12.01 0 0 0 0 9.88l3.62-2.81z" />
              <path fill="#34A853" d="M12 4.46c1.77 0 3.35.61 4.6 1.8l3.46-3.46A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1 7.06l3.62 2.81c1.04-3.11 3.95-5.41 7.38-5.41z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </motion.div>
  );
}
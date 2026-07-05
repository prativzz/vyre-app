import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import PixelBackground from '../components/layout/PixelBackground';
import PixelPanel from '../components/ui/PixelPanel';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const success = await register(email, username, password);
    if (success) {
      const loggedIn = await login(email, password);
      if (loggedIn) navigate('/');
      else navigate('/login');
    } else {
      setError('Email or username already exists');
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const success = await googleLogin(tokenResponse.access_token);
      if (success) navigate('/');
      else setError('Google Signup Failed');
    },
    onError: () => {
      setError('Google Signup Failed');
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex items-center justify-center bg-vyre-bg p-4 relative overflow-hidden"
    >
      <PixelBackground />

      <PixelPanel className="p-8 w-full max-w-md animate-fade-in relative z-10 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-pixel text-vyre-accent uppercase tracking-widest">
            Join Vyre
          </h1>
          <p className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest mt-4">Start your community</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4" autoComplete="off">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 font-pixel text-[10px] tracking-wider uppercase rounded-lg p-3 text-center">
              {error}
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            className="input-minimal w-full font-medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
          <input
            type="text"
            placeholder="Username"
            className="input-minimal w-full font-medium"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="input-minimal w-full pr-10 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vyre-muted hover:text-vyre-text transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="btn-primary w-full py-3 uppercase tracking-wider font-pixel text-xs mt-2">
            Create Account
          </button>

          <div className="flex items-center space-x-3 my-6">
            <div className="flex-1 h-px bg-vyre-border"></div>
            <span className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-vyre-border"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 bg-vyre-secondary hover:bg-vyre-border text-vyre-text font-medium py-3 rounded-xl transition-colors duration-200 shadow-sm border border-vyre-border"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.47-2.68c-1.08.72-2.45 1.14-4.46 1.14-3.43 0-6.34-2.31-7.38-5.42H1v2.81C2.98 20.9 7.15 24 12 24z" />
              <path fill="#4285F4" d="M23.64 12.2c0-.85-.08-1.68-.21-2.49H12v4.71h6.52c-.28 1.54-1.14 2.85-2.45 3.73l3.47 2.68c2.03-1.88 3.21-4.65 3.21-7.74a12.87 12.87 0 0 0-.11-1.29z" />
              <path fill="#FBBC05" d="M4.62 14.13A7.16 7.16 0 0 1 4.24 12c0-.75.14-1.48.38-2.13V7.06H1a12.01 12.01 0 0 0 0 9.88l3.62-2.81z" />
              <path fill="#34A853" d="M12 4.46c1.77 0 3.35.61 4.6 1.8l3.46-3.46A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1 7.06l3.62 2.81c1.04-3.11 3.95-5.41 7.38-5.41z" />
            </svg>
            <span className="font-pixel text-[10px] tracking-wider uppercase">Sign up with Google</span>
          </button>

          <p className="text-center font-pixel text-[10px] tracking-wider text-vyre-muted mt-6 uppercase">
            Already have an account?{' '}
            <Link to="/login" className="text-vyre-accent hover:text-emerald-400 transition-colors">
              Login
            </Link>
          </p>
        </form>
      </PixelPanel>
    </motion.div>
  );
}
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import PixelBackground from '../components/layout/PixelBackground';
import PixelPanel from '../components/ui/PixelPanel';

export default function CompleteAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeGoogleOnboarding } = useAuth();
  
  // Extract onboarding data
  const onboardingData = location.state?.onboardingData;
  const email = onboardingData?.email || '';
  const onboardingToken = onboardingData?.onboardingToken || '';

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // If accessed without valid state, redirect to login
  useEffect(() => {
    if (!onboardingData || !onboardingToken) {
      navigate('/login');
    }
  }, [onboardingData, onboardingToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await completeGoogleOnboarding(onboardingToken, username);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to complete registration');
    }
  };

  if (!onboardingData || !onboardingToken) return null;

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
          <h1 className="text-3xl font-bold font-pixel text-vyre-accent tracking-widest uppercase">
            Complete Setup
          </h1>
          <p className="font-pixel text-[10px] text-vyre-muted uppercase tracking-widest mt-4">One last step</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4" autoComplete="off">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 font-pixel text-[10px] tracking-wider uppercase rounded-lg p-3 text-center overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <input
              type="email"
              className="input-minimal w-full font-medium opacity-50 cursor-not-allowed"
              value={email}
              disabled
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Username"
              className="input-minimal w-full font-medium"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          </div>

          <button type="submit" className="btn-primary w-full py-3 uppercase tracking-wider font-pixel text-xs mt-4">
            Finish Setup
          </button>
        </form>
      </PixelPanel>
    </motion.div>
  );
}

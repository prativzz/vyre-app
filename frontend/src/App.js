import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import PixelBackground from './components/layout/PixelBackground';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteAccount from './pages/CompleteAccount';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const { token, isAppReady } = useAuth();
  
  if (!isAppReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-vyre-dark text-vyre-text relative overflow-hidden">
        <PixelBackground />
        <motion.div 
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          className="z-10 flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 border-4 border-vyre-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-pixel text-vyre-primary text-xl tracking-widest uppercase">Waking Server...</p>
        </motion.div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-account" element={<CompleteAccount />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
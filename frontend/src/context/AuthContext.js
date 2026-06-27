import { API_URL } from '../config';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const res = await axios.get(`${API_URL}/user/${payload.userId}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
        } catch (err) {
          console.error("Failed to fetch user profile", err);
          setToken(null);
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log("🔑 Attempting login with:", email);
      const res = await axios.post(`${API_URL}/login`, { email, password });
      console.log("📦 Login response:", res.data);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        return true;
      }
      console.warn("❌ Login failed: success is false", res.data);
      return false;
    } catch (err) {
      console.error("❌ Login error:", err.message);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Status:", err.response.status);
      }
      return false;
    }
  };

  const register = async (email, username, password) => {
    try {
      console.log("📝 Registering:", email, username);
      const res = await axios.post(`${API_URL}/register`, { email, username, password });
      console.log("📦 Register response:", res.data);
      return res.data.success;
    } catch (err) {
      console.error("❌ Register error:", err.message);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Status:", err.response.status);
      }
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // ---------- NEW: Change Password ----------
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axios.put(`${API_URL}/user/password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      if (err.response) return err.response.data;
      return { success: false, error: 'Network error' };
    }
  };

  // ---------- NEW: Delete Account ----------
  const deleteAccount = async () => {
    try {
      const res = await axios.delete(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        logout(); // clear local state
      }
      return res.data;
    } catch (err) {
      if (err.response) return err.response.data;
      return { success: false, error: 'Network error' };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { token: googleToken });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Google Login error:", err.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, changePassword, deleteAccount, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
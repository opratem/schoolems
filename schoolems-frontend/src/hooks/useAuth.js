// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getCurrentUserRole } from '../services/auth';
import { getToken, removeToken } from '../utils/token';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const [ user, setUser ] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
        setUser(null);
        setLoading(false);
        return;
     }

      getCurrentUserRole()
        .then((res) => {
          if (res) {
            const role = (res.role || res).toUpperCase();
            const userObj = {
            id: res.id || null,
            name: res.name || null,
            email: res.email || null,
            role,
          };
            setUser(userObj);
          } else {
            setUser(null);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch role:', err);
          setUser(null);
        })
        .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    navigate('/login');
  };

  const hasRole = (requiredRole) => {
    if (!user?.role) return false
    if (Array.isArray(requiredRole)){
        return requiredRole.map(r => r.toUpperCase()).includes(user.role);
       }
       return user.role === requiredRole.toUpperCase();
    };

  return {
    user,
    role: user?.role || null,
    loading,
    logout,
    hasRole,
  };
};

import { set } from 'lodash';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const navigate = useNavigate();

  const validateSession = async () => {
    const storedToken = sessionStorage.getItem('token') || null;
    if (!storedToken) {
      logout();
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/validate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: `${storedToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user_data);
        setToken(storedToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Erro ao validar sessão:', err);
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    validateSession();
  }, [token]);

  const updateToken = (newToken) => {
    setToken(newToken);
    if(newToken){
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, validateSession, token, setToken: updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
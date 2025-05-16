import { set } from 'lodash';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lastValidatedToken = useRef(token);
  // buscando a URL da API em .env no padão VITE
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const validateSession = async () => {
    // Evita múltiplas chamadas simultâneas de validação
    if (isValidating) return;

    // Permite acesso a /cardapio sem validação
    if (location.pathname.startsWith('/cardapio')) {
      return;
    }

    // Não validar se estiver na página de login
    if (location.pathname === '/login') {
      return;
    }

    const storedToken = sessionStorage.getItem('token') || null;

    // Se não há token ou o token é o mesmo já validado, não revalide
    if (!storedToken) {
      logout();
      return;
    }

    // Evita revalidar o mesmo token
    if (storedToken === lastValidatedToken.current && user) {
      return;
    }

    // Atualiza referência do último token validado
    lastValidatedToken.current = storedToken;

    setIsValidating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/validate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${storedToken}`,
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
    } finally {
      setIsValidating(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    
    // Só redirecionar para login se não estiver na página de login
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  };

  // Executa apenas quando o pathname muda ou quando o componente é montado
  useEffect(() => {
    if (token) {
      validateSession();
    } else if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio')) {
      navigate('/login');
    }
  }, [location.pathname]); // Removido token das dependências

  // Executa quando o token muda explicitamente
  useEffect(() => {
    if (token) {
      // Atualiza o lastValidatedToken para evitar revalidações desnecessárias
      lastValidatedToken.current = token;
    }
  }, [token]);

  const updateToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, validateSession, token, setToken: updateToken, isValidating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
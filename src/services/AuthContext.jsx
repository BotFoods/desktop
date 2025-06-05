import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState(null); // Adicionado para mensagens de erro
  const navigate = useNavigate();
  const location = useLocation();
  const lastValidatedToken = useRef(sessionStorage.getItem('token') || null); // Inicializa com o token do sessionStorage

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    lastValidatedToken.current = null; // Limpa o último token validado
    
    // Só redirecionar para login se não estiver na página de login e não for cardapio ou checkout
    if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio') && !location.pathname.startsWith('/checkout')) {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  const validateSession = useCallback(async () => {
    if (isValidating) {
      return;
    }

    // Não validar sessão para cardapio, login ou checkout
    if (location.pathname.startsWith('/cardapio') || location.pathname === '/login' || location.pathname.startsWith('/checkout')) {
      return;
    }

    const storedToken = sessionStorage.getItem('token') || null;

    if (!storedToken) {
      logout();
      return;
    }

    // Evita revalidar o mesmo token se o usuário já existe e o token não mudou
    if (storedToken === lastValidatedToken.current && user) {
      return;
    }
    
    setIsValidating(true);
    setAuthError(null);
    
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
        setToken(storedToken); // Garante que o token no estado é o validado
        lastValidatedToken.current = storedToken; // Atualiza o último token validado
      } else {
        setAuthError('Sessão expirada ou inválida');
        logout();
      }
    } catch (err) {
      setAuthError('Erro ao validar sessão: ' + (err.message || 'Problema de conexão'));
      logout();
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, location.pathname, user, logout]); // Adicionado user e logout às dependências
  // useEffect para validar sessão quando o token muda ou a localização muda (exceto login/cardapio)
  useEffect(() => {
    if (token) {
      // Se temos um token, tentamos validar a sessão.
      // A própria validateSession() tem lógica para não revalidar desnecessariamente.
      validateSession();
    } else if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio') && !location.pathname.startsWith('/checkout')) {
      // Se não há token e não estamos em login/cardapio/checkout, redireciona para login.
      navigate('/login');
    }
  }, [token, location.pathname, validateSession, navigate]);


  // Função para login (exemplo, você já tem isso no Login.jsx, mas centralizar pode ser bom)
  const login = useCallback((userData, authToken) => {
    sessionStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
    setAuthError(null);
    lastValidatedToken.current = authToken; // Define o token como validado
    navigate('/caixa'); // ou para a rota desejada após login
  }, [navigate]);

  // O valor fornecido pelo contexto
  const contextValue = {
    user,
    token,
    isValidating,
    authError, // Adicionado para disponibilizar mensagens de erro
    login, // Adicionado login ao contexto
    logout,
    validateSession,
    setToken, // Expondo setToken se necessário diretamente (ex: no Login.jsx)
    setUser,  // Expondo setUser se necessário
    API_BASE_URL // Expondo API_BASE_URL para ser usado em outros lugares se necessário
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
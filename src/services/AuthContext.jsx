import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null); // Mudado para localStorage
  const [isValidating, setIsValidating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // Novo estado para controlar inicialização
  const [authError, setAuthError] = useState(null); // Adicionado para mensagens de erro
  const navigate = useNavigate();
  const location = useLocation();
  const lastValidatedToken = useRef(localStorage.getItem('token') || null); // Mudado para localStorage
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token'); // Mudado para localStorage
    lastValidatedToken.current = null; // Limpa o último token validado
    setIsInitialized(true); // Marca como inicializado após logout
    
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
    }    const storedToken = localStorage.getItem('token') || null; // Mudado para localStorage

    if (!storedToken) {
      setIsInitialized(true); // Marca como inicializado mesmo sem token
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
      });      if (response.ok) {
        const data = await response.json();
        setUser(data.user_data);
        setToken(storedToken); // Garante que o token no estado é o validado
        lastValidatedToken.current = storedToken; // Atualiza o último token validado
        setIsInitialized(true); // Marca como inicializado após validação bem-sucedida
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
  }, [isValidating, location.pathname, user, logout]); // Adicionado user e logout às dependências  // useEffect para validar sessão quando o token muda ou a localização muda (exceto login/cardapio)
  useEffect(() => {
    if (token) {
      // Se temos um token, tentamos validar a sessão.
      // A própria validateSession() tem lógica para não revalidar desnecessariamente.
      validateSession();
    } else if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio') && !location.pathname.startsWith('/checkout')) {
      // Se não há token e não estamos em login/cardapio/checkout, redireciona para login.
      setIsInitialized(true); // Marca como inicializado mesmo sem redirecionamento
      navigate('/login');
    } else {
      // Se estamos em rotas públicas, marca como inicializado
      setIsInitialized(true);
    }
  }, [token, location.pathname, validateSession, navigate]);

  // Função para login (exemplo, você já tem isso no Login.jsx, mas centralizar pode ser bom)
  const login = useCallback((userData, authToken) => {
    localStorage.setItem('token', authToken); // Mudado para localStorage
    setToken(authToken);
    setUser(userData);
    setAuthError(null);
    setIsInitialized(true); // Marca como inicializado após login
    lastValidatedToken.current = authToken; // Define o token como validado
    navigate('/caixa'); // ou para a rota desejada após login
  }, [navigate]);
  // O valor fornecido pelo contexto
  const contextValue = {
    user,
    token,
    isValidating,
    isInitialized, // Novo estado disponível para componentes
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
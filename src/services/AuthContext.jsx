import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lastValidatedToken = useRef(sessionStorage.getItem('token') || null); // Inicializa com o token do sessionStorage

  const logout = useCallback(() => {
    console.log('AuthContext: Logging out. Current path:', location.pathname);
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    lastValidatedToken.current = null; // Limpa o último token validado
    
    // Só redirecionar para login se não estiver na página de login e não for cardapio
    if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio')) {
      console.log('AuthContext: Navigating to /login from logout');
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  const validateSession = useCallback(async () => {
    console.log('AuthContext: Attempting to validate session. Current path:', location.pathname);
    if (isValidating) {
      console.log('AuthContext: Validation already in progress.');
      return;
    }

    if (location.pathname.startsWith('/cardapio') || location.pathname === '/login') {
      console.log('AuthContext: Skipping validation for /cardapio or /login.');
      return;
    }

    const storedToken = sessionStorage.getItem('token') || null;
    console.log('AuthContext: Stored token for validation:', storedToken);

    if (!storedToken) {
      console.log('AuthContext: No stored token, calling logout.');
      logout();
      return;
    }

    // Evita revalidar o mesmo token se o usuário já existe e o token não mudou
    if (storedToken === lastValidatedToken.current && user) {
      console.log('AuthContext: Token already validated and user exists, skipping re-validation.');
      return;
    }
    
    console.log('AuthContext: Proceeding with validation call to API.');
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

      console.log('AuthContext: /api/validate response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Validation successful, user data:', data.user_data);
        setUser(data.user_data);
        setToken(storedToken); // Garante que o token no estado é o validado
        lastValidatedToken.current = storedToken; // Atualiza o último token validado
      } else {
        console.error('AuthContext: Validation failed or token invalid. Status:', response.status);
        logout();
      }
    } catch (err) {
      console.error('AuthContext: Error during /api/validate fetch:', err);
      logout();
    } finally {
      setIsValidating(false);
      console.log('AuthContext: Validation process finished.');
    }
  }, [isValidating, location.pathname, user, logout]); // Adicionado user e logout às dependências

  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  // useEffect para validar sessão quando o token muda ou a localização muda (exceto login/cardapio)
  useEffect(() => {
    console.log('AuthContext: useEffect [token, location.pathname] triggered. Token:', token, 'Path:', location.pathname);
    if (token) {
      // Se temos um token, tentamos validar a sessão.
      // A própria validateSession() tem lógica para não revalidar desnecessariamente.
      validateSession();
    } else if (location.pathname !== '/login' && !location.pathname.startsWith('/cardapio')) {
      // Se não há token e não estamos em login/cardapio, redireciona para login.
      console.log('AuthContext: No token and not on public page, navigating to /login.');
      navigate('/login');
    }
  }, [token, location.pathname, validateSession, navigate]);


  // Função para login (exemplo, você já tem isso no Login.jsx, mas centralizar pode ser bom)
  const login = useCallback((userData, authToken) => {
    sessionStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
    lastValidatedToken.current = authToken; // Define o token como validado
    navigate('/caixa'); // ou para a rota desejada após login
  }, [navigate]);

  // O valor fornecido pelo contexto
  const contextValue = {
    user,
    token,
    isValidating,
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
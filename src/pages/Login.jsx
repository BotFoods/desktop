import { useState, useEffect, useRef } from 'react';
import { FaStore, FaUser, FaLock, FaSignInAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_chatgpt.png';

const STORAGE_KEY = 'botfoods_loja';

const Login = () => {
  const [loja, setLoja] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lojaSalva, setLojaSalva] = useState(false);
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  
  const usuarioInputRef = useRef(null);
  const lojaInputRef = useRef(null);

  // Verifica se existe loja salva no localStorage ao carregar a página
  useEffect(() => {
    const lojaSalva = localStorage.getItem(STORAGE_KEY);
    if (lojaSalva) {
      setLoja(lojaSalva);
      setLojaSalva(true);
      // Foca no campo de usuário se já tiver loja salva
      setTimeout(() => {
        if (usuarioInputRef.current) {
          usuarioInputRef.current.focus();
        }
      }, 100);
    }
  }, []);

  // Limpar mensagens de erro quando os campos são alterados
  useEffect(() => {
    if (error) setError('');
  }, [loja, usuario, senha]);

  // Função para alternar entre salvar e esquecer a loja
  const toggleLembrarLoja = () => {
    if (lojaSalva) {
      // Esquecer loja
      localStorage.removeItem(STORAGE_KEY);
      setLojaSalva(false);
      if (lojaInputRef.current) {
        lojaInputRef.current.focus();
      }
    } else {
      // Salvar loja
      if (loja.trim()) {
        localStorage.setItem(STORAGE_KEY, loja.trim());
        setLojaSalva(true);
        if (usuarioInputRef.current) {
          usuarioInputRef.current.focus();
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loja.trim() || !usuario.trim() || !senha.trim()) {
      setError('Preencha todos os campos');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loja,
          usuario,
          senha,
        }),
        credentials: 'include',
        withCredentials: true,
      });
      
      const data = await response.json();
      
      if (data.auth) {
        sessionStorage.setItem('token', data.token);
        setUser(data.user_data);
        setToken(data.token);
        navigate('/caixa');
        
        if (lojaSalva) {
          localStorage.setItem(STORAGE_KEY, loja);
        }
      } else {
        setError(data.message || 'Login falhou. Por favor, verifique suas credenciais.');
      }
    } catch (err) {
      console.error(err);
      setError('Falha na conexão com o servidor. Por favor, verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="BotFood Logo" className="h-24 w-24 mb-4" />
          <h2 className="text-3xl font-bold text-white">BotFood</h2>
          <p className="text-gray-400 mt-2">Sistema de Gestão de Restaurante</p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="loja" className="block text-sm font-medium text-gray-300 mb-1">
                Loja
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaStore className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="loja"
                  placeholder="Nome da Loja"
                  value={loja}
                  onChange={(e) => setLoja(e.target.value)}
                  className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  ref={lojaInputRef}
                  disabled={loading || lojaSalva}
                />
              </div>
            </div>
            
            <div className="flex items-center mt-2 ml-1 space-x-2">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={lojaSalva}
                  onChange={toggleLembrarLoja}
                  disabled={loading || !loja.trim()}
                />
                <div className="relative w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-1 text-xs text-gray-400 px-1">Lembrar Nome da Loja</span>
              </label>
            </div>
          </div>
          
          <div className="relative">
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-300 mb-1">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="text"
                id="usuario"
                placeholder="Usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                ref={usuarioInputRef}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="relative">
            <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type="password"
                id="senha"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center justify-center transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : (
              <span className="flex items-center">
                <FaSignInAlt className="mr-2" />
                Entrar
              </span>
            )}
          </button>
          
          <div className="mt-6 text-center">
            <a 
              href="/checkout" 
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-1 transition-colors"
            >
              <span>Cadastrar sua loja no BotFood</span>
              <FaExternalLinkAlt size={12} />
            </a>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} BotFood. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

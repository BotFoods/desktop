import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategoryMenu from './CategoryMenu';
import NotificationBanner, { NotificationBadge } from './NotificacaoAssinatura';
import AvisoPagamentoPDV from './AvisoPagamentoPDV';
import { useAuth } from '../services/AuthContext';
import { FaBell, FaUser, FaHourglassHalf } from 'react-icons/fa';
import logo from '../assets/logo_chatgpt.png';
import PropTypes from 'prop-types';

const BALCAO_STORAGE_KEY = 'pdv_balcao_aguardando';

const Header = ({ categories = [], onSelectCategory = () => {} }) => {
  const { logout, user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load pending orders on component mount
    loadPendingOrders();
    
    // Set up event listener for custom event from AguardarButton
    const handleOrdersUpdated = () => {
      loadPendingOrders();
    };
    
    window.addEventListener('balcao-orders-updated', handleOrdersUpdated);
    
    // Regular polling for updates (every 30 seconds)
    const interval = setInterval(loadPendingOrders, 30000);
    
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('balcao-orders-updated', handleOrdersUpdated);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);
  
  const loadPendingOrders = () => {
    const orders = localStorage.getItem(BALCAO_STORAGE_KEY);
    if (orders) {
      try {
        const parsedOrders = JSON.parse(orders);
        setPendingOrders(parsedOrders);
      } catch (e) {
        console.error('Erro ao carregar pedidos pendentes:', e);
        setPendingOrders([]);
      }
    } else {
      setPendingOrders([]);
    }
  };
  
  const handleOrderClick = (order) => {
    // Update the localStorage to remove this order
    const updatedOrders = pendingOrders.filter(o => o.id !== order.id);
    localStorage.setItem(BALCAO_STORAGE_KEY, JSON.stringify(updatedOrders));
    
    // Update state
    setPendingOrders(updatedOrders);
    setShowDropdown(false);
    
    // Reset status_venda to enable the Preparar button
    const pdvData = { ...order.pdvData };
    if (pdvData.pdv && pdvData.pdv.venda) {
      pdvData.pdv.venda.status_venda = '';
    }
    
    // Check if we need to navigate to caixa
    const currentPath = window.location.pathname;
    if (currentPath !== '/caixa') {
      navigate('/caixa');
      
      // We need to defer setting the PDV state to ensure the component is mounted
      setTimeout(() => {
        localStorage.setItem('pdv', JSON.stringify(pdvData));
        window.location.reload(); // Force reload to update PDV state
      }, 100);
    } else {
      // We're already on the caixa page, just update the state
      localStorage.setItem('pdv', JSON.stringify(pdvData));
      window.location.reload(); // Force reload to update PDV state
    }
  };
  
  // const formatTime = (timestamp) => {
  //   const date = new Date(timestamp);
  //   return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getElapsedTime = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins === 1) return '1 min';
    if (diffMins < 60) return `${diffMins} mins`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hora';
    return `${diffHours} horas`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-30 dark:bg-gray-800 dark:text-white">
        <div className="flex justify-between items-center px-4 py-2 h-16">
          <div className="text-2xl font-bold text-white flex items-center ml-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="BotFood Logo" className="h-8 w-8" />
              <span>BotFood</span>
            </Link>
          </div>
          <div className="flex space-x-2 items-center">
            <Link to="/caixa" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Balcão</Link>
            <Link to="/mesas" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Mesas</Link>
            <Link to="/cadastros" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Cadastros</Link>
            <Link to="/movimentacoes" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Movimentações</Link>
            <Link to="/delivery" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Delivery</Link>
            <Link to="/configuracoes" className="text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">Configurações</Link>
            
            <div className="relative ml-2" ref={dropdownRef}>
              <button 
                className={`text-gray-300 hover:text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 ${pendingOrders.length > 0 ? 'animate-pulse' : ''}`}
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label={`Notificações ${pendingOrders.length > 0 ? `(${pendingOrders.length})` : ''}`}
              >
                <FaBell className={`text-lg ${pendingOrders.length > 0 ? 'text-yellow-500' : ''}`} />
                {pendingOrders.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {pendingOrders.length}
                  </span>
                )}
                {/* Badge de notificações do sistema */}
                <div className="absolute top-1 right-1">
                  <NotificationBadge />
                </div>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-40">
                  <div className="p-3 border-b border-gray-700">
                    <h3 className="text-white font-medium">
                      {pendingOrders.length > 0 
                        ? `Pedidos aguardando pagamento (${pendingOrders.length})` 
                        : 'Nenhum pedido pendente'}
                    </h3>
                  </div>
                  
                  {pendingOrders.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto">
                      {pendingOrders.map((order) => (
                        <li key={order.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-750">
                          <button 
                            className="w-full px-4 py-3 text-left transition-colors flex flex-col"
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="flex justify-between items-start w-full">
                              <div>
                                <p className="font-semibold text-white flex items-center">
                                  <FaHourglassHalf className="text-yellow-500 mr-2" /> 
                                  Pedido #{order.id.split('_')[1].slice(-4)}
                                </p>
                                <p className="text-sm text-gray-300 mt-1">
                                  {order.description || 'Items variados'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-semibold">
                                  {order.totalAmount ? formatCurrency(order.totalAmount) : ''}
                                </span>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getElapsedTime(order.timestamp)} atrás
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between mt-2 text-xs">
                              <span className="text-gray-400">
                                {order.itemCount || order.pdvData.pdv.venda.produtos.length} itens
                              </span>
                              <span className="text-purple-400">
                                Aguardando finalização
                              </span>
                            </div>
                            
                            <div className="mt-2 text-center">
                              <span className="bg-purple-600/30 text-purple-300 text-xs py-1 px-2 rounded-full">
                                Clique para continuar o pedido
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-400">Não há pedidos aguardando pagamento.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-l border-gray-700 pl-3 ml-1 flex items-center">
              {user && (
                <div className="flex items-center mr-3">
                  <div className="bg-gray-700 rounded-full p-1 mr-2">
                    <FaUser className="text-gray-300" />
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-medium">{user.nome}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </div>
              )}
              
              <button 
                onClick={logout} 
                className="text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>
      <AvisoPagamentoPDV />
      <CategoryMenu categories={categories} onSelectCategory={onSelectCategory} />
      <NotificationBanner />
    </>
  );
};
Header.propTypes = {
  categories: PropTypes.array,
  onSelectCategory: PropTypes.func,
};

export default Header;
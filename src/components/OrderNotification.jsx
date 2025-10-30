// desktop/src/components/OrderNotification.jsx
import { useState, useEffect } from 'react';
import notificationPollingService from '../services/notificationPollingService';
import { FaBell, FaTimes } from 'react-icons/fa';

const OrderNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    console.log('[🎯 OrderNotification] Componente montado');
    
    // Handler para novos pedidos
    const handleNewOrder = (pedido) => {
      console.log('[🔔 OrderNotification] Handler chamado com pedido:', {
        id: pedido.id || pedido.id_venda,
        cliente: pedido.cliente?.nome || pedido.dados_cliente?.nome || 'undefined',
        total: pedido.total || pedido.total_venda
      });
      
      const notification = {
        id: Date.now(),
        pedido,
        timestamp: new Date(),
        isNew: true
      };

      setNotifications(prev => {
        console.log('[➕ OrderNotification] Adicionando notificação. Total antes:', prev.length);
        return [...prev, notification];
      });

      // Auto remove após 10 segundos
      setTimeout(() => {
        setNotifications(prev => {
          console.log('[➖ OrderNotification] Removendo notificação após timeout');
          return prev.filter(n => n.id !== notification.id);
        });
      }, 10000);
    };

    // Registrar handler
    notificationPollingService.addMessageHandler(handleNewOrder);

    // Cleanup
    return () => {
      console.log('[🧹 OrderNotification] Componente desmontado - removendo handler');
      notificationPollingService.removeMessageHandler(handleNewOrder);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <FaBell className="text-xl" />
              <div>
                <h4 className="font-bold">Novo Pedido Online!</h4>
                <p className="text-sm">
                  Pedido #{notification.pedido.id}
                </p>
                <p className="text-xs opacity-90">
                  {notification.pedido.cliente?.nome || 'Cliente não informado'}
                </p>
                <p className="text-xs opacity-90">
                  Total: R$ {notification.pedido.total?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-white hover:text-red-200 ml-2"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderNotification;
/**
 * DeliveryOrders - Página de gerenciamento de pedidos delivery
 * 
 * Funcionalidades:
 * - Board Kanban com drag & drop para mudança de status
 * - Visualização em tabela filtrada por status
 * - Menu lateral com navegação entre diferentes visualizações:
 *   - Board: Visualização completa em formato Kanban
 *   - Todos: Tabela com todos os pedidos
 *   - Por Status: Tabelas filtradas por status específico
 * - Pedidos entregues têm funcionalidade limitada (apenas visualização)
 * - Remoção automática de pedidos entregues após 3 segundos
 * - Modal de detalhes com informações completas do pedido
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMotorcycle, FaClock, FaUser, FaPhone, FaMapMarkerAlt, FaCheck, FaTimes, FaEye, FaTrash, FaCookie, FaPrint, FaCog } from 'react-icons/fa';
import AlertModal from '../components/AlertModal';
import Header from '../components/Header';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { printManager } from '../services/printManager';
import '../styles/kanban.css';

const DELIVERY_ORDERS_STORAGE_KEY = 'pdv_delivery_aguardando';

const DeliveryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [viewMode, setViewMode] = useState('board'); // 'board', 'table'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' ou um status específico
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  // Estados para controle de impressão e configurações
  const [printedOrders, setPrintedOrders] = useState(new Set()); // IDs dos pedidos já impressos
  const [autoConfirm, setAutoConfirm] = useState(() => {
    const saved = localStorage.getItem('delivery_auto_confirm');
    return saved ? JSON.parse(saved) : false;
  }); // Flag para confirmação automática
  const [showSettings, setShowSettings] = useState(false); // Modal de configurações
  
  const location = useLocation();
  const navigate = useNavigate();

  // Configuração das colunas do Kanban
  const columns = {
    aguardando_confirmacao: {
      id: 'aguardando_confirmacao',
      title: 'Aguardando Confirmação',
      color: 'bg-yellow-600',
      textColor: 'text-yellow-100'
    },
    preparando: {
      id: 'preparando',
      title: 'Preparando',
      color: 'bg-blue-600',
      textColor: 'text-blue-100'
    },
    pronto: {
      id: 'pronto',
      title: 'Pronto',
      color: 'bg-green-600',
      textColor: 'text-green-100'
    },
    saiu_entrega: {
      id: 'saiu_entrega',
      title: 'Saiu para Entrega',
      color: 'bg-orange-600',
      textColor: 'text-orange-100'
    },
    entregue: {
      id: 'entregue',
      title: 'Entregue',
      color: 'bg-gray-600',
      textColor: 'text-gray-100'
    }
  };

  useEffect(() => {
    loadDeliveryOrders();
    
    // Set up event listener for order updates
    const handleOrdersUpdated = () => {
      loadDeliveryOrders();
    };
    
    window.addEventListener('delivery-orders-updated', handleOrdersUpdated);
    
    // Regular polling for updates (every 30 seconds)
    const interval = setInterval(loadDeliveryOrders, 30000);
    
    return () => {
      window.removeEventListener('delivery-orders-updated', handleOrdersUpdated);
      clearInterval(interval);
    };
  }, []);

  // Se chegou de uma notificação, abrir detalhes automaticamente
  useEffect(() => {
    if (location.state?.selectedOrder) {
      setSelectedOrder(location.state.selectedOrder);
      setShowOrderDetails(true);
    }
  }, [location.state]);

  // Monitorar novos pedidos WhatsApp para confirmação automática
  useEffect(() => {
    const newWhatsAppOrders = orders.filter(order => 
      order.source === 'cardapio' && 
      order.status === 'aguardando_confirmacao'
    );

    newWhatsAppOrders.forEach(order => {
      // Verificar se já não está sendo processado para confirmação automática
      const alreadyProcessing = sessionStorage.getItem(`auto_confirm_${order.id}`);
      if (!alreadyProcessing) {
        sessionStorage.setItem(`auto_confirm_${order.id}`, 'true');
        handleAutoConfirmation(order.id);
      }
    });
  }, [orders, autoConfirm]);

  // Persistir configuração de confirmação automática
  useEffect(() => {
    localStorage.setItem('delivery_auto_confirm', JSON.stringify(autoConfirm));
  }, [autoConfirm]);

  const loadDeliveryOrders = () => {
    const ordersData = localStorage.getItem(DELIVERY_ORDERS_STORAGE_KEY);
    
    if (ordersData) {
      try {
        const parsedOrders = JSON.parse(ordersData);
        setOrders(parsedOrders);
      } catch (e) {
        console.error('Erro ao fazer parse dos pedidos:', e);
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  };

  // Função para organizar pedidos por status
  const getOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  // Função para filtrar pedidos baseado na seleção atual
  const getFilteredOrders = () => {
    if (selectedStatus === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === selectedStatus);
  };

  // Função para navegar entre views
  const handleViewChange = (mode, status = 'all') => {
    setViewMode(mode);
    setSelectedStatus(status);
    
    // Se está voltando para o board, fechar modal se estiver aberto
    if (mode === 'board' && showOrderDetails) {
      setShowOrderDetails(false);
      setSelectedOrder(null);
    }
  };

  // Função para lidar com o drag and drop
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Se não há destino ou o item foi solto na mesma posição
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Encontrar o pedido que foi movido
    const movedOrder = orders.find(order => order.id === draggableId);
    if (!movedOrder) return;

    // Atualizar o status do pedido
    const newStatus = destination.droppableId;
    updateOrderStatus(draggableId, newStatus);
  };

  const showAlert = (message, type = 'info', title = 'Atenção') => {
    setAlertInfo({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlertInfo(prev => ({ ...prev, isOpen: false }));
  };

  const formatCurrency = (value) => {
    // Verificar se o valor é válido
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    
    // Garantir que é um número
    const numericValue = parseFloat(value) || 0;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue);
  };

  const getElapsedTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
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
    } catch (error) {
      console.error('Erro ao calcular tempo decorrido:', error);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aguardando_confirmacao':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'preparando':
        return 'text-blue-400 bg-blue-900/30';
      case 'pronto':
        return 'text-green-400 bg-green-900/30';
      case 'saiu_entrega':
        return 'text-purple-400 bg-purple-900/30';
      case 'entregue':
        return 'text-green-600 bg-green-900/50';
      case 'cancelado':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aguardando_confirmacao':
        return 'Aguardando Confirmação';
      case 'preparando':
        return 'Preparando';
      case 'pronto':
        return 'Pronto para Entrega';
      case 'saiu_entrega':
        return 'Saiu para Entrega';
      case 'entregue':
        return 'Entregue';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Função para imprimir pedido na cozinha
  const printOrderToKitchen = async (order) => {
    try {
      const orderData = {
        orderId: order.id,
        items: order.items || [],
        customer: order.customer,
        notes: order.description || order.observacoes || 'Pedido via WhatsApp',
        orderType: 'delivery'
      };

      await printManager.printForKitchen(orderData);
      
      // Marcar como impresso
      setPrintedOrders(prev => new Set([...prev, order.id]));
      
      showAlert('Pedido enviado para impressão na cozinha!', 'success', 'Impressão');
      return true;
    } catch (error) {
      showAlert('Erro ao imprimir pedido. Verifique a impressora.', 'error', 'Erro de Impressão');
      return false;
    }
  };

  // Função para confirmação automática
  const handleAutoConfirmation = (orderId) => {
    if (!autoConfirm) return;
    
    setTimeout(() => {
      const currentOrders = JSON.parse(localStorage.getItem(DELIVERY_ORDERS_STORAGE_KEY) || '[]');
      const orderStillExists = currentOrders.find(o => o.id === orderId && o.status === 'aguardando_confirmacao');
      
      if (orderStillExists) {
        updateOrderStatus(orderId, 'preparando', false); // false = não mostrar alert
        showAlert('Pedido confirmado automaticamente!', 'info', 'Confirmação Automática');
      }
    }, 5000); // 5 segundos
  };

  const updateOrderStatus = async (orderId, newStatus, showAlertMessage = true) => {
    const order = orders.find(o => o.id === orderId);
    
    // Lógica de impressão para pedidos WhatsApp saindo de "Aguardando Confirmação"
    if (order && order.source === 'cardapio' && 
        order.status === 'aguardando_confirmacao' && 
        newStatus !== 'aguardando_confirmacao' &&
        !printedOrders.has(orderId)) {
      
      const printed = await printOrderToKitchen(order);
      if (!printed) {
        return; // Não atualiza o status se a impressão falhou
      }
    }
    
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    setOrders(updatedOrders);
    localStorage.setItem(DELIVERY_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    
    // Update selected order if it's the one being updated
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    
    // Se o pedido foi marcado como entregue, remover das notificações após um tempo
    if (newStatus === 'entregue') {
      setTimeout(() => {
        const finalOrders = updatedOrders.filter(order => order.id !== orderId);
        setOrders(finalOrders);
        localStorage.setItem(DELIVERY_ORDERS_STORAGE_KEY, JSON.stringify(finalOrders));
        
        // Dispatch event to update Header
        const event = new Event('delivery-orders-updated');
        window.dispatchEvent(event);
        
        if (showAlertMessage) {
          showAlert('Pedido finalizado e removido da lista!', 'success', 'Pedido Entregue');
        }
      }, 3000); // Remove após 3 segundos
    }
    
    // Dispatch event to update Header
    const event = new Event('delivery-orders-updated');
    window.dispatchEvent(event);
    
    if (showAlertMessage) {
      showAlert(`Status do pedido atualizado para: ${getStatusText(newStatus)}`, 'success', 'Status Atualizado');
    }
  };

  const removeOrder = (orderId) => {
    const updatedOrders = orders.filter(order => order.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem(DELIVERY_ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    
    // Close modal if removing the selected order
    if (selectedOrder && selectedOrder.id === orderId) {
      setShowOrderDetails(false);
      setSelectedOrder(null);
    }
    
    // Dispatch event to update Header
    const event = new Event('delivery-orders-updated');
    window.dispatchEvent(event);
    
    showAlert('Pedido removido com sucesso!', 'success', 'Pedido Removido');
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header />
      
      {/* Menu Lateral Customizado */}
      <div className="fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-gray-300 overflow-y-auto border-r border-gray-700">
        <nav className="p-4">
          {/* Board View */}
          <button
            className={`flex items-center justify-between w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white ${
              viewMode === 'board' ? 'bg-gray-700 text-white border-l-4 border-orange-500' : ''
            }`}
            onClick={() => handleViewChange('board')}
          >
            <div className="flex items-center space-x-3">
              <FaCookie className="text-xl" />
              <span>Board</span>
            </div>
            {viewMode === 'board' && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
          </button>

          {/* Todos os Pedidos */}
          <button
            className={`flex items-center justify-between w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white ${
              viewMode === 'table' && selectedStatus === 'all' ? 'bg-gray-700 text-white border-l-4 border-blue-500' : ''
            }`}
            onClick={() => handleViewChange('table', 'all')}
          >
            <div className="flex items-center space-x-3">
              <FaMotorcycle className="text-xl" />
              <span>Todos ({orders.length})</span>
            </div>
            {viewMode === 'table' && selectedStatus === 'all' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
          </button>

          {/* Separador */}
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Por Status
            </h3>
            <div className="mt-3 space-y-2">
              {Object.values(columns).map((column) => {
                const count = getOrdersByStatus(column.id).length;
                return (
                  <button
                    key={column.id}
                    className={`flex items-center justify-between w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white ${
                      viewMode === 'table' && selectedStatus === column.id ? 'bg-gray-700 text-white border-l-4 border-opacity-75' : ''
                    }`}
                    style={{
                      borderLeftColor: viewMode === 'table' && selectedStatus === column.id ? column.color.replace('bg-', '#') : 'transparent'
                    }}
                    onClick={() => handleViewChange('table', column.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                      <span className="text-sm">{column.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">{count}</span>
                      {viewMode === 'table' && selectedStatus === column.id && (
                        <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Configurações */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <button
              className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
              onClick={() => setShowSettings(true)}
            >
              <FaCog className="text-xl" />
              <span>Configurações</span>
            </button>
          </div>
        </nav>
      </div>
      
      <div className="ml-64 pt-16 my-3 p-8 flex-grow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBackClick}
              className="mr-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold flex items-center">
              <FaMotorcycle className="mr-3 text-orange-500" />
              {viewMode === 'board' 
                ? 'Board de Pedidos Delivery'
                : selectedStatus === 'all' 
                  ? 'Todos os Pedidos Delivery'
                  : `Pedidos - ${columns[selectedStatus]?.title || selectedStatus}`
              }
            </h1>
          </div>
          <div className="text-right">
            <p className="text-gray-400">
              {viewMode === 'board' ? 'Total de pedidos' : 'Pedidos filtrados'}
            </p>
            <p className="text-2xl font-bold text-orange-500">
              {viewMode === 'board' ? orders.length : getFilteredOrders().length}
            </p>
          </div>
        </div>

        {/* Renderização Condicional: Board ou Tabela */}
        {viewMode === 'board' ? (
          /* Kanban Board */
          <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full overflow-x-auto">
            {Object.values(columns).map((column) => (
              <div key={column.id} className="kanban-column flex flex-col min-w-[280px]">
                {/* Column Header */}
                <div 
                  className={`kanban-header ${column.color} ${column.textColor} p-3 rounded-t-lg shadow-lg`}
                  style={{
                    '--bg-color': column.color,
                    '--bg-color-dark': column.color.replace('600', '700')
                  }}
                >
                  <h3 className="font-bold text-center text-sm sm:text-base">{column.title}</h3>
                  <p className="text-center text-xs opacity-80">
                    {getOrdersByStatus(column.id).length} pedidos
                  </p>
                </div>
                
                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-gray-800 rounded-b-lg p-3 min-h-[500px] transition-all duration-300 border-2 ${
                        snapshot.isDraggingOver 
                          ? 'kanban-column drag-over bg-gray-700 border-blue-500 shadow-lg' 
                          : 'border-transparent'
                      }`}
                    >
                      {getOrdersByStatus(column.id).map((order, index) => (
                        <Draggable
                          key={order.id}
                          draggableId={order.id}
                          index={index}
                          isDragDisabled={order.status === 'entregue'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`kanban-card relative bg-gray-700 rounded-lg p-3 mb-2 border border-gray-600 transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'dragging shadow-2xl scale-105 rotate-3 border-blue-500 bg-gray-600' 
                                  : 'hover:shadow-lg'
                              } ${
                                order.status === 'entregue' 
                                  ? 'disabled delivered opacity-60 cursor-not-allowed bg-gray-800' 
                                  : 'cursor-move hover:border-gray-500 hover:bg-gray-650'
                              }`}
                              onClick={() => !snapshot.isDragging && handleOrderClick(order)}
                            >
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-white text-sm">
                                      #{order.id?.toString()?.split('_')?.[1]?.slice(-4) || order.id?.toString()?.slice(-4) || 'N/A'}
                                    </h4>
                                    {order.source === 'cardapio' && (
                                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                        WHATSAPP
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    {getElapsedTime(order.timestamp)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-400 text-sm">
                                    {formatCurrency(order.totalAmount)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {order.itemCount} itens
                                  </p>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div className="space-y-1">
                                <div className="flex items-center text-xs text-gray-300">
                                  <FaUser className="mr-1 text-blue-400" size={10} />
                                  <span className="truncate font-medium">{order.customer?.nome || order.customer?.name || 'Cliente não identificado'}</span>
                                </div>
                                <div className="flex items-center text-xs text-gray-300">
                                  <FaPhone className="mr-1 text-green-400" size={10} />
                                  <span>{order.customer?.telefone || order.customer?.phone || 'Sem telefone'}</span>
                                </div>
                                <div className="flex items-start text-xs text-gray-300">
                                  <FaMapMarkerAlt className="mr-1 text-red-400 mt-0.5 flex-shrink-0" size={10} />
                                  <span className="truncate">{order.customer?.endereco || order.customer?.address || 'Sem endereço'}</span>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-600">
                                <div className="flex items-center text-xs text-gray-400">
                                  <FaClock className="mr-1" size={10} />
                                  <span>{getElapsedTime(order.timestamp)}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(order);
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs flex items-center transition-colors"
                                >
                                  <FaEye className="mr-1" size={8} />
                                  Ver
                                </button>
                              </div>
                              
                              {/* Entregue indicator */}
                              {order.status === 'entregue' && (
                                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                  <FaCheck size={10} />
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Empty State */}
                      {getOrdersByStatus(column.id).length === 0 && (
                        <div className="kanban-empty-state text-center py-6 text-gray-500">
                          <div className="mb-2 opacity-50">
                            {column.id === 'aguardando_confirmacao' && <FaClock className="mx-auto text-2xl" />}
                            {column.id === 'preparando' && <FaCookie className="mx-auto text-2xl" />}
                            {column.id === 'pronto' && <FaCheck className="mx-auto text-2xl" />}
                            {column.id === 'saiu_entrega' && <FaMotorcycle className="mx-auto text-2xl" />}
                            {column.id === 'entregue' && <FaCheck className="mx-auto text-2xl" />}
                          </div>
                          <p className="text-xs">Solte aqui</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
        ) : (
          /* Visualização em Tabela */
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {getFilteredOrders().length > 0 ? (
                    getFilteredOrders().map((order, index) => (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-gray-700 transition-colors ${
                          order.status === 'entregue' ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaMotorcycle className="text-orange-500 mr-3" />
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-white">
                                  #{order.id?.toString()?.split('_')?.[1]?.slice(-4) || order.id?.toString()?.slice(-4) || 'N/A'}
                                </div>
                                {order.source === 'cardapio' && (
                                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    WHATSAPP
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                {order.itemCount} itens
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white flex items-center">
                              <FaUser className="mr-2 text-blue-400" size={12} />
                              {order.customer?.nome || order.customer?.name || 'Cliente não identificado'}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center">
                              <FaPhone className="mr-2 text-green-400" size={12} />
                              {order.customer?.telefone || order.customer?.phone || 'Sem telefone'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-start mt-1">
                              <FaMapMarkerAlt className="mr-2 text-red-400 mt-0.5" size={10} />
                              <span className="truncate max-w-xs">{order.customer?.endereco || order.customer?.address || 'Sem endereço'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          <div className="flex items-center">
                            <FaClock className="mr-1" />
                            {getElapsedTime(order.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOrderClick(order)}
                              className="text-blue-400 hover:text-blue-600 transition-colors"
                            >
                              <FaEye className="mr-1" />
                              Ver
                            </button>
                            {order.status !== 'entregue' && selectedStatus !== 'entregue' && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowModal(true);
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <FaTrash className="mr-1" />
                                Remover
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <FaMotorcycle className="mx-auto text-6xl text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                          {selectedStatus === 'all' 
                            ? 'Nenhum pedido encontrado' 
                            : `Nenhum pedido com status "${columns[selectedStatus]?.title || selectedStatus}"`
                          }
                        </h3>
                        <p className="text-gray-500">
                          {selectedStatus === 'all' 
                            ? 'Os pedidos de delivery aparecerão aqui quando forem enviados para preparo.'
                            : 'Quando houver pedidos com este status, eles aparecerão nesta tabela.'
                          }
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State para quando não há pedidos (apenas no board) */}
        {viewMode === 'board' && orders.length === 0 && (
          <div className="text-center py-12">
            <FaMotorcycle className="mx-auto text-6xl text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              Nenhum pedido de delivery
            </h2>
            <p className="text-gray-500">
              Os pedidos de delivery aparecerão aqui quando forem enviados para preparo.
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaMotorcycle className="mr-3 text-orange-500" />
                    Delivery #{selectedOrder.id?.toString()?.split('_')?.[1]?.slice(-4) || selectedOrder.id?.toString()?.slice(-4) || 'N/A'}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Pedido feito {getElapsedTime(selectedOrder.timestamp)} atrás
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Status Atual</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                  <p className="text-gray-400 mt-2 text-sm">
                    {viewMode === 'board' 
                      ? 'Para alterar o status, arraste o card no board para a coluna desejada'
                      : selectedOrder.status === 'entregue'
                        ? 'Pedido entregue - apenas visualização'
                        : 'Para alterar o status, volte ao board e arraste o card para a coluna desejada'
                    }
                  </p>
                  {viewMode === 'table' && selectedOrder.status === 'entregue' && (
                    <div className="mt-2 p-2 bg-green-800 bg-opacity-30 border border-green-600 rounded text-green-400 text-xs">
                      ✓ Este pedido foi finalizado e está disponível apenas para consulta
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Informações do Cliente</h3>
                <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <FaUser className="mr-3 text-blue-400" />
                    <span>{selectedOrder.customer?.nome || selectedOrder.customer?.name || 'Cliente não identificado'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaPhone className="mr-3 text-green-400" />
                    <span>{selectedOrder.customer?.telefone || selectedOrder.customer?.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mr-3 text-red-400 mt-1" />
                    <span>{selectedOrder.customer?.endereco || selectedOrder.customer?.address || 'Sem endereço'}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Itens do Pedido</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
                      <div>
                        <span className="font-medium">{item.quantidade || item.quantity || 1}x {item.nome || item.name || 'Produto'}</span>
                      </div>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(item.subtotal || item.price || 0)}
                      </span>
                    </div>
                  )) : (
                    <div className="text-gray-400 text-center py-4">
                      Nenhum item encontrado
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-600">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-green-400">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                {selectedOrder.status !== 'entregue' && (
                  <button
                    onClick={() => {
                      setShowModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center transition-colors"
                  >
                    <FaTrash className="mr-2" />
                    Remover Pedido
                  </button>
                )}
                {selectedOrder.status === 'entregue' && (
                  <div className="text-gray-400 text-sm">
                    Pedidos entregues não podem ser removidos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirmar Remoção</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja remover este pedido? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removeOrder(selectedOrder.id);
                  setShowModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Configurações do Delivery</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Confirmação Automática</label>
                  <p className="text-sm text-gray-400">
                    Confirma automaticamente pedidos WhatsApp após 5 segundos
                  </p>
                </div>
                <button
                  onClick={() => setAutoConfirm(!autoConfirm)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoConfirm ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoConfirm ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-white font-medium mb-2">Informações</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Pedidos WhatsApp são impressos automaticamente na cozinha</p>
                  <p>• Impressão ocorre apenas uma vez por pedido</p>
                  <p>• Confirmação automática move para "Preparando"</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertInfo.isOpen}
        onClose={closeAlert}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </div>
  );
};

export default DeliveryOrders;

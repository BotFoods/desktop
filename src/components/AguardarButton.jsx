import { useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { FaHourglassHalf, FaPrint } from 'react-icons/fa';
import AlertModal from './AlertModal';
import printManager from '../services/printManager';

const BALCAO_STORAGE_KEY = 'pdv_balcao_aguardando';

const AguardarButton = ({ pdv, setPdv, setOrders, className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const handleAguardarClick = () => {
    if (pdv.pdv.venda.produtos.length === 0) {
      return; // Do nothing if there are no products
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Show alert modal
  const showAlert = (message, type = 'info', title = 'Atenção') => {
    setAlertInfo({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Close alert modal
  const closeAlert = () => {
    setAlertInfo(prev => ({ ...prev, isOpen: false }));
  };
  
  // Print order to kitchen using the new abstract system
  const printKitchenOrder = async (orderId) => {
    setIsPrinting(true);
    
    try {
      // Preparar dados do pedido para impressão
      const orderData = {
        pedidoId: orderId,
        tipo: 'balcao', // Cliente aguardando no balcão
        produtos: pdv.pdv.venda.produtos,
        observacoes: pdv.pdv.venda.observacoes
      };

      // Usar o novo sistema abstrato de impressão
      await printManager.printForKitchen(orderData);
      
      return true;
    } catch (error) {
      // Não lançamos erro aqui para permitir continuar o processo mesmo se a impressão falhar
      return false;
    } finally {
      setIsPrinting(false);
    }
  };
  
  const handleConfirmAguardar = async () => {
    // Generate unique ID for this awaiting order
    const orderId = `order_${uuidv4().slice(0, 8)}`;
    
    // Set status in PDV state
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.status_venda = 'aguardando';
      return updatedPdv;
    });
    
    // Try to print kitchen order
    await printKitchenOrder(orderId);
    
    // Create order object to store in localStorage with customer table info and all details
    const orderObject = {
      id: orderId,
      timestamp: new Date().toISOString(),
      totalAmount: pdv.pdv.totais.valor_total,
      itemCount: pdv.pdv.totais.quantidade_itens,
      description: pdv.pdv.venda.produtos.map(p => p.nome).slice(0, 2).join(', ') + 
                  (pdv.pdv.venda.produtos.length > 2 ? '...' : ''),
      pdvData: pdv
    };
    
    // Add to localStorage
    const currentOrders = localStorage.getItem(BALCAO_STORAGE_KEY);
    const ordersArray = currentOrders ? JSON.parse(currentOrders) : [];
    ordersArray.push(orderObject);
    localStorage.setItem(BALCAO_STORAGE_KEY, JSON.stringify(ordersArray));
    
    // Dispatch custom event to notify any listeners (like Header component)
    const event = new Event('balcao-orders-updated');
    window.dispatchEvent(event);
    
    // Reset state in the main PDV interface
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.produtos = [];
      updatedPdv.pdv.venda.total_venda = 0;
      updatedPdv.pdv.venda.forma_pagamento = '';
      updatedPdv.pdv.venda.status_venda = '';
      updatedPdv.pdv.venda.observacoes = '';
      updatedPdv.pdv.totais.quantidade_itens = 0;
      updatedPdv.pdv.totais.valor_total = 0;
      localStorage.setItem('pdv', JSON.stringify(updatedPdv));
      return updatedPdv;
    });
    
    // Clear orders
    setOrders([]);
    
    // Close modal
    handleCloseModal();
    
    // Show success message
    showAlert('Pedido enviado para a cozinha com sucesso!', 'success', 'Pedido em Aguardo');
  };
  
  return (
    <>
      <button 
        onClick={handleAguardarClick}
        className={className || "bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out cursor-pointer"}
        disabled={pdv.pdv.venda.produtos.length === 0}
      >
        {children || (
          <>
            <FaHourglassHalf className="mr-1" />
            <span>Aguardar</span>
          </>
        )}
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-75 absolute inset-0" onClick={handleCloseModal}></div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl z-10 w-96">
            <h2 className="text-xl font-bold mb-4 text-white text-center border-b border-gray-700 pb-2">
              Cliente vai aguardar no balcão
            </h2>
            
            <div className="my-5 text-center">
              <FaHourglassHalf className="text-purple-500 text-5xl mx-auto mb-3" />
              <p className="text-gray-300 mb-2">
                Este pedido será enviado para a cozinha e o cliente pagará depois de comer.
              </p>
              <p className="text-yellow-400 text-sm">
                A forma de pagamento será selecionada no momento da finalização.
              </p>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handleCloseModal}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-5 rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAguardar}
                className={`bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-md transition-colors flex items-center ${isPrinting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <FaPrint className="mr-2" />
                    Confirmar
                  </>
                )}
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
    </>
  );
};

AguardarButton.propTypes = {
  pdv: PropTypes.object.isRequired,
  setPdv: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default AguardarButton;
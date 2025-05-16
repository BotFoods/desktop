import { useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { FaHourglassHalf } from 'react-icons/fa';

const BALCAO_STORAGE_KEY = 'pdv_balcao_aguardando';

const AguardarButton = ({ pdv, setPdv, setOrders, className, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleAguardarClick = () => {
    if (pdv.pdv.venda.produtos.length === 0) {
      return; // Do nothing if there are no products
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPaymentMethod('');
    setErrorMessage('');
  };
  
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setErrorMessage('');
  };
  
  const handleConfirmAguardar = () => {
    if (!paymentMethod) {
      setErrorMessage('Escolha um método de pagamento');
      return;
    }
    
    // Generate unique ID for this awaiting order
    const orderId = `order_${uuidv4().slice(0, 8)}`;
    
    // Set payment method in PDV state
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.forma_pagamento = paymentMethod;
      return updatedPdv;
    });
    
    // Create order object to store in localStorage
    const orderObject = {
      id: orderId,
      timestamp: new Date().toISOString(),
      paymentMethod: paymentMethod,
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
      updatedPdv.pdv.totais.quantidade_itens = 0;
      updatedPdv.pdv.totais.valor_total = 0;
      localStorage.setItem('pdv', JSON.stringify(updatedPdv));
      return updatedPdv;
    });
    
    // Clear orders
    setOrders([]);
    
    // Close modal
    handleCloseModal();
  };
  
  return (
    <>
      <button 
        onClick={handleAguardarClick}
        className={className || "bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
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
            <h2 className="text-xl font-bold mb-6 text-white text-center border-b border-gray-700 pb-2">
              Escolha a forma de pagamento
            </h2>
            
            {errorMessage && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center">
                {errorMessage}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handlePaymentMethodSelect('Crédito')}
                className={`py-3 px-4 rounded-lg transition duration-150 ease-in-out font-medium ${
                  paymentMethod === 'Crédito'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Crédito
              </button>
              <button
                onClick={() => handlePaymentMethodSelect('Débito')}
                className={`py-3 px-4 rounded-lg transition duration-150 ease-in-out font-medium ${
                  paymentMethod === 'Débito'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Débito
              </button>
              <button
                onClick={() => handlePaymentMethodSelect('Pix')}
                className={`py-3 px-4 rounded-lg transition duration-150 ease-in-out font-medium ${
                  paymentMethod === 'Pix'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pix
              </button>
              <button
                onClick={() => handlePaymentMethodSelect('Dinheiro')}
                className={`py-3 px-4 rounded-lg transition duration-150 ease-in-out font-medium ${
                  paymentMethod === 'Dinheiro'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Dinheiro
              </button>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handleCloseModal}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-5 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAguardar}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-md transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
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
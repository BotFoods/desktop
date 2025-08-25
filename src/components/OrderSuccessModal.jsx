import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaWhatsapp, FaArrowLeft } from 'react-icons/fa';

const OrderSuccessModal = ({ isOpen, onClose, orderDetails }) => {
  const [countdown, setCountdown] = useState(15);
  
  // Automatic countdown to close the modal
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  const { orderNumber, total, paymentMethod } = orderDetails;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-75 overflow-y-auto">
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-fade-in-down my-2 max-h-[90vh]"
      >
        {/* Success header */}
        <div className="bg-green-500 p-4 sm:p-6 text-white text-center">
          <div className="flex justify-center mb-2">
            <FaCheckCircle className="text-4xl sm:text-5xl" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Pedido Enviado!</h2>
          <p className="text-green-100 text-sm sm:text-base">Seu pedido foi processado com sucesso</p>
        </div>
        
        {/* Order details */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
              <div className="flex justify-between mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Número do pedido:</span>
                <span className="font-bold text-gray-600">{orderNumber}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Forma de pagamento:</span>
                <span className="text-gray-600">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg text-green-600">
                  R$ {parseFloat(total).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* WhatsApp message */}
            <div className="flex items-start sm:items-center p-3 bg-green-100 text-green-800 rounded-lg mb-4 sm:mb-5">
              <FaWhatsapp className="text-xl mr-3 text-green-600 mt-0.5 sm:mt-0 flex-shrink-0" />
              <p className="text-xs sm:text-sm">
                O estabelecimento entrará em contato via WhatsApp para confirmar seu pedido.
              </p>
            </div>
            
            {/* Next steps */}
            <div className="text-center text-gray-600 mb-4 sm:mb-5">
              <p className="text-xs sm:text-sm">Você será redirecionado para o WhatsApp em {countdown} segundos.</p>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
              >
                <FaArrowLeft className="mr-1.5 text-xs sm:text-sm" /> Voltar ao Cardápio
              </button>
              <button
                onClick={() => window.open(`https://wa.me/${orderDetails.contatoLoja}`, '_blank')}
                className="w-full sm:flex-1 py-2.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium flex items-center justify-center transition-colors"
              >
                <FaWhatsapp className="mr-1.5 text-xs sm:text-sm" /> Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

OrderSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderDetails: PropTypes.shape({
    orderNumber: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    paymentMethod: PropTypes.string.isRequired,
    contatoLoja: PropTypes.string.isRequired
  }).isRequired
};

export default OrderSuccessModal;

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const AlertModal = ({ isOpen, onClose, title = "Atenção", message, type = "info" }) => {
  // Desabilita o scroll do body quando o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Fecha o modal se clicar Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Fecha o modal se clicar Enter
  useEffect(() => {
    const handleEnter = (event) => {
      if (event.keyCode === 13 && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEnter);
    return () => {
      window.removeEventListener('keydown', handleEnter);
    };
  }, [onClose, isOpen]);

  if (!isOpen) return null;

  // Define ícone e cores baseado no tipo
  let icon;
  let colorClass;
  
  switch (type) {
    case 'error':
      icon = <FaExclamationCircle className="w-6 h-6 text-red-500" />;
      colorClass = "border-red-500";
      break;
    case 'success':
      icon = <FaCheckCircle className="w-6 h-6 text-green-500" />;
      colorClass = "border-green-500";
      break;
    case 'info':
    default:
      icon = <FaInfoCircle className="w-6 h-6 text-blue-500" />;
      colorClass = "border-blue-500";
      break;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-70 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800 rounded-lg shadow-xl transform transition-all duration-300 max-w-md w-full mx-4 border-t-4 border-l border-r border-b border-opacity-75" style={{borderTopColor: colorClass.split('-')[1]}}>
        <div className="flex justify-between items-center p-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">{icon}</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pt-0 border-t border-gray-700">
          <p className="text-gray-300">{message}</p>
        </div>
        <div className="px-4 py-3 flex justify-end border-t border-gray-700">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

AlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'error', 'success'])
};

export default AlertModal;
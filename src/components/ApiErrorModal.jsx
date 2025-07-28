import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaExclamationTriangle, FaLock, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

const ApiErrorModal = ({ 
  isOpen, 
  onClose, 
  title = "Erro", 
  message, 
  type = "error",
  requiredPermission = null,
  isOwnerOnly = false 
}) => {
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

  if (!isOpen) return null;

  // Define ícone e cores baseado no tipo e contexto
  let icon;
  let colorClass;
  let bgColorClass;
  
  if (requiredPermission || isOwnerOnly) {
    icon = <FaLock className="w-6 h-6 text-yellow-500" />;
    colorClass = "border-yellow-500";
    bgColorClass = "bg-yellow-500";
  } else {
    switch (type) {
      case 'error':
        icon = <FaExclamationTriangle className="w-6 h-6 text-red-500" />;
        colorClass = "border-red-500";
        bgColorClass = "bg-red-500";
        break;
      case 'warning':
        icon = <FaExclamationTriangle className="w-6 h-6 text-yellow-500" />;
        colorClass = "border-yellow-500";
        bgColorClass = "bg-yellow-500";
        break;
      case 'info':
      default:
        icon = <FaInfoCircle className="w-6 h-6 text-blue-500" />;
        colorClass = "border-blue-500";
        bgColorClass = "bg-blue-500";
        break;
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-70 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-gray-800 rounded-lg shadow-xl transform transition-all duration-300 max-w-md w-full mx-4 border-t-4 border-l border-r border-b border-opacity-75 ${colorClass}`}>
        {/* Header */}
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

        {/* Content */}
        <div className="p-4 pt-0 border-t border-gray-700">
          <p className="text-gray-300 mb-4 whitespace-pre-line">{message}</p>

          {/* Detalhes da permissão */}
          {(requiredPermission || isOwnerOnly) && (
            <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
              <h4 className="text-white font-semibold mb-2 flex items-center">
                <FaShieldAlt className="mr-2 text-yellow-400" />
                Detalhes da Permissão
              </h4>
              
              {requiredPermission && (
                <div className="mb-2">
                  <span className="text-gray-300 text-sm">Permissão necessária:</span>
                  <code className="bg-gray-800 text-yellow-300 px-2 py-1 rounded ml-2 text-sm">
                    {requiredPermission}
                  </code>
                </div>
              )}
              
              {isOwnerOnly && (
                <div className="flex items-center text-sm text-orange-300">
                  <FaLock className="mr-2" />
                  <span>Funcionalidade exclusiva para proprietários</span>
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-400">
                Entre em contato com o administrador do sistema para solicitar as permissões necessárias.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-end border-t border-gray-700">
          <button
            onClick={onClose}
            className={`${bgColorClass} hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            autoFocus
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

ApiErrorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'warning', 'info']),
  requiredPermission: PropTypes.string,
  isOwnerOnly: PropTypes.bool
};

export default ApiErrorModal;

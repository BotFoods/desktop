import PropTypes from 'prop-types';
import Modal from './Modal';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  confirmVariant = 'danger', // 'danger', 'warning', 'primary'
  onConfirm,
  icon,
  loading = false
}) => {
  
  const getConfirmButtonClasses = () => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center min-w-[100px]';
    
    switch (confirmVariant) {
      case 'danger':
        return `${base} bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400`;
      case 'warning':
        return `${base} bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-yellow-400`;
      case 'primary':
        return `${base} bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400`;
      default:
        return `${base} bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400`;
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  const getDefaultIcon = () => {
    switch (confirmVariant) {
      case 'danger':
      case 'warning':
        return <FaExclamationTriangle className="w-6 h-6" />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-lg"
      icon={icon || getDefaultIcon()}
    >
      <div className="space-y-4">
        <div className="text-gray-300 text-base leading-relaxed">
          {message}
        </div>
        
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors disabled:bg-gray-500 flex items-center gap-2"
          >
            <FaTimes className="w-4 h-4" />
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={getConfirmButtonClasses()}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FaCheck className="w-4 h-4 mr-2" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.oneOf(['danger', 'warning', 'primary']),
  onConfirm: PropTypes.func,
  icon: PropTypes.node,
  loading: PropTypes.bool
};

export default ConfirmModal;

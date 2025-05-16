import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaClock } from 'react-icons/fa';

const PrepararButton = ({ pdv, setPdv, className, children }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handlePrepararClick = () => {
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmPreparo = () => {
    // Update PDV state to preparando
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.status_venda = 'preparando';
      
      // Update in localStorage based on context (mesa or regular PDV)
      const storageKey = updatedPdv.pdv.venda.mesa ? `pdv_mesa_${updatedPdv.pdv.venda.mesa}` : 'pdv';
      localStorage.setItem(storageKey, JSON.stringify(updatedPdv));
      
      return updatedPdv;
    });
    
    setIsConfirmModalOpen(false);
  };

  const handleCancelPreparo = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handlePrepararClick} 
        className={className || "bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
        disabled={pdv.pdv.venda.produtos.length === 0 || pdv.pdv.venda.status_venda === 'preparando'}
      >
        {children || (
          <>
            <FaClock className="mr-1" />
            <span>Preparar</span>
          </>
        )}
      </button>
      
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCancelPreparo}></div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white">Preparar pedido</h3>
            <p className="text-gray-300 mb-6">
              Confirmar início do preparo deste pedido?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelPreparo}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmPreparo}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
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

PrepararButton.propTypes = {
  pdv: PropTypes.object.isRequired,
  setPdv: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default PrepararButton;

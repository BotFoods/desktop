import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTimesCircle } from 'react-icons/fa';

const CancelarButton = ({ pdv, setPdv, setOrders, setIsModalOpen, className, children }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = () => {
    // Reset PDV state
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      
      // Clear products
      updatedPdv.pdv.venda.produtos = [];
      updatedPdv.pdv.venda.total_venda = 0;
      
      // Clear customer data if there's any
      if (updatedPdv.pdv.venda.dados_cliente) {
        updatedPdv.pdv.venda.dados_cliente = { nome: '', cpf: '', endereco: null };
      }
      
      // Clear observations
      updatedPdv.pdv.venda.observacoes = '';
      
      // Reset totals
      updatedPdv.pdv.totais.quantidade_itens = 0;
      updatedPdv.pdv.totais.valor_total = 0;

      // Determine which localStorage key to use
      const storageKey = updatedPdv.pdv.venda.mesa ? `pdv_mesa_${updatedPdv.pdv.venda.mesa}` : 'pdv';
      localStorage.setItem(storageKey, JSON.stringify(updatedPdv));

      return updatedPdv;
    });

    // Clear orders display
    setOrders([]);
    
    // Close confirm modal
    setIsConfirmModalOpen(false);
    
    // Close any parent modal if a setIsModalOpen callback was provided
    if (setIsModalOpen) {
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={className || "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
      >
        {children || (
          <>
            <FaTimesCircle className="mr-1" />
            <span>Cancelar</span>
          </>
        )}
      </button>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCancel}></div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white">Cancelar pedido</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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

CancelarButton.propTypes = {
  pdv: PropTypes.object.isRequired,
  setPdv: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
  setIsModalOpen: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default CancelarButton;

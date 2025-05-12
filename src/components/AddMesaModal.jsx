import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AddMesaModal = ({ isOpen, onClose, onSubmit, existingMesaNumbers = [], errorMessage }) => {
  const [numeroMesaInput, setNumeroMesaInput] = useState('');
  const [capacidadeInput, setCapacidadeInput] = useState('4');

  useEffect(() => {
    if (isOpen) {
      setNumeroMesaInput('');
      setCapacidadeInput('4');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!capacidadeInput || parseInt(capacidadeInput, 10) <= 0) {
      alert('Capacidade deve ser um número maior que zero.'); // Simple validation
      return;
    }
    onSubmit({ numero_mesa: numeroMesaInput, capacidade: capacidadeInput });
  };

  if (!isOpen) return null;

  const getNextSuggestedNumber = () => {
    if (existingMesaNumbers.length === 0) return 1;
    const numericMesaNumbers = existingMesaNumbers
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));
    if (numericMesaNumbers.length === 0) return 1;
    return Math.max(...numericMesaNumbers) + 1;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Adicionar Nova Mesa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="numero_mesa" className="block text-sm font-medium text-gray-300 mb-1">
              Número da Mesa <span className="text-xs text-gray-500">(opcional)</span>
            </label>
            <input
              type="text"
              id="numero_mesa"
              value={numeroMesaInput}
              onChange={(e) => setNumeroMesaInput(e.target.value)}
              className="p-3 rounded bg-gray-700 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Ex: ${getNextSuggestedNumber()} (ou deixe em branco)`}
            />
             <p className="text-xs text-gray-400 mt-1">
              Se deixado em branco, será usado o próximo número sequencial: {getNextSuggestedNumber()}.
            </p>
          </div>
          <div className="mb-6">
            <label htmlFor="capacidade" className="block text-sm font-medium text-gray-300 mb-1">
              Capacidade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="capacidade"
              value={capacidadeInput}
              onChange={(e) => setCapacidadeInput(e.target.value)}
              className="p-3 rounded bg-gray-700 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: 4"
              required
              min="1"
            />
          </div>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-200 text-red-800 border border-red-500 rounded text-sm">
              <strong>Erro:</strong> {errorMessage}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition duration-150"
            >
              Salvar Mesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
AddMesaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  existingMesaNumbers: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  errorMessage: PropTypes.string,
};

export default AddMesaModal;

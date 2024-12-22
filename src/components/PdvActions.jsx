import React from 'react';

const PdvActions = ({ onFinalizar, onCancelar, onPreparar }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 pl-40 flex justify-around z-20">
      <button
        onClick={onFinalizar}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Finalizar
      </button>
      <button
        onClick={onCancelar}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Cancelar
      </button>
      <button
        onClick={onPreparar}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Preparar
      </button>
    </div>
  );
};

export default PdvActions;
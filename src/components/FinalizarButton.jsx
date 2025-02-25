import React, { useState } from 'react';

const FinalizarButton = ({ pdv, setPdv, setOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFinalizar = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOptionClick = (option) => {
    console.log(`Finalizar venda com ${option}`);
    // Log the order with the user's choice
    console.log('Order:', pdv.pdv.venda.produtos);
    console.log('Total:', pdv.pdv.venda.total_venda);
    console.log('Payment Method:', option);

    // Clear the order
    setOrders([]);
    
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.produtos = [];
      updatedPdv.pdv.venda.total_venda = 0;
      updatedPdv.pdv.totais.quantidade_itens = 0;
      updatedPdv.pdv.totais.valor_total = 0;
      return updatedPdv;
    });

    // Refresh the page
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={handleFinalizar}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Finalizar
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white p-6 rounded shadow-lg z-10">
            <h2 className="text-xl font-bold mb-4">Escolha a forma de pagamento</h2>
            <button
              onClick={() => handleOptionClick('Crédito')}
              className="mt-4 bg-blue-500 text-white px-5 py-2 m-1 rounded"
            >
              Crédito
            </button>
            <button
              onClick={() => handleOptionClick('Débito')}
              className="mt-4 bg-blue-500 text-white px-5 py-2 m-1 rounded"
            >
              Débito
            </button>
            <button
              onClick={() => handleOptionClick('Pix')}
              className="mt-4 bg-blue-500 text-white px-5 py-2 m-1 rounded"
            >
              Pix
            </button>
            <button
              onClick={closeModal}
              className="mt-4 bg-red-500 text-white px-5 py-2 m-1 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalizarButton;

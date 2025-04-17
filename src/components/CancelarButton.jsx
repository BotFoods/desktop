import React, { useState, useEffect } from 'react';

const CancelarButton = ({ pdv, setPdv, setOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCancelar = () => {
    if (pdv.pdv.caixa.operador.pode_cancelar_itens) {
      setOrders([]);
      setPdv((prevPdv) => {
        const updatedPdv = { ...prevPdv };
        updatedPdv.pdv.venda.produtos = [];
        updatedPdv.pdv.venda.total_venda = 0;
        updatedPdv.pdv.totais.quantidade_itens = 0;
        updatedPdv.pdv.totais.valor_total = 0;
        return updatedPdv;
      });
      console.log('Venda cancelada');
    } else {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setManagerPassword('');
    setErrorMessage('');
  };

  const handlePasswordChange = (e) => {
    setManagerPassword(e.target.value);
  };

  const handlePasswordSubmit = () => {
    if (managerPassword === '1234') {
      setOrders([]);
      setPdv((prevPdv) => {
        const updatedPdv = { ...prevPdv };
        updatedPdv.pdv.venda.produtos = [];
        updatedPdv.pdv.venda.total_venda = 0;
        updatedPdv.pdv.totais.quantidade_itens = 0;
        updatedPdv.pdv.totais.valor_total = 0;
        return updatedPdv;
      });
      console.log('Venda cancelada pelo gerente');
      closeModal();
    } else {
      setErrorMessage('Senha incorreta. Tente novamente.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isModalOpen) {
        handlePasswordSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, managerPassword]);

  return (
    <>
      <button
        onClick={handleCancelar}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Cancelar
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 text-black">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white p-6 rounded shadow-lg z-10">
            <h2 className="text-xl font-bold mb-4">Permissão Negada</h2>
            <p>Você não tem permissão para cancelar a venda.</p>
            <input
              type="password"
              value={managerPassword}
              onChange={handlePasswordChange}
              className="mt-4 p-2 border rounded w-full"
              placeholder="Senha do gerente"
              autoFocus
            />
            {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
            <button
              onClick={handlePasswordSubmit}
              className="mt-4 bg-blue-500 text-white px-5 py-2 m-1 rounded"
            >
              Confirmar
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

export default CancelarButton;

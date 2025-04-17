import React from 'react';

const PrepararButton = ({ pdv, setPdv }) => {
  const handlePreparar = () => {
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.produtos = updatedPdv.pdv.venda.produtos.map((produto) => ({
        ...produto,
        status: {
          ...produto.status,
          impresso: true,
        },
        congelado: produto.imprimir ? true : produto.congelado,
      }));
      return updatedPdv;
    });
    console.log('Venda preparada');
    window.location.reload();
  };

  return (
    <button
      onClick={handlePreparar}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Preparar
    </button>
  );
};

export default PrepararButton;

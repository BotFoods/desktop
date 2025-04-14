import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';

const FinalizarButton = ({ pdv, setPdv, setOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, token } = useAuth();

  const handleFinalizar = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOptionClick = async (option) => {
    const userId = user.id;
    const vendaData = {
      usuarioId: userId,
      caixaId: pdv.pdv.caixa.id_caixa,
      cupom: {
        dataEmissao: new Date().toISOString().slice(0, 10),
        valorTotal: pdv.pdv.venda.total_venda,
      },
      itens: pdv.pdv.venda.produtos.map((produto) => ({
        produtoId: produto.id_produto,
        quantidade: produto.quantidade,
        precoUnitario: produto.preco_unitario,
        valorTotal: produto.subtotal,
      })),
      pagamentos: [
        {
          metodoPagamentoId: option === 'Crédito' ? 1 : option === 'Débito' ? 2 : 3, // Example IDs
          valorPago: pdv.pdv.venda.total_venda,
          troco: 0.0,
          dataPagamento: new Date().toISOString().slice(0, 10),
        },
      ],
      movimentacaoCaixa: {
        descricao: `Venda no PDV com ${option}`,
        tipo: 'entrada',
        valor: pdv.pdv.venda.total_venda,
        data: new Date().toISOString().slice(0, 10),
      },
      origem_venda: 1, // 1 for PDV
    };

    console.log(vendaData);

    try {
      const response = await fetch('http://localhost:8080/api/vendas/registrar', {
        method: 'POST',
        headers: {
          authorization: token,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendaData),
      });
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
    }

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

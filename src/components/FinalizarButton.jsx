import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../services/AuthContext';

const FinalizarButton = ({ pdv, setPdv, setOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const handleFinalizar = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOptionClick = async (option) => {
    const userId = user.id;

    // Prepare 'itens' for the payload
    const itensPayload = pdv.pdv.venda.produtos.map((produto) => ({
      produto_id: produto.id_produto,
      quantidade: produto.quantidade,
      preco_unitario: produto.preco_unitario,
      valor_desconto_item: produto.valor_desconto_item || 0, // Assuming valor_desconto_item might exist on produto
    }));

    // Prepare 'pagamentos' for the payload
    const pagamentosPayload = [
      {
        metodo_pagamento_id: option === 'Crédito' ? 1 : option === 'Débito' ? 2 : 3, // Example IDs, ensure they match backend
        valor_pago: pdv.pdv.venda.total_venda,
        valor_troco: 0.0, // Assuming troco is handled or calculated elsewhere if necessary
        // autorizacao_cartao is optional and not used by the new SP
      },
    ];

    const vendaData = {
      usuarioId: userId,
      caixaId: pdv.pdv.caixa.id_caixa,
      lojaId: pdv.pdv.loja_id, // Added: ensure pdv.pdv.loja_id is available
      vendaOrigemId: pdv.pdv.venda.mesa ? 2 : 1, // Added: 1 for PDV, 2 for Mesa (ensure these IDs are correct)
      clienteId: pdv.pdv.venda.dados_cliente?.id_cliente || null, // Optional
      cpfCnpjCliente: pdv.pdv.venda.dados_cliente?.cpf || null, // Optional
      cupomDesconto: 0, // Optional: overall discount for the cupom, default to 0
      itens: itensPayload,
      pagamentos: pagamentosPayload,
    };

    console.log('Dados da Venda para API:', vendaData);

    try {
      const response = await fetch(`${API_BASE_URL}/api/vendas/registrar`, {
        method: 'POST',
        headers: {
          authorization: token,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendaData),
      });
      const result = await response.json();
      console.log('Resultado Registro Venda:', result);

      if (response.ok && result.cupomId) { // Check for cupomId for success
        // Construct receipt text
        const now = new Date();
        let receiptText = `        Comprovante de Venda\n`;
        receiptText += `----------------------------------------\n`;
        receiptText += `Data: ${now.toLocaleDateString()} Hora: ${now.toLocaleTimeString()}\n`;
        receiptText += `Operador: ${pdv.pdv.caixa.operador.nome}\n`;
        if (pdv.pdv.venda.mesa) {
          receiptText += `Mesa: ${pdv.pdv.venda.mesa}\n`;
        }
        receiptText += `----------------------------------------\n`;
        receiptText += `Qtd  Descricao       Unit    Total\n`;
        receiptText += `----------------------------------------\n`;

        pdv.pdv.venda.produtos.forEach(item => {
          const qty = item.quantidade.toString().padEnd(4);
          const name = item.nome.substring(0, 15).padEnd(15); // Truncate and pad
          const unitPrice = parseFloat(item.preco_unitario).toFixed(2).padStart(7);
          const subTotal = parseFloat(item.subtotal).toFixed(2).padStart(7);
          receiptText += `${qty} ${name} ${unitPrice} ${subTotal}\n`;
        });

        receiptText += `----------------------------------------\n`;
        receiptText += `Total Itens: ${pdv.pdv.totais.quantidade_itens}\n`;
        receiptText += `Valor Total: R$ ${parseFloat(pdv.pdv.venda.total_venda).toFixed(2)}\n`;
        receiptText += `Forma Pagamento: ${option}\n`;
        receiptText += `----------------------------------------\n`;
        receiptText += `        Obrigado pela preferencia!\n\n\n\n`; // Add extra lines for paper cut

        console.log('Texto do Cupom:\n', receiptText);

        // Send to print server
        try {
          const printResponse = await fetch('http://localhost:5000/imprimir', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: receiptText,
              printer_ip: "192.168.1.100", // Replace with actual or configured IP
              printer_port: 9100 // Replace with actual or configured port
            }),
          });
          const printResult = await printResponse.json();
          console.log('Resultado Impressão:', printResult);
          if (!printResponse.ok) {
             console.error('Erro ao enviar para impressão:', printResult.error || 'Erro desconhecido');
             // Optionally show an error message to the user
          }
        } catch (printError) {
          console.error('Erro ao conectar com servidor de impressão:', printError);
          // Optionally show an error message to the user
        }

      } else {
         console.error('Falha ao registrar venda:', result.message || 'Erro desconhecido');
         // Optionally show an error message to the user
         closeModal(); // Close modal even if printing fails but sale registration failed
         return; // Stop further execution like clearing order if sale failed
      }

    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      closeModal(); // Close modal on error
      return; // Stop further execution
    }

    // Clear the order in state and localStorage
    setOrders([]);
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      // Reset venda details
      updatedPdv.pdv.venda.produtos = [];
      updatedPdv.pdv.venda.total_venda = 0;
      updatedPdv.pdv.venda.id_venda = '';
      updatedPdv.pdv.venda.tipo = '';
      updatedPdv.pdv.venda.status_venda = '';
      updatedPdv.pdv.venda.dados_cliente = { nome: '', cpf: '', endereco: null };
      updatedPdv.pdv.venda.observacoes = '';
      // Reset totais
      updatedPdv.pdv.totais.quantidade_itens = 0;
      updatedPdv.pdv.totais.valor_total = 0;

      // Determine the correct localStorage key based on whether it's a table or regular PDV
      const storageKey = updatedPdv.pdv.venda.mesa ? `pdv_mesa_${updatedPdv.pdv.venda.mesa}` : 'pdv';
      localStorage.setItem(storageKey, JSON.stringify(updatedPdv)); // Update localStorage immediately

      return updatedPdv;
    });


    closeModal();
    // Refresh the page might not be ideal UX, consider just resetting state
    // window.location.reload();
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
FinalizarButton.propTypes = {
  pdv: PropTypes.shape({
    pdv: PropTypes.shape({
      caixa: PropTypes.shape({
        id_caixa: PropTypes.number.isRequired,
        operador: PropTypes.shape({
          nome: PropTypes.string.isRequired,
        }).isRequired,
      }).isRequired,
      loja_id: PropTypes.number.isRequired, // Added: lojaId is required by the backend
      venda: PropTypes.shape({
        total_venda: PropTypes.number.isRequired,
        produtos: PropTypes.arrayOf(
          PropTypes.shape({
            id_produto: PropTypes.number.isRequired,
            quantidade: PropTypes.number.isRequired,
            preco_unitario: PropTypes.number.isRequired,
            subtotal: PropTypes.number.isRequired, // Kept for receipt, not directly sent in 'itens' in this shape
            nome: PropTypes.string.isRequired,
            valor_desconto_item: PropTypes.number, // Optional: discount per item
          })
        ).isRequired,
        mesa: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
        // tipo: PropTypes.string, // Not directly used in new payload
        // status_venda: PropTypes.string, // Not directly used in new payload
        dados_cliente: PropTypes.shape({
          id_cliente: PropTypes.number, // Optional: for clienteId
          nome: PropTypes.string,
          cpf: PropTypes.string, // Optional: for cpfCnpjCliente
          endereco: PropTypes.any,
        }),
        // observacoes: PropTypes.string, // Not directly used in new payload
      }).isRequired,
      totais: PropTypes.shape({
        quantidade_itens: PropTypes.number.isRequired,
        valor_total: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  setPdv: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
};

export default FinalizarButton;

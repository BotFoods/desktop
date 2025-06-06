import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../services/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';
import AlertModal from './AlertModal';
import LoadingSpinner from './LoadingSpinner';

const FinalizarButton = ({ pdv, loja_id, setPdv, setOrders, className, children, onVendaFinalizada }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const { user, token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Função para mostrar alerta
  const showAlert = (message, type = 'info', title = 'Atenção') => {
    setAlertInfo({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Fecha o alerta
  const closeAlert = () => {
    setAlertInfo(prev => ({ ...prev, isOpen: false }));
  };

  const handleFinalizar = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleOptionClick = async (option) => {
    setIsProcessing(true);
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
    ];    const vendaData = {
      usuarioId: userId,
      caixaId: pdv.pdv.caixa.id_caixa,
      lojaId: user.loja_id, // SEGURANÇA: Usar loja_id do usuário logado
      vendaOrigemId: pdv.pdv.venda.mesa ? 2 : 1, // Added: 1 for PDV, 2 for Mesa (ensure these IDs are correct)
      clienteId: pdv.pdv.venda.dados_cliente?.id_cliente || null, // Optional
      cpfCnpjCliente: pdv.pdv.venda.dados_cliente?.cpf || null, // Optional
      cupomDesconto: 0, // Optional: overall discount for the cupom, default to 0
      itens: itensPayload,
      pagamentos: pagamentosPayload,
    };

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

      if (response.ok && result.cupomId) { // Check for cupomId for success
        // Construct receipt text
        const now = new Date();
        let receiptText = `        Comprovante de Venda\n`;
        receiptText += `----------------------------------------\n`;
        receiptText += `Data: ${now.toLocaleDateString()} Hora: ${now.toLocaleTimeString()}\n`;
        receiptText += `Operador: ${pdv.pdv.caixa.operador?.nome || 'N/A'}\n`; 

        // Add customer information if available (for delivery receipts)
        if (pdv.pdv.venda.tipo === 'delivery' && pdv.pdv.venda.dados_cliente) {
          receiptText += `----------------------------------------\n`;
          receiptText += `Cliente: ${pdv.pdv.venda.dados_cliente.nome || 'N/A'}\n`;
          receiptText += `Telefone: ${pdv.pdv.venda.dados_cliente.telefone || 'N/A'}\n`;
          receiptText += `Endereco: ${pdv.pdv.venda.dados_cliente.endereco || 'N/A'}\n`;
        }
        
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
          
          if (!printResponse.ok) {
             showAlert('Erro ao enviar para impressão: ' + (printResult.error || 'Erro desconhecido'), 'error', 'Erro de Impressão');
          }
        } catch (printError) {
          showAlert('Erro ao conectar com servidor de impressão. Verifique se o servidor está ativo.', 'error', 'Erro de Impressão');
        }      } else {
         showAlert('Falha ao registrar venda: ' + (result.message || 'Erro desconhecido'), 'error', 'Erro ao Finalizar');
         closeModal();
         setIsProcessing(false);
         return;
      }

    } catch (error) {
      showAlert('Erro ao registrar venda. Verifique sua conexão e tente novamente.', 'error', 'Erro ao Finalizar');
      closeModal();
      setIsProcessing(false);
      return;
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
    });    // For delivery orders, also clear the DELIVERY_STORAGE_KEY
    if (pdv.pdv.venda.tipo === 'delivery') {
      localStorage.removeItem('pdv_delivery');
    }    closeModal();
    showAlert('Venda finalizada com sucesso!', 'success', 'Sucesso');
    setIsProcessing(false);
    
    // Callback para notificar o componente pai sobre a finalização
    if (onVendaFinalizada) {
      onVendaFinalizada();
    }
  };

  return (
    <>
      <button
        onClick={handleFinalizar}
        className={className || "bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
      >
        {children || (
          <>
            <FaCheckCircle className="mr-1" />
            <span>Finalizar</span>
          </>
        )}
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 text-white">
          <div className="bg-black bg-opacity-75 absolute inset-0" onClick={closeModal}></div>          <div className="bg-gray-800 p-6 rounded-lg shadow-xl z-10 w-96">
            <h2 className="text-xl font-bold mb-6 text-center border-b pb-2 border-gray-700">Escolha a forma de pagamento</h2>
            {isProcessing && (
              <div className="mb-4">
                <LoadingSpinner 
                  size="md"
                  message="Processando pagamento..."
                  className="text-center"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOptionClick('Crédito')}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center"
              >
                {isProcessing ? <LoadingSpinner size="sm" showMessage={false} /> : 'Crédito'}
              </button>
              <button
                onClick={() => handleOptionClick('Débito')}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center"
              >
                {isProcessing ? <LoadingSpinner size="sm" showMessage={false} /> : 'Débito'}
              </button>
              <button
                onClick={() => handleOptionClick('Pix')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center"
              >
                {isProcessing ? <LoadingSpinner size="sm" showMessage={false} /> : 'Pix'}
              </button>
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertInfo.isOpen}
        onClose={closeAlert}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />
    </>
  );
};

FinalizarButton.propTypes = {
  pdv: PropTypes.shape({
    pdv: PropTypes.shape({
      caixa: PropTypes.shape({
        id_caixa: PropTypes.number.isRequired,
        operador: PropTypes.shape({
          nome: PropTypes.string, // Changed from isRequired to optional
        }).isRequired,
      }).isRequired,
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
        tipo: PropTypes.string, // Added: to check for delivery type
        status_venda: PropTypes.string, // Added: to check for delivery type
        dados_cliente: PropTypes.shape({
          id_cliente: PropTypes.number, // Optional: for clienteId
          nome: PropTypes.string,
          cpf: PropTypes.string, // Optional: for cpfCnpjCliente
          telefone: PropTypes.string, // Added: for customer phone
          endereco: PropTypes.any,
        }),
        observacoes: PropTypes.string, // Added: for customer observations
      }).isRequired,
      totais: PropTypes.shape({
        quantidade_itens: PropTypes.number.isRequired,
        valor_total: PropTypes.number.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  setPdv: PropTypes.func.isRequired,
  setOrders: PropTypes.func.isRequired,
  loja_id: PropTypes.number.isRequired, // Added: loja_id is required
  className: PropTypes.string,
  children: PropTypes.node,
  onVendaFinalizada: PropTypes.func, // Optional callback
};

export default FinalizarButton;

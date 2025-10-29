import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../services/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';
import AlertModal from './AlertModal';
import ApiErrorModal from './ApiErrorModal';
import LoadingSpinner from './LoadingSpinner';
import useApiError from '../hooks/useApiError';
import { apiPost } from '../services/ApiService';
import printManager from '../services/printManager';
import { listarMetodosPagamento } from '../services/MetodosPagamentoService';

const FinalizarButton = ({ pdv, loja_id, setPdv, setOrders, className, children, onVendaFinalizada }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [metodosPagamento, setMetodosPagamento] = useState([]);
  const [loadingMetodos, setLoadingMetodos] = useState(false);
  const { user, token } = useAuth();
  const { errorInfo, handleApiError, closeError } = useApiError();

  // Carregar métodos de pagamento ao montar o componente
  useEffect(() => {
    const carregarMetodos = async () => {
      if (!token) return;
      
      try {
        setLoadingMetodos(true);
        const response = await listarMetodosPagamento(token);
        
        // Verificar se a resposta tem a estrutura esperada
        if (response && response.data && Array.isArray(response.data)) {
          setMetodosPagamento(response.data);
        } else if (Array.isArray(response)) {
          setMetodosPagamento(response);
        } else {
          console.error('Formato de resposta inválido:', response);
          // Fallback para métodos padrões
          setMetodosPagamento([
            { id: 1, metodo: 'Dinheiro', descricao: 'Pagamento em espécie', ativo: true },
            { id: 2, metodo: 'Cartão de Crédito', descricao: 'Pagamento com cartão de crédito', ativo: true },
            { id: 3, metodo: 'Cartão de Débito', descricao: 'Pagamento com cartão de débito', ativo: true },
            { id: 4, metodo: 'PIX', descricao: 'Pagamento via PIX', ativo: true }
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar métodos de pagamento:', error);
        showAlert('Erro ao carregar métodos de pagamento. Usando padrões.', 'warning');
        // Fallback para métodos padrões
        setMetodosPagamento([
          { id: 1, metodo: 'Dinheiro', descricao: 'Pagamento em espécie', ativo: true },
          { id: 2, metodo: 'Cartão de Crédito', descricao: 'Pagamento com cartão de crédito', ativo: true },
          { id: 3, metodo: 'Cartão de Débito', descricao: 'Pagamento com cartão de débito', ativo: true },
          { id: 4, metodo: 'PIX', descricao: 'Pagamento via PIX', ativo: true }
        ]);
      } finally {
        setLoadingMetodos(false);
      }
    };

    carregarMetodos();
  }, [token]);

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
  
  const handleOptionClick = async (metodoPagamento) => {
    setIsProcessing(true);
    const userId = user.id;

    // Prepare 'itens' for the payload
    const itensPayload = pdv.pdv.venda.produtos.map((produto) => ({
      produto_id: produto.id_produto,
      quantidade: produto.quantidade,
      preco_unitario: produto.preco_unitario,
      valor_desconto_item: produto.valor_desconto_item || 0,
    }));

    // Prepare 'pagamentos' for the payload usando o ID do método selecionado
    const pagamentosPayload = [
      {
        metodo_pagamento_id: metodoPagamento.id,
        valor_pago: pdv.pdv.venda.total_venda,
        valor_troco: 0.0,
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
      const data = await apiPost('/api/vendas/registrar', vendaData, token);

      if (data.success && data.cupomId) { // Check for cupomId for success
        // Imprimir cupom fiscal usando o novo sistema abstrato
        try {
          
          const saleData = {
            vendaId: data.cupomId,
            produtos: pdv.pdv.venda.produtos,
            total: pdv.pdv.venda.total_venda,
            forma_pagamento: metodoPagamento.metodo, // Usar nome do método
            cliente: pdv.pdv.venda.dados_cliente,
            vendedor: pdv.pdv.caixa.operador?.nome || 'Sistema',
            mesa: pdv.pdv.venda.mesa,
            tipo: pdv.pdv.venda.tipo
          };


          await printManager.printSaleReceipt(saleData);
        } catch (printError) {
          if (printError.message.includes('Timeout')) {
            showAlert('A impressão demorou muito para responder. Verifique se a impressora está ligada e conectada.', 'error', 'Erro de Impressão');
          } else {
            showAlert('Erro ao imprimir comprovante. Verifique se a impressora está configurada e ativa.', 'error', 'Erro de Impressão');
          }
        }
      } else if (data._isApiError && data._status === 403) {
        // Usar o novo sistema para erros de permissão
        await handleApiError(data._response || data, 'Erro ao registrar venda');
        closeModal();
        setIsProcessing(false);
        return;
      } else {
        showAlert('Falha ao registrar venda: ' + (data.message || 'Erro desconhecido'), 'error', 'Erro ao Finalizar');
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
          <div className="bg-black bg-opacity-75 absolute inset-0" onClick={closeModal}></div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl z-10 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-center border-b pb-2 border-gray-700">
              Escolha a forma de pagamento
            </h2>
            
            {(isProcessing || loadingMetodos) && (
              <div className="mb-4">
                <LoadingSpinner 
                  size="md"
                  message={loadingMetodos ? "Carregando métodos..." : "Processando pagamento..."}
                  className="text-center"
                />
              </div>
            )}
            
            {!loadingMetodos && metodosPagamento.length === 0 && (
              <p className="text-center text-gray-400 mb-4">
                Nenhum método de pagamento disponível.
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {metodosPagamento.map((metodo) => (
                <button
                  key={metodo.id}
                  onClick={() => handleOptionClick(metodo)}
                  disabled={isProcessing || loadingMetodos}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center"
                  title={metodo.descricao}
                >
                  {isProcessing ? <LoadingSpinner size="sm" showMessage={false} /> : metodo.metodo}
                </button>
              ))}
              
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out col-span-2"
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

      {/* Modal de erro da API */}
      <ApiErrorModal
        isOpen={errorInfo.isOpen}
        onClose={closeError}
        title={errorInfo.title}
        message={errorInfo.message}
        type={errorInfo.type}
        requiredPermission={errorInfo.requiredPermission}
        isOwnerOnly={errorInfo.isOwnerOnly}
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

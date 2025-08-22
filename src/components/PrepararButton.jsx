import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaClock, FaPrint } from 'react-icons/fa';
import printManager from '../services/printManager';

const PrepararButton = ({ pdv, setPdv, className, children }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);

  // Verificar se há produtos não impressos no pedido
  const hasUnprintedProducts = pdv.pdv.venda.produtos.some(produto => 
    !produto.status?.impresso
  );

  // Verificar se existem produtos para serem preparados
  const hasProductsToPrepare = pdv.pdv.venda.produtos.length > 0;

  // Habilitar botão quando há produtos não impressos e existem produtos na venda
  const buttonEnabled = hasUnprintedProducts && hasProductsToPrepare;

  const handlePrepararClick = () => {
    setIsConfirmModalOpen(true);
    setPrintError(null);
  };
  
  // Função para imprimir o pedido na cozinha usando o novo sistema abstrato
  const printKitchenOrder = async () => {
    setIsPrinting(true);
    
    try {
      // Preparar dados do pedido para impressão usando o novo sistema abstrato
      const orderData = {
        pedidoId: pdv.pdv.venda.id || `PDV-${Date.now()}`,
        tipo: pdv.pdv.venda.tipo,
        mesa: pdv.pdv.venda.mesa,
        produtos: pdv.pdv.venda.produtos.filter(produto => !produto.status?.impresso), // Apenas não impressos
        dados_cliente: pdv.pdv.venda.dados_cliente,
        observacoes: pdv.pdv.venda.observacoes
      };

      // Usar o novo sistema abstrato de impressão
      await printManager.printForKitchen(orderData);
      
      console.log('✅ Impressão da cozinha realizada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na impressão da cozinha:', error);
      setPrintError('Impressão falhou, mas os produtos foram marcados como impressos.');
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConfirmPreparo = async () => {
    try {
      // Imprimir pedido na cozinha
      await printKitchenOrder();
      
      // Atualizar PDV state para marcar apenas os produtos não impressos como impressos
      setPdv((prevPdv) => {
        const updatedPdv = { ...prevPdv };
        
        // Marcar produtos não impressos como impressos, mantendo os já impressos como estão
        if (updatedPdv.pdv.venda.produtos && updatedPdv.pdv.venda.produtos.length > 0) {
          updatedPdv.pdv.venda.produtos = updatedPdv.pdv.venda.produtos.map(produto => {
            if (!produto.status?.impresso) {
              return {
                ...produto,
                status: {
                  ...(produto.status || {}),
                  impresso: true
                }
              };
            }
            return produto;
          });
        }
        
        // Atualizar no localStorage baseado no contexto (mesa ou PDV regular)
        const storageKey = updatedPdv.pdv.venda.mesa ? `pdv_mesa_${updatedPdv.pdv.venda.mesa}` : 
                         updatedPdv.pdv.venda.tipo === 'delivery' ? 'pdv_delivery' : 'pdv';
        localStorage.setItem(storageKey, JSON.stringify(updatedPdv));
        
        return updatedPdv;
      });
      
      // Se houver erro de impressão, manter o modal aberto para mostrar o erro
      if (!printError) {
        setIsConfirmModalOpen(false);
        
        // Aguarda um curto período para garantir que o localStorage seja atualizado
        // antes de recarregar a página para refletir as mudanças na interface
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch (error) {
      console.error("Erro ao confirmar preparo:", error);
      setPrintError("Erro ao processar o pedido. Por favor, tente novamente.");
    }
  };

  const handleCancelPreparo = () => {
    setIsConfirmModalOpen(false);
    setPrintError(null);
  };

  return (
    <>
      <button 
        onClick={handlePrepararClick} 
        className={`${className || "bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"} ${!buttonEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!buttonEnabled}
      >
        {children || (
          <>
            <FaClock className="mr-1" />
            <span>Preparar</span>
          </>
        )}
      </button>
      
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleCancelPreparo}></div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg z-10 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-white">Preparar pedido</h3>
            
            {printError ? (
              <div className="bg-yellow-800 text-yellow-200 p-3 rounded mb-4">
                <p>{printError}</p>
                <p className="text-sm mt-1">Clique em "Recarregar" para atualizar a página.</p>
              </div>
            ) : (
              <p className="text-gray-300 mb-6">
                Confirmar início do preparo deste pedido? Os itens serão enviados para a cozinha e não poderão ser removidos sem autorização do gerente.
              </p>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelPreparo}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={isPrinting}
              >
                {printError ? "Fechar" : "Voltar"}
              </button>
              
              {printError ? (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Recarregar
                </button>
              ) : (
                <button
                  onClick={handleConfirmPreparo}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <FaPrint className="mr-2" />
                      Confirmar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

PrepararButton.propTypes = {
  pdv: PropTypes.object.isRequired,
  setPdv: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default PrepararButton;

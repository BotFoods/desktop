import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaClock, FaPrint } from 'react-icons/fa';

const PrepararButton = ({ pdv, setPdv, className, children }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrepararClick = () => {
    setIsConfirmModalOpen(true);
  };
  
  // Função para imprimir o pedido na cozinha
  const printKitchenOrder = async () => {
    setIsPrinting(true);
    
    try {
      // Determinar o tipo de pedido
      let orderType = "BALCÃO";
      if (pdv.pdv.venda.mesa) {
        orderType = `MESA #${pdv.pdv.venda.mesa}`;
      } else if (pdv.pdv.venda.tipo === 'delivery') {
        orderType = "DELIVERY";
      }
      
      // Construir o texto do pedido para a cozinha
      let kitchenText = `        PEDIDO PARA PREPARO\n`;
      kitchenText += `----------------------------------------\n`;
      kitchenText += `Data: ${new Date().toLocaleDateString()} Hora: ${new Date().toLocaleTimeString()}\n`;
      kitchenText += `Tipo: ${orderType}\n`;
      
      // Adicionar dados do cliente para delivery
      if (pdv.pdv.venda.tipo === 'delivery' && pdv.pdv.venda.dados_cliente) {
        kitchenText += `Cliente: ${pdv.pdv.venda.dados_cliente.nome || 'N/A'}\n`;
        kitchenText += `Telefone: ${pdv.pdv.venda.dados_cliente.telefone || 'N/A'}\n`;
        kitchenText += `Endereço: ${pdv.pdv.venda.dados_cliente.endereco || 'N/A'}\n`;
      }
      
      kitchenText += `----------------------------------------\n`;
      kitchenText += `Qtd  Descrição\n`;
      kitchenText += `----------------------------------------\n`;

      pdv.pdv.venda.produtos.forEach(item => {
        const qty = item.quantidade.toString().padEnd(4);
        const name = item.nome.substring(0, 30).padEnd(30);
        kitchenText += `${qty} ${name}\n`;
      });

      kitchenText += `----------------------------------------\n`;
      kitchenText += `Observações: ${pdv.pdv.venda.observacoes || 'Nenhuma'}\n`;
      kitchenText += `----------------------------------------\n\n\n\n`; // Linhas extras para corte do papel

      // Enviar para o servidor de impressão
      const printResponse = await fetch('http://localhost:5000/imprimir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: kitchenText,
          printer_ip: "192.168.1.101", // IP da impressora da cozinha
          printer_port: 9100
        }),
      });

      const printResult = await printResponse.json();
      
      if (!printResponse.ok) {
        console.error('Erro ao imprimir na cozinha:', printResult.error || 'Erro desconhecido');
        // Podemos continuar mesmo se a impressão falhar
      }
      
      return true;
    } catch (printError) {
      console.error('Erro ao conectar com servidor de impressão:', printError);
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  const handleConfirmPreparo = async () => {
    // Imprimir pedido na cozinha
    await printKitchenOrder();
    
    // Atualizar PDV state para preparando
    setPdv((prevPdv) => {
      const updatedPdv = { ...prevPdv };
      updatedPdv.pdv.venda.status_venda = 'preparando';
      
      // Marcar todos os produtos como impressos
      if (updatedPdv.pdv.venda.produtos && updatedPdv.pdv.venda.produtos.length > 0) {
        updatedPdv.pdv.venda.produtos = updatedPdv.pdv.venda.produtos.map(produto => ({
          ...produto,
          status: {
            ...produto.status,
            impresso: true
          }
        }));
      }
      
      // Atualizar no localStorage baseado no contexto (mesa ou PDV regular)
      const storageKey = updatedPdv.pdv.venda.mesa ? `pdv_mesa_${updatedPdv.pdv.venda.mesa}` : 
                         updatedPdv.pdv.venda.tipo === 'delivery' ? 'pdv_delivery' : 'pdv';
      localStorage.setItem(storageKey, JSON.stringify(updatedPdv));
      
      return updatedPdv;
    });
    
    setIsConfirmModalOpen(false);
  };

  const handleCancelPreparo = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handlePrepararClick} 
        className={className || "bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-5 rounded-md flex items-center gap-2 transition duration-150 ease-in-out"}
        disabled={pdv.pdv.venda.produtos.length === 0 || pdv.pdv.venda.status_venda === 'preparando'}
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
            <p className="text-gray-300 mb-6">
              Confirmar início do preparo deste pedido? Os itens serão enviados para a cozinha e não poderão ser removidos sem autorização do gerente.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelPreparo}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={isPrinting}
              >
                Voltar
              </button>
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

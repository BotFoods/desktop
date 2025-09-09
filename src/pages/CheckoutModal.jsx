import { useState, useEffect, useMemo } from 'react'; // Removido useRef
import { FaWhatsapp, FaPlus, FaMinus, FaTrash } from 'react-icons/fa'; // Importar ícones necessários
import PropTypes from 'prop-types'; // Importar PropTypes para validação de props

// Atualizar props para incluir funções de manipulação
const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  selectedProducts, 
  wid, 
  contatoLoja, 
  onIncreaseQuantity, 
  onDecreaseQuantity, 
  onRemoveProduct,
  onOrderSuccess 
}) => {
  const [cep, setCep] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [address, setAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_URL; // URL base da API

  // Atualizar cálculo do total para considerar a quantidade
  const total = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  }, [selectedProducts]);

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('checkout-modal-overlay')) {
      onClose();
    }
  };

  const fetchAddressByCep = async () => {
    if (!cep) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setErrorMessage('CEP não encontrado.');
        setAddress({
          street: '',
          neighborhood: '',
          city: '',
          state: '',
          number: '',
          complement: '',
        });
        setLoading(false);
        return;
      }
      setAddress({
        ...address,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      });
    } catch (err) {
      setErrorMessage('Erro ao buscar endereço. Tente novamente.');
      setAddress({
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        number: '',
        complement: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberInput = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setAddress({ ...address, number: value });
  };

  // Atualizar handleFinalizeOrder para enviar a estrutura correta
  const handleFinalizeOrder = async () => {
    // Validar se todos os campos obrigatórios foram preenchidos
    if (!customerInfo.name.trim()) {
        setErrorMessage('Por favor, preencha seu nome completo.');
        return;
    }
    if (!customerInfo.phone.trim()) {
        setErrorMessage('Por favor, preencha seu telefone.');
        return;
    }
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
        setErrorMessage('Por favor, preencha o endereço completo.');
        return;
    }
    if (!paymentMethod) {
        setErrorMessage('Por favor, selecione uma forma de pagamento.');
        return;
    }
    setErrorMessage(''); // Limpa erro se tudo estiver ok

    const orderData = {
      // Mapear corretamente os produtos e quantidades
      products: selectedProducts.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity, // Incluir quantidade
      })),
      total,
      address: { ...address, ...customerInfo },
      paymentMethod,
      number: wid, 
      id: contatoLoja
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Em vez de abrir o WhatsApp e fechar o modal aqui,
        // vamos notificar o componente pai sobre o sucesso do pedido
        // e deixar que ele gerencie o fluxo de UI
        if (onOrderSuccess) {
          onOrderSuccess({
            total,
            address: { ...address, ...customerInfo },
            paymentMethod,
            products: selectedProducts,
          });
        } else {
          // Fallback para o comportamento anterior se onOrderSuccess não estiver definido
          const whatsappUrl = `https://wa.me/${contatoLoja}`;
          window.open(whatsappUrl, '_blank');
          onClose();
          onRemoveProduct();
        }
      } else {
        setErrorMessage('Houve um erro ao registrar seu pedido. Tente novamente.'); // Informar erro ao usuário
      }
    } catch (error) {
      setErrorMessage('Houve um erro de comunicação ao registrar seu pedido. Verifique sua conexão e tente novamente.'); // Informar erro de rede
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // Renderiza nada se não estiver aberto

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-75 z-50 transition-opacity checkout-modal-overlay ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOutsideClick}
    >
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-800 shadow-lg transform transition-transform ${ // Alterado para bg-gray-800
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`} // Adicionado flex flex-col
      >
        {/* Header do Modal */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Resumo do Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-grow overflow-y-auto p-4 text-white">
          {selectedProducts.length === 0 ? (
            <p className="text-center text-gray-400">Seu carrinho está vazio.</p>
          ) : (
            <>
              <ul className="mb-4 space-y-3">
                {selectedProducts.map((item) => (
                  <li key={item.product.id} className="flex items-center justify-between border-b border-gray-700 pb-3">
                    <div className="flex-grow mr-2">
                      <span className="block font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-400">R$ {parseFloat(item.product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Botão Diminuir */}
                       <button 
                         onClick={() => onDecreaseQuantity(item.product.id)} 
                         className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                         disabled={item.quantity <= 1} // Desabilita se quantidade for 1
                         aria-label="Diminuir quantidade"
                       >
                         <FaMinus size={16}/>
                       </button>
                       {/* Quantidade */}
                       <span className="font-semibold w-6 text-center">{item.quantity}</span>
                       {/* Botão Aumentar */}
                       <button 
                         onClick={() => onIncreaseQuantity(item.product)} // Passa o produto inteiro
                         className="text-green-400 hover:text-green-300 p-1"
                         aria-label="Aumentar quantidade"
                       >
                         <FaPlus size={16}/>
                       </button>
                       {/* Botão Remover */}
                       <button 
                         onClick={() => onRemoveProduct(item.product.id)} 
                         className="text-gray-400 hover:text-red-400 ml-2 p-1"
                         aria-label="Remover item"
                       >
                         <FaTrash size={16}/>
                       </button>
                    </div>
                  </li>
                ))}
              </ul>
              <h3 className="text-lg font-semibold mb-4 text-right">Total: R$ {total.toFixed(2)}</h3>

              <h2 className="text-lg font-bold mb-2">Dados do Cliente</h2>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Telefone *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setCustomerInfo({ ...customerInfo, phone: formatted });
                  }}
                  className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
                  placeholder="11999999999"
                  required
                />
                <small className="text-gray-400">Digite apenas números (DDD + telefone)</small>
              </div>

              <h2 className="text-lg font-bold mb-2">Endereço de Entrega</h2>
              {/* ... Formulário de Endereço existente ... */}
               <div className="mb-2">
                 <label className="block text-sm font-medium mb-1">CEP</label>
                 <input
                   type="text"
                   value={cep}
                   onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))} // Formata e limita CEP
                   onBlur={fetchAddressByCep}
                   className={`w-full border rounded px-2 py-1 bg-gray-700 text-white ${
                     errorMessage && errorMessage.includes('CEP') ? 'border-red-500' : 'border-gray-600'
                   }`}
                   placeholder="Apenas números"
                   autoFocus
                 />
                 {errorMessage && errorMessage.includes('CEP') && <p className="text-red-400 text-sm mt-1">{errorMessage}</p>}
               </div>
               {/* ... Restante dos campos de endereço ... */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <input
                    type="text"
                    value={address.number}
                    onChange={handleNumberInput} // Já remove não numéricos
                    className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
                    placeholder="Número"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={address.complement}
                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                    className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
                    placeholder="Apto / Bloco / Casa"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.neighborhood}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-700 text-gray-400"
                    placeholder="Bairro"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.city}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-700 text-gray-400"
                    placeholder="Cidade"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.state}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-700 text-gray-400"
                    placeholder="Estado"
                  />
                </div>

              <h2 className="text-lg font-bold mb-2 mt-4">Forma de Pagamento</h2>
              <div className="mb-4">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white"
                  required // Adicionado required
                >
                  <option value="" disabled>Selecione...</option> {/* Melhor opção padrão */}
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option> {/* Adicionado Dinheiro */}
                </select>
              </div>
              {/* Exibe mensagem de erro geral */}
              {errorMessage && !errorMessage.includes('CEP') && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}
            </>
          )}
        </div>

        {/* Footer do Modal (Botão Finalizar) */}
        {selectedProducts.length > 0 && ( // Só mostra o botão se houver itens
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleFinalizeOrder}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold text-lg disabled:opacity-70"
              disabled={loading || selectedProducts.length === 0} // Desabilita se carregando ou vazio
            >
              <FaWhatsapp />
              {loading ? 'Enviando...' : `Ir para WhatsApp (R$ ${total.toFixed(2)})`} 
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
CheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedProducts: PropTypes.arrayOf(
    PropTypes.shape({
      product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.string.isRequired,
      }).isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  wid: PropTypes.string.isRequired,
  contatoLoja: PropTypes.string.isRequired,
  onIncreaseQuantity: PropTypes.func.isRequired,
  onDecreaseQuantity: PropTypes.func.isRequired,
  onRemoveProduct: PropTypes.func.isRequired,
  onOrderSuccess: PropTypes.func,
};

export default CheckoutModal;

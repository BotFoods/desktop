import React, { useState, useEffect, useRef, useMemo } from 'react'; // Adicionado useMemo
import { FaWhatsapp, FaPlus, FaMinus, FaTrash } from 'react-icons/fa'; // Importar ícones necessários

// Atualizar props para incluir funções de manipulação
const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  selectedProducts, 
  wid, 
  contatoLoja, 
  onIncreaseQuantity, 
  onDecreaseQuantity, 
  onRemoveProduct 
}) => {
  const [cep, setCep] = useState('');
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
  const cepInputRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL; // URL base da API

  // Atualizar cálculo do total para considerar a quantidade
  const total = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  }, [selectedProducts]);

  useEffect(() => {
    if (isOpen && cepInputRef.current) {
      cepInputRef.current.focus();
    }
  }, [isOpen]);

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
        if (cepInputRef.current) {
          cepInputRef.current.focus();
        }
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
      console.error('Erro ao buscar endereço:', err);
      setErrorMessage('Erro ao buscar endereço. Tente novamente.');
      setAddress({
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        number: '',
        complement: '',
      });
      if (cepInputRef.current) {
        cepInputRef.current.focus();
      }
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
    // Validar se o endereço e forma de pagamento foram preenchidos (opcional, mas recomendado)
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !paymentMethod) {
        setErrorMessage('Por favor, preencha o endereço completo e a forma de pagamento.');
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
      address,
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
        console.log('Pedido enviado com sucesso para o backend!'); 
        
        // APENAS construir a URL base do WhatsApp
        const whatsappUrl = `https://wa.me/${contatoLoja}`; // Sem texto pré-preenchido
        
        // Abrir link do WhatsApp em nova aba
        window.open(whatsappUrl, '_blank');

        onClose(); // Fechar o modal
        // Limpar o cardápio
        onRemoveProduct(); // Limpar o carrinho
        
      } else {
        console.error('Erro ao enviar pedido para o backend:', await response.text());
        setErrorMessage('Houve um erro ao registrar seu pedido. Tente novamente.'); // Informar erro ao usuário
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setErrorMessage('Houve um erro de comunicação ao registrar seu pedido. Verifique sua conexão e tente novamente.'); // Informar erro de rede
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // Renderiza nada se não estiver aberto

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity checkout-modal-overlay ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOutsideClick}
    >
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg transform transition-transform ${ // Ajustado para max-w-md e w-full
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`} // Adicionado flex flex-col
      >
        {/* Header do Modal */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Resumo do Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-grow overflow-y-auto p-4 text-black">
          {selectedProducts.length === 0 ? (
            <p className="text-center text-gray-500">Seu carrinho está vazio.</p>
          ) : (
            <>
              <ul className="mb-4 space-y-3">
                {selectedProducts.map((item) => (
                  <li key={item.product.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex-grow mr-2">
                      <span className="block font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-500">R$ {parseFloat(item.product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Botão Diminuir */}
                       <button 
                         onClick={() => onDecreaseQuantity(item.product.id)} 
                         className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
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
                         className="text-green-500 hover:text-green-700 p-1"
                         aria-label="Aumentar quantidade"
                       >
                         <FaPlus size={16}/>
                       </button>
                       {/* Botão Remover */}
                       <button 
                         onClick={() => onRemoveProduct(item.product.id)} 
                         className="text-gray-400 hover:text-red-600 ml-2 p-1"
                         aria-label="Remover item"
                       >
                         <FaTrash size={16}/>
                       </button>
                    </div>
                  </li>
                ))}
              </ul>
              <h3 className="text-lg font-semibold mb-4 text-right">Total: R$ {total.toFixed(2)}</h3>

              <h2 className="text-lg font-bold mb-2">Endereço de Entrega</h2>
              {/* ... Formulário de Endereço existente ... */}
               <div className="mb-2">
                 <label className="block text-sm font-medium mb-1">CEP</label>
                 <input
                   type="text"
                   value={cep}
                   onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))} // Formata e limita CEP
                   onBlur={fetchAddressByCep}
                   ref={cepInputRef}
                   className={`w-full border rounded px-2 py-1 ${
                     errorMessage && errorMessage.includes('CEP') ? 'border-red-500' : 'border-gray-300' // Ajuste na borda de erro
                   }`}
                   placeholder="Apenas números"
                 />
                 {errorMessage && errorMessage.includes('CEP') && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
               </div>
               {/* ... Restante dos campos de endereço ... */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Rua</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.street}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500" // Estilo para desabilitado
                    placeholder="Rua"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <input
                    type="text"
                    value={address.number}
                    onChange={handleNumberInput} // Já remove não numéricos
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Número"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={address.complement}
                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Apto / Bloco / Casa"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.neighborhood}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500"
                    placeholder="Bairro"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.city}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500"
                    placeholder="Cidade"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <input
                    type="text"
                    value={loading ? 'Buscando...' : address.state}
                    disabled
                    className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-500"
                    placeholder="Estado"
                  />
                </div>

              <h2 className="text-lg font-bold mb-2 mt-4">Forma de Pagamento</h2>
              <div className="mb-4">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
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
              {errorMessage && !errorMessage.includes('CEP') && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
            </>
          )}
        </div>

        {/* Footer do Modal (Botão Finalizar) */}
        {selectedProducts.length > 0 && ( // Só mostra o botão se houver itens
          <div className="p-4 border-t">
            <button
              onClick={handleFinalizeOrder}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-semibold text-lg disabled:opacity-70"
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

export default CheckoutModal;

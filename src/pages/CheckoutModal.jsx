import React, { useState, useEffect, useRef } from 'react';
import { FaWhatsapp } from 'react-icons/fa'; // Import WhatsApp icon

const CheckoutModal = ({ isOpen, onClose, selectedProducts, wid, contatoLoja }) => {
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
  const total = selectedProducts.reduce((sum, product) => sum + parseFloat(product.price), 0);
  const cepInputRef = useRef(null);

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

  const handleFinalizeOrder = async () => {
    const orderData = {
      products: selectedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
      })),
      total,
      address,
      paymentMethod,
      number: wid, // Use the wid prop here
      id: contatoLoja
    };

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        console.log('Pedido enviado com sucesso!');
        onClose(); // Close the modal after successful submission
      } else {
        console.error('Erro ao enviar pedido:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity checkout-modal-overlay ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOutsideClick}
    >
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 text-black">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 float-right text-lg"
          >
            &times;
          </button>
          <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
          <ul className="mb-4">
            {selectedProducts.map((product, index) => (
              <li key={index} className="flex justify-between border-b py-2">
                <span>{product.name}</span>
                <span>R$ {product.price}</span>
              </li>
            ))}
          </ul>
          <h3 className="text-lg font-semibold mb-4">Total: R$ {total.toFixed(2)}</h3>

          <h2 className="text-lg font-bold mb-2">Endereço de Entrega</h2>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">CEP</label>
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={fetchAddressByCep}
              ref={cepInputRef}
              className={`w-full border rounded px-2 py-1 ${
                errorMessage ? 'border-red-500' : ''
              }`}
              placeholder="Digite o CEP"
            />
            {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Rua</label>
            <input
              type="text"
              value={loading ? 'Carregando...' : address.street}
              disabled
              className="w-full border rounded px-2 py-1 bg-gray-100"
              placeholder="Rua"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Número</label>
            <input
              type="text"
              value={address.number}
              onChange={handleNumberInput}
              className="w-full border rounded px-2 py-1"
              placeholder="Número"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Complemento (opcional)</label>
            <input
              type="text"
              value={address.complement}
              onChange={(e) => setAddress({ ...address, complement: e.target.value })}
              className="w-full border rounded px-2 py-1"
              placeholder="Complemento"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Bairro</label>
            <input
              type="text"
              value={loading ? 'Carregando...' : address.neighborhood}
              disabled
              className="w-full border rounded px-2 py-1 bg-gray-100"
              placeholder="Bairro"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Cidade</label>
            <input
              type="text"
              value={loading ? 'Carregando...' : address.city}
              disabled
              className="w-full border rounded px-2 py-1 bg-gray-100"
              placeholder="Cidade"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Estado</label>
            <input
              type="text"
              value={loading ? 'Carregando...' : address.state}
              disabled
              className="w-full border rounded px-2 py-1 bg-gray-100"
              placeholder="Estado"
            />
          </div>

          <h2 className="text-lg font-bold mb-2">Forma de Pagamento</h2>
          <div className="mb-4">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Selecione</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="debito">Cartão de Débito</option>
              <option value="pix">Pix</option>
            </select>
          </div>

          <button
            onClick={handleFinalizeOrder}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <FaWhatsapp />
            {loading ? 'Enviando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

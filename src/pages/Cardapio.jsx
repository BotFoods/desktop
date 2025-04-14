import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import CheckoutModal from './CheckoutModal';
import { FaShoppingCart } from 'react-icons/fa'; // Import cart icon

const Cardapio = () => {
  const { id, wid } = useParams();
  const { validateSession } = useAuth();
  const [produtos, setProdutos] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contatoLoja, setContatoLoja] = useState('');

  useEffect(() => {
    validateSession();

    const fetchProdutos = async () => {
      const options = { method: 'GET', headers: {} };
      try {
        const response = await fetch(`http://localhost:8080/api/cardapio/${id}/${wid}`, options);
        if (response.status === 404) {
          const errorData = await response.json();
          setErrorMessage(errorData.message);
          setProdutos({});
        } else {
          const data = await response.json();
          setProdutos(data.produtos);
          setErrorMessage('');
          setContatoLoja(data.whatsapp);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setErrorMessage('Erro ao buscar produtos. Tente novamente mais tarde.');
      }
    };

    fetchProdutos();
  }, [id, wid, validateSession]);

  const handleAddProduct = (product) => {
    setSelectedProducts((prev) => [...prev, product]);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cardápio</h1>
      <p className="text-gray-600">ID da Loja: {id}</p>
      <p className="text-gray-600 mb-4">Whatsapp: {wid}</p>
      {errorMessage ? (
        <p className="text-red-500">{errorMessage}</p>
      ) : (
        Object.keys(produtos).map((categoria) => (
          <div key={categoria} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{categoria}</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos[categoria].map((produto) => (
                <li key={produto.id} className="border p-4 rounded shadow hover:shadow-lg">
                  <strong className="block text-lg">{produto.name}</strong>
                  <span className="block text-gray-500">R$ {produto.price}</span>
                  {produto.descricao && <p className="text-sm text-gray-600">{produto.descricao}</p>}
                  <button
                    onClick={() => handleAddProduct(produto)}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Adicionar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <button
        onClick={handleOpenModal}
        disabled={selectedProducts.length === 0}
        className={`fixed bottom-4 right-4 bg-green-500 text-black px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${
          selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
        }`}
      >
        <FaShoppingCart />
        <span>{selectedProducts.length}</span>
      </button>
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedProducts={selectedProducts}
        wid={wid}
        contatoLoja={contatoLoja}
      />
    </div>
  );
};

export default Cardapio;
import { useEffect, useState, useMemo } from 'react'; // Adicionado useMemo
import { useParams } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import CheckoutModal from './CheckoutModal';
import { FaShoppingCart, FaBars, FaPlusCircle } from 'react-icons/fa'; // Adicionar Ícones

const Cardapio = () => {
  const { id, wid } = useParams();
  const { validateSession } = useAuth();
  const [produtos, setProdutos] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  // Modificado: selectedProducts agora guarda { product: ..., quantity: ... }
  const [selectedProducts, setSelectedProducts] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contatoLoja, setContatoLoja] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState({}); 
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    validateSession();

    const fetchProdutos = async () => {
      const options = { method: 'GET', headers: {} };
      try {
        const response = await fetch(`${API_BASE_URL}/api/cardapio/${id}/${wid}`, options);
        if (response.status === 404) {
          const errorData = await response.json();
          setErrorMessage(errorData.message);
          setProdutos({});
        } else {
          const data = await response.json();
          setProdutos(data.produtos); // Atualiza o estado com os produtos
          setFilteredProducts(data.produtos); // Inicializa produtos filtrados com todos os produtos
          setErrorMessage('');
          setContatoLoja(data.whatsapp);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setErrorMessage('Erro ao buscar produtos. Tente novamente mais tarde.');
      }
    };

    fetchProdutos();
  }, [id, wid, validateSession]); // Adicionado validateSession como dependência

  // useEffect para atualizar produtos filtrados quando a categoria ativa ou produtos mudam
  useEffect(() => {
    if (activeCategory && produtos[activeCategory]) {
      setFilteredProducts({ [activeCategory]: produtos[activeCategory] });
    } else {
      setFilteredProducts(produtos); // Mostra todos se nenhuma categoria estiver ativa
    }
  }, [activeCategory, produtos]);

  // Modificado: handleAddProduct para agrupar itens
  const handleAddProduct = (product) => {
    setSelectedProducts((prev) => {
      const existingProductIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingProductIndex > -1) {
        // Produto já existe, incrementa quantidade
        const updatedProducts = [...prev];
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + 1,
        };
        return updatedProducts;
      } else {
        // Produto novo, adiciona com quantidade 1
        return [...prev, { product, quantity: 1 }];
      }
    });
    // Opcional: Adicionar feedback visual rápido
  };

  // NOVO: Função para diminuir a quantidade ou remover item
  const handleDecreaseQuantity = (productId) => {
    setSelectedProducts((prev) => {
      const existingProductIndex = prev.findIndex(item => item.product.id === productId);
      if (existingProductIndex > -1) {
        const updatedProducts = [...prev];
        if (updatedProducts[existingProductIndex].quantity > 1) {
          // Diminui a quantidade
          updatedProducts[existingProductIndex] = {
            ...updatedProducts[existingProductIndex],
            quantity: updatedProducts[existingProductIndex].quantity - 1,
          };
          return updatedProducts;
        } else {
          // Remove o item se a quantidade for 1
          return updatedProducts.filter(item => item.product.id !== productId);
        }
      }
      return prev; // Retorna o estado anterior se o produto não for encontrado
    });
  };

  // NOVO: Função para remover completamente um item do carrinho
  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter(item => item.product.id !== productId));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleCategoryClick = (categoria) => {
    // Se a categoria clicada já está ativa, desativa (mostra todos)
    // Senão, ativa a categoria clicada
    setActiveCategory(prevActiveCategory => 
      prevActiveCategory === categoria ? '' : categoria
    );
    // Fecha a sidebar em telas pequenas ao clicar numa categoria
    if (window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
    }
  };

  // Calcula a quantidade total de itens no carrinho
  const totalItemsInCart = useMemo(() => {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0);
  }, [selectedProducts]);

  return (
    <div className="flex min-h-screen"> {/* Garante altura mínima */}
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white shadow-lg transform transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 z-50 md:translate-x-0 overflow-y-auto`} // Adicionado overflow-y-auto
      >
        <button
          onClick={toggleSidebar}
          className="text-white p-4 focus:outline-none absolute top-1 right-1 md:hidden" // Ajustado posicionamento
        >
          &times;
        </button>
        <h2 className="text-xl font-bold p-4 mt-10 md:mt-4">Categorias</h2> {/* Ajuste de margem */}
        <ul>
          {/* Opção para mostrar todas as categorias */}
          <li
            key="all"
            className={`p-4 hover:bg-gray-700 cursor-pointer ${
              activeCategory === '' ? 'bg-gray-700 font-semibold' : '' // Destaca se ativo
            }`}
            onClick={() => handleCategoryClick('')} 
          >
            Todas
          </li>
          {Object.keys(produtos).map((categoria) => (
            <li
              key={categoria}
              className={`p-4 hover:bg-gray-700 cursor-pointer ${
                activeCategory === categoria ? 'bg-gray-700 font-semibold' : '' // Destaca se ativo
              }`}
              onClick={() => handleCategoryClick(categoria)}
            >
              {categoria}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}
      {/* Ajusta margin-left e padding */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64 md:ml-64' : 'ml-0 md:ml-64'} p-4 md:p-6`}> 
        {/* Header com botão de menu e carrinho */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-800 p-2 focus:outline-none md:hidden" 
          >
            <FaBars size={24} />
          </button>
          {/* Título Centralizado - movido para fora do fluxo principal para centralizar corretamente */}
          <h1 className="text-2xl md:text-3xl font-bold text-center flex-grow">Cardápio</h1>
          {/* Botão do Carrinho movido para o header */}
          <button
            onClick={handleOpenModal}
            disabled={selectedProducts.length === 0}
            className={`relative bg-green-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 ${ 
              selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
            } z-30`} 
          >
            <FaShoppingCart size={20}/>
            {totalItemsInCart > 0 && ( // Mostra contador apenas se houver itens
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItemsInCart}
              </span>
            )}
          </button>
        </div>

        {errorMessage ? (
          <p className="text-red-500 text-center">{errorMessage}</p>
        ) : Object.keys(filteredProducts).length === 0 && !errorMessage ? ( 
            <p className="text-center text-gray-500 mt-10">Nenhum produto encontrado nesta categoria.</p> 
        ) : (
          Object.keys(filteredProducts).map((categoria) => ( 
            <div key={categoria} id={categoria} className="mb-8"> {/* Aumentado margin-bottom */}
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-700">{categoria}</h2> {/* Estilizado título da categoria */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"> {/* Adicionado xl breakpoint e gap maior */}
                {filteredProducts[categoria].map((produto) => ( 
                  <li
                    key={produto.id}
                    // Removido onClick daqui, adicionado botão específico
                    className="bg-white text-black border border-gray-200 p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col justify-between" 
                  >
                    <div> 
                        <strong className="block text-lg font-medium">{produto.name}</strong>
                        {produto.descricao && (
                          <p className="text-sm text-gray-600 mt-1 mb-2">{produto.descricao}</p>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-lg text-gray-800 font-semibold">R$ {produto.price}</span> 
                        <button 
                          onClick={() => handleAddProduct(produto)} 
                          className="text-green-500 hover:text-green-600 p-1 rounded-full hover:bg-green-100 transition-colors"
                          aria-label={`Adicionar ${produto.name} ao carrinho`}
                        >
                           <FaPlusCircle size={24} />
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        
        {/* Botão do Carrinho foi movido para o header */}

        <CheckoutModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedProducts={selectedProducts} // Passa a nova estrutura para o modal
          wid={wid}
          contatoLoja={contatoLoja}
          onIncreaseQuantity={handleAddProduct} // Reutiliza handleAddProduct para aumentar
          onDecreaseQuantity={handleDecreaseQuantity} // Passa a função de diminuir
          onRemoveProduct={handleRemoveProduct} // Passa a função de remover
        />
      </div>
    </div>
  );
};

export default Cardapio;
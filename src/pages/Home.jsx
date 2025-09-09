import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { validateSession, token, user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    validateSession();
  }, [validateSession]);
  useEffect(() => {
    const fetchProducts = async () => {
      if (!token || !user?.loja_id) return;
      
      setLoading(true);
      try {
        const options = {
          method: 'GET',
          headers: {
            authorization: token
          },
          credentials: 'include'
        };

        const response = await fetch(`${API_BASE_URL}/api/produtos?loja_id=${user.loja_id}`, options);
        const data = await response.json();
        
        if (data.success) {
          // Extrair todas as categorias únicas dos produtos
          const allCategories = [...new Set(data.produtos.map(product => product.categoria))];
          setCategories(allCategories);
          
          // Armazenar todos os produtos em uma lista plana
          setProducts(data.produtos.filter(product => product.disponibilidade === 1));
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };    fetchProducts();
  }, [token, API_BASE_URL, user?.loja_id]);

  // Filtrar produtos baseado no termo de pesquisa
  const filteredProducts = products.filter(product =>
    product.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header categories={categories} />
      <div className="flex-grow flex">
        {/* Sidebar removido para mostrar todos os produtos sem separação */}
        <div className="pt-16 p-6 flex-grow">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Todos os Produtos</h1>
            
            {/* Barra de pesquisa */}
            <div className="mb-6 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-400">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{product.nome}</h3>
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                          {product.categoria}
                        </span>
                      </div>
                      {product.descricao && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.descricao}</p>
                      )}
                      <div className="flex justify-between items-end">
                        <p className="text-green-400 font-bold">
                          R$ {parseFloat(product.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

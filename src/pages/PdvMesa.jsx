import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { FaTrash, FaChair } from 'react-icons/fa';
import PdvActions from '../components/PdvActions';
import CategoryMenu from '../components/CategoryMenu';
import { verificarCaixaAberto } from '../services/CaixaService';

const PdvMesa = () => {
  const { validateSession, token, user } = useAuth();
  const { mesaId } = useParams(); // mesaId from useParams is a string
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [pdv, setPdv] = useState(() => {
    const pdv_salvo = localStorage.getItem(`pdv_mesa_${mesaId}`);
    const currentNumericMesaId = parseInt(mesaId, 10);

    const defaultState = {
      pdv: {
        caixa: {
          id_caixa: null,
          abertura_caixa: null,
          operador: { id: null, nome: '', cargo: '', pode_cancelar_itens: false },
        },
        venda: {
          id_venda: '',
          tipo: '',
          status_venda: '',
          dados_cliente: { nome: '', cpf: '', endereco: null },
          produtos: [],
          total_venda: 0,
          observacoes: '',
          mesa: currentNumericMesaId, // Ensure mesa is a number
        },
        totais: { quantidade_itens: 0, valor_total: 0 },
      },
    };

    if (pdv_salvo) {
      try {
        const loadedPdv = JSON.parse(pdv_salvo);
        // Ensure the pdv.venda.mesa path exists and is correctly typed
        if (loadedPdv.pdv && loadedPdv.pdv.venda) {
          const mesaValue = loadedPdv.pdv.venda.mesa;
          if (typeof mesaValue !== 'undefined' && mesaValue !== null) {
            const parsedMesa = parseInt(mesaValue, 10);
            loadedPdv.pdv.venda.mesa = isNaN(parsedMesa) ? currentNumericMesaId : parsedMesa;
          } else {
            loadedPdv.pdv.venda.mesa = currentNumericMesaId;
          }
        } else {
          // If essential structure is missing, rebuild it or use default
          if (!loadedPdv.pdv) loadedPdv.pdv = { ...defaultState.pdv };
          if (!loadedPdv.pdv.venda) loadedPdv.pdv.venda = { ...defaultState.pdv.venda };
          // Ensure mesa is set if the venda object was missing or incomplete
          loadedPdv.pdv.venda.mesa = currentNumericMesaId;
        }
        return loadedPdv;
      } catch (e) {
        console.error("Erro ao carregar PDV do localStorage, usando estado padrão:", e);
        return defaultState;
      }
    }
    return defaultState;
  });
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/produtos?loja_id=${user.loja_id}`, {
          headers: {
            Authorization: `${token}`,
          },
          credentials: 'include',
        });
        const data = await response.json();
        if (data) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    const verificarCaixa = async () => {
      if (!user || !token) return;
      try {
        const data = await verificarCaixaAberto(user.id, token);
        if (data.success && data.caixas.length > 0 && data.caixas[0].data_fechamento === null) {
          const updatedPdv = { ...pdv };
          updatedPdv.pdv.caixa.id_caixa = data.caixas[0].id;
          updatedPdv.pdv.caixa.abertura_caixa = data.caixas[0].data_abertura;
          updatedPdv.pdv.caixa.operador.id = data.caixas[0].id;
          updatedPdv.pdv.caixa.operador.nome = data.caixas[0].nome;
          updatedPdv.pdv.caixa.operador.cargo = data.caixas[0].descricao;
          updatedPdv.pdv.caixa.operador.pode_cancelar_itens = false;
          setPdv(updatedPdv);
        } else {
          console.warn('Nenhum caixa aberto encontrado.');
          navigate('/caixa');
        }
      } catch (error) {
        console.error('Erro ao verificar caixa aberto:', error);
      }
    };

    // Ensure user and user.loja_id are available before dependent operations
    if (user && user.loja_id) {
        fetchProducts();
        verificarCaixa(); // verificarCaixa might also depend on user.id
    }
    loadOrders(); // loadOrders depends on mesaId, not directly on user
  }, [token, user, mesaId]); // Added mesaId to dependencies for loadOrders consistency

  useEffect(() => {
    localStorage.setItem(`pdv_mesa_${mesaId}`, JSON.stringify(pdv));
  }, [pdv, mesaId]);



  const addToOrder = (product) => {
    let prevOrders = [...orders];
    const existingProductIndexOrder = prevOrders.findIndex(
      (order) => order.id === product.id && !order.status?.impresso
    );

    if (existingProductIndexOrder !== -1) {
      const updatedOrders = [...prevOrders];
      const existingProductOrder = updatedOrders[existingProductIndexOrder];
      existingProductOrder.quantity = (existingProductOrder.quantity || 1) + 1;
      existingProductOrder.subtotal = existingProductOrder.quantity * parseFloat(existingProductOrder.price);
      prevOrders = updatedOrders;
    } else {
      prevOrders = [
        ...prevOrders,
        {
          ...product,
          quantity: 1,
          subtotal: parseFloat(product.price),
          status: {
            impresso: false,
            cancelado: false,
          },
        },
      ];
    }
    setOrders(prevOrders);

    const updatedPdv = { ...pdv };
    if (!updatedPdv.pdv.venda.produtos) {
      updatedPdv.pdv.venda.produtos = [];
    }

    const existingProductIndex = updatedPdv.pdv.venda.produtos.findIndex(
      (order) => order.id_produto === product.id && !order.status?.impresso
    );

    if (existingProductIndex !== -1) {
      const existingProduct = updatedPdv.pdv.venda.produtos[existingProductIndex];
      existingProduct.quantidade += 1;
      existingProduct.subtotal = existingProduct.quantidade * parseFloat(existingProduct.preco_unitario);
    } else {
      updatedPdv.pdv.venda.produtos.push({
        id_produto: product.id,
        nome: product.name,
        preco_unitario: parseFloat(product.price),
        quantidade: 1,
        subtotal: parseFloat(product.price),
        status: {
          impresso: false,
          cancelado: false,
        },
      });
    }

    updatedPdv.pdv.venda.total_venda = updatedPdv.pdv.venda.produtos.reduce(
      (total, item) => total + item.subtotal,
      0
    );
    updatedPdv.pdv.totais.quantidade_itens = updatedPdv.pdv.venda.produtos.reduce(
      (total, item) => total + item.quantidade,
      0
    );
    updatedPdv.pdv.totais.valor_total = updatedPdv.pdv.venda.total_venda;

    setPdv(updatedPdv);
  };

  const removeFromOrder = (productId) => {
    let prevOrders = [...orders];
    const existingProductIndexOrder = prevOrders.findIndex(
      (order) => order.id === productId && !order.status?.impresso
    );

    if (existingProductIndexOrder !== -1) {
      const updatedOrders = [...prevOrders];
      const existingProductOrder = updatedOrders[existingProductIndexOrder];
      if (existingProductOrder.quantity > 1) {
        existingProductOrder.quantity -= 1;
        existingProductOrder.subtotal = existingProductOrder.quantity * parseFloat(existingProductOrder.price);
      } else {
        updatedOrders.splice(existingProductIndexOrder, 1);
      }
      prevOrders = updatedOrders;
    }
    setOrders(prevOrders);

    const updatedPdv = { ...pdv };
    const existingProductIndex = updatedPdv.pdv.venda.produtos.findIndex(
      (order) => order.id_produto === productId && !order.status?.impresso
    );

    if (existingProductIndex !== -1) {
      const existingProduct = updatedPdv.pdv.venda.produtos[existingProductIndex];
      if (existingProduct.quantidade > 1) {
        existingProduct.quantidade -= 1;
        existingProduct.subtotal = existingProduct.quantidade * parseFloat(existingProduct.preco_unitario);
      } else {
        updatedPdv.pdv.venda.produtos.splice(existingProductIndex, 1);
      }
    }

    updatedPdv.pdv.venda.total_venda = updatedPdv.pdv.venda.produtos.reduce(
      (total, item) => total + item.subtotal,
      0
    );
    updatedPdv.pdv.totais.quantidade_itens = updatedPdv.pdv.venda.produtos.reduce(
      (total, item) => total + item.quantidade,
      0
    );
    updatedPdv.pdv.totais.valor_total = updatedPdv.pdv.venda.total_venda;

    setPdv(updatedPdv);
  };

  const loadOrders = () => {
    const pdv_salvo = localStorage.getItem(`pdv_mesa_${mesaId}`);
    if (!pdv_salvo) {
      console.warn(`Nenhum PDV salvo encontrado para Mesa ${mesaId}.`);
      setOrders([]);
      return;
    }

    const pdvData = JSON.parse(pdv_salvo);
    if (!pdvData.pdv.venda || !pdvData.pdv.venda.produtos) {
      console.warn(`PDV para Mesa ${mesaId} não contém dados de venda ou produtos.`);
      setOrders([]);
      return;
    }

    const updatedOrders = pdvData.pdv.venda.produtos.map((product) => ({
      id: product.id_produto,
      name: product.nome,
      price: product.preco_unitario,
      quantity: product.quantidade,
      subtotal: product.subtotal,
      status: product.status,
    }));

    setOrders(updatedOrders);
  };

  const categories = Object.keys(products);

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header categories={categories} onSelectCategory={setSelectedCategory} />
      <CategoryMenu categories={categories} onSelectCategory={setSelectedCategory} />
      <div className="flex-grow flex">
        <div className="ml-64 pt-20 p-6 flex-grow flex"> {/* Modificado: aumentado pt-16 para pt-20 e p-4 para p-6 */}
          <div className="w-3/4 pr-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold flex items-center">
                <FaChair className="mr-2 text-yellow-500" /> 
                Mesa {mesaId}
              </h1>
              <div className="bg-gray-800 px-4 py-2 rounded-lg shadow">
                <span className="font-semibold">Total: </span>
                <span className="text-xl text-green-400">
                  R$ {orders.reduce((total, order) => total + parseFloat(order.subtotal), 0).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-6">
              {selectedCategory ? (
                // Quando uma categoria é selecionada, mostrar apenas produtos dessa categoria
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {products[selectedCategory]?.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:shadow-lg transform hover:scale-105"
                        onClick={() => addToOrder(product)}
                      >
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="text-green-400 font-medium mt-2">R$ {parseFloat(product.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Quando nenhuma categoria é selecionada, mostrar todos os produtos
                <div>
                  <h3 className="text-xl font-bold mb-4">Todos os Produtos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {Object.values(products).flat().map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:shadow-lg transform hover:scale-105"
                        onClick={() => addToOrder(product)}
                      >
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="text-green-400 font-medium mt-2">R$ {parseFloat(product.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="w-1/4 pl-4">
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-full">
              <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-700 pb-2">Resumo do Pedido</h2>
              {orders.length > 0 ? (
                <ul className="mt-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {orders.map((order, index) => (
                    <li
                      key={index}
                      className={`border-b border-gray-700 py-3 ${order.status?.impresso ? 'text-gray-500 italic' : ''} flex justify-between items-center`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold text-green-400 mr-2">{order.quantity}x</span>
                          <span>{order.name}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          R$ {parseFloat(order.price).toFixed(2)} un = R$ {order.subtotal.toFixed(2)}
                        </div>
                      </div>
                      <button
                        className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromOrder(order.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <p className="text-center">Nenhum item adicionado</p>
                  <p className="text-center text-sm mt-2">Selecione produtos para adicionar ao pedido</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-green-400">
                    R$ {orders.reduce((total, order) => total + parseFloat(order.subtotal), 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {orders.reduce((total, order) => total + order.quantity, 0)} itens
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {user?.loja_id && (
        <PdvActions 
          pdv={pdv} 
          setPdv={setPdv} 
          setOrders={setOrders} 
          setIsModalOpen={setIsModalOpen}
          loja_id={user.loja_id} 
        />
      )}
    </div>
  );
};

export default PdvMesa;

import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import PdvActions from '../components/PdvActions';
import CategoryMenu from '../components/CategoryMenu';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorModal from '../components/ApiErrorModal';
import AccessDeniedPage from '../components/AccessDeniedPage';
import templatePdv from '../templates/templatePDV.json';
import { FaTrash, FaCashRegister } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { verificarCaixaAberto, abrirCaixa } from '../services/CaixaService';
import useApiError from '../hooks/useApiError';

const Caixa = () => {
  const { validateSession, token, setToken, user } = useAuth(); 
  const { errorInfo, accessDenied, handleApiError, closeError } = useApiError();
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [pdv, setPdv] = useState(() => {
    const pdv_salvo = localStorage.getItem('pdv');
    return pdv_salvo ? JSON.parse(pdv_salvo) : templatePdv;
  });
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  
  const navigate = useNavigate();
  
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !token) return;
        try {
          const response = await fetch(`${API_BASE_URL}/api/produtos?loja_id=${user.loja_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
            credentials: 'include',
          });
          const data = await response.json();
          if (data.auth === false) {
            console.error('Token inválido');
            setToken(null);
            navigate('/login');
          }
          setProducts(data);
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
        }
    };

    fetchProducts();
  }, [token, navigate, setToken, user]);
  useEffect(() => {
    const verificarCaixa = async () => {
      if (!user || !token) return;
      
      try {
        const data = await verificarCaixaAberto(user.id, token, user.loja_id);
        if (data.success && data.caixas.length > 0 && data.caixas[0].data_fechamento === null) {
          const updatedPdv = { ...pdv };
          updatedPdv.pdv.caixa.id_caixa = data.caixas[0].id;
          updatedPdv.pdv.caixa.abertura_caixa = data.caixas[0].data_abertura;
          updatedPdv.pdv.caixa.operador.id = data.caixas[0].id;
          updatedPdv.pdv.caixa.operador.nome = data.caixas[0].nome;
          updatedPdv.pdv.caixa.operador.cargo = data.caixas[0].descricao;
          updatedPdv.pdv.caixa.operador.pode_cancelar_itens = false;
          setPdv(updatedPdv);
          loadOrders();
          setCaixaAberto(true);
        } else {
          setCaixaAberto(false);
        }
      } catch (error) {
        console.error('Erro ao verificar caixa:', error);
        setCaixaAberto(false);
      } finally {
        setIsInitializing(false);
      }
    };

    if (user && token) {
      verificarCaixa();
    }
  }, [token, user]);

  useEffect(() => {
    localStorage.setItem('pdv', JSON.stringify(pdv));
  }, [pdv]);

  const categories = Object.keys(products);

  const loadOrders = () => {
    const updatedOrders = [];
    pdv.pdv.venda.produtos.forEach((product) => {
      updatedOrders.push({
        id: product.id_produto,
        name: product.nome,
        price: product.preco_unitario,
        quantity: product.quantidade,
        subtotal: product.subtotal,
        status: product.status
      });
    });
    setOrders(updatedOrders);
  };

  const addToOrder = (product) => {
    let prevOrders = [...orders];
    const existingProductIndexOrder = prevOrders.findIndex(
      (order) => order.id === product.id && !order.status.impresso
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
            cancelado: false
          }
        }
      ];
    }
    setOrders(prevOrders);

    const updatedPdv = { ...pdv };
    if (!updatedPdv.pdv.venda.produtos) {
      updatedPdv.pdv.venda.produtos = [];
    }
    const existingProductIndex = updatedPdv.pdv.venda.produtos.findIndex(
      (order) => order.id_produto === product.id && !order.status.impresso
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
          cancelado: false
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
      (order) => order.id === productId && !order.status.impresso
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
      (order) => order.id_produto === productId && !order.status.impresso
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

  const handleAbrirCaixa = async () => {
    if (!user || !user.id || typeof user.loja_id === 'undefined') { // Check specifically for undefined
      await handleApiError({
        success: false,
        message: 'Informações do usuário ou loja_id ausentes para abrir o caixa.'
      }, 'Erro de validação');
      return;
    }
    
    const data = await abrirCaixa(user.id, valorInicial, token, user.loja_id); // Pass user.loja_id
    
    if (data.success) {
      const updatedPdv = { ...pdv };
      updatedPdv.pdv.caixa.id_caixa = user.id;
      updatedPdv.pdv.caixa.abertura_caixa = new Date().toISOString();
      updatedPdv.pdv.caixa.operador.id = user.id;
      updatedPdv.pdv.caixa.operador.nome = 'Operador';
      updatedPdv.pdv.caixa.operador.cargo = 'Cargo';
      updatedPdv.pdv.caixa.operador.pode_cancelar_itens = true;
      setPdv(updatedPdv);
      setCaixaAberto(true);
      navigate(0);
    } else {
      // Tratar erro da API usando o novo sistema
      if (data._response) {
        await handleApiError(data._response, 'Erro ao abrir caixa');
      } else {
        await handleApiError(data, 'Erro ao abrir caixa');
      }
    }
  };
  
  // Se o acesso foi negado, mostrar página de acesso negado
  if (accessDenied.isBlocked) {
    return (
      <AccessDeniedPage
        requiredPermission={accessDenied.requiredPermission}
        isOwnerOnly={accessDenied.isOwnerOnly}
        pageName={accessDenied.pageName}
        originalError={accessDenied.originalError}
      />
    );
  }

  // Mostrar loading durante a inicialização
  if (isInitializing) {
    return (
      <div className="bg-gray-900 text-white flex flex-col min-h-screen">
        <LoadingSpinner 
          fullScreen={true}
          size="xl"
          message="Verificando caixa aberto..."
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header categories={categories} onSelectCategory={setSelectedCategory} />
      {caixaAberto ? (
        <>
          <CategoryMenu categories={categories} onSelectCategory={setSelectedCategory} />
          <div className="flex-grow flex">
            <div className="ml-64 pt-20 p-6 flex-grow flex"> {/* Modificado: aumentado pt-16 para pt-20 e p-4 para p-6 */}
              <div className="w-3/4 pr-4">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold flex items-center">
                    <FaCashRegister className="mr-2 text-yellow-500" /> 
                    PDV - Caixa
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
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {products[selectedCategory]?.filter(product => product.disponibilidade === 1).map((product) => (
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
                        {Object.values(products).flat()
                          .filter(product => product.disponibilidade === 1)
                          .map((product) => (
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
                            className={`text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-700 ${order.status?.impresso ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!order.status?.impresso) {
                                removeFromOrder(order.id);
                              }
                            }}
                            disabled={order.status?.impresso}
                            title={order.status?.impresso ? "Item impresso na cozinha" : "Remover item"}
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
        </>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold mb-2 text-center">Abrir Caixa</h1>
            <p className="text-gray-300 mb-6 text-center">
              Informe o valor inicial para registrar a abertura do caixa.
            </p>
            
            <input
              type="number"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              className="bg-gray-700 text-white w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              placeholder="Valor Inicial (R$)"
              autoFocus
            />
            
            <button
              onClick={handleAbrirCaixa}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaCashRegister className="mr-2" /> Abrir Caixa
            </button>
          </div>
        </div>
      )}
      {caixaAberto && user?.loja_id && ( 
        <PdvActions
          pdv={pdv} 
          setPdv={setPdv}
          setOrders={setOrders}
          loja_id={user.loja_id} 
        />
      )}

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
    </div>
  );
};

export default Caixa;
import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import PdvActions from '../components/PdvActions';
import { FaTrash, FaSearch, FaUser, FaPhone } from 'react-icons/fa';
import CategoryMenu from '../components/CategoryMenu';
import { verificarCaixaAberto } from '../services/CaixaService';
import { useNavigate } from 'react-router-dom';
import FinalizarButton from '../components/FinalizarButton';

const DELIVERY_STORAGE_KEY = 'pdv_delivery';

const Delivery = () => {
  const { validateSession, token, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(true);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    address: '',
    id_cliente: null,
  });
  const [pdv, setPdv] = useState(() => {
    const pdv_salvo = localStorage.getItem(DELIVERY_STORAGE_KEY);

    const defaultState = {
      pdv: {
        caixa: {
          id_caixa: null,
          abertura_caixa: null,
          operador: {
            id: null,
            nome: '',
            cargo: '',
            pode_cancelar_itens: false,
          },
        },
        venda: {
          id_venda: '',
          tipo: 'delivery',
          status_venda: '',
          dados_cliente: {
            id_cliente: null,
            nome: '',
            telefone: '',
            endereco: '',
            cpf: '',
          },
          produtos: [],
          total_venda: 0,
          observacoes: '',
        },
        totais: {
          quantidade_itens: 0,
          valor_total: 0,
        },
      },
    };

    if (pdv_salvo) {
      try {
        const loadedPdv = JSON.parse(pdv_salvo);
        // Check if we have any client data, if so set flags for UI state
        if (loadedPdv.pdv?.venda?.dados_cliente?.nome) {
          setTimeout(() => {
            setIsSearching(false);
            setPdvOpened(true);
          }, 0);
        }
        return loadedPdv;
      } catch (e) {
        console.error("Erro ao carregar PDV do localStorage, usando estado padrão:", e);
        return defaultState;
      }
    }
    return defaultState;
  });
  const [pdvOpened, setPdvOpened] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !token || !user.loja_id) return;
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

    if (user && user.loja_id) {
      fetchProducts();
      verificarCaixa();
      loadOrders();
    }
  }, [token, user]);

  // Save PDV state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(pdv));
  }, [pdv]);

  const loadOrders = () => {
    const pdv_salvo = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (!pdv_salvo) {
      console.warn('Nenhum PDV de delivery salvo encontrado.');
      return;
    }

    try {
      const pdvData = JSON.parse(pdv_salvo);
      if (!pdvData.pdv.venda || !pdvData.pdv.venda.produtos) {
        console.warn('PDV de delivery não contém dados de venda ou produtos.');
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
    } catch (error) {
      console.error('Erro ao carregar pedidos do localStorage:', error);
    }
  };

  const clearDeliveryData = () => {
    localStorage.removeItem(DELIVERY_STORAGE_KEY);
    setPdv({
      pdv: {
        caixa: {
          id_caixa: null,
          abertura_caixa: null,
          operador: {
            id: null,
            nome: '',
            cargo: '',
            pode_cancelar_itens: false,
          },
        },
        venda: {
          id_venda: '',
          tipo: 'delivery',
          status_venda: '',
          dados_cliente: {
            id_cliente: null,
            nome: '',
            telefone: '',
            endereco: '',
            cpf: '',
          },
          produtos: [],
          total_venda: 0,
          observacoes: '',
        },
        totais: {
          quantidade_itens: 0,
          valor_total: 0,
        },
      },
    });
    setOrders([]);
    setSearchPhone('');
    setCustomerDetails({
      name: '',
      phone: '',
      address: '',
      id_cliente: null,
    });
    setIsSearching(true);
    setIsCreatingCustomer(false);
    setPdvOpened(false);
  };

  const searchCustomer = async () => {
    if (!searchPhone.trim()) {
      alert('Por favor, informe um telefone para busca');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clientes/por-telefone/${searchPhone}/${user.loja_id}`, 
        {
          headers: {
            Authorization: `${token}`,
          },
          credentials: 'include',
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        if (data.clienteEncontrado) {
          // Cliente encontrado, atualizar os detalhes
          setCustomerDetails({
            name: data.cliente.nome,
            phone: data.cliente.telefone,
            address: data.cliente.endereco || '',
            id_cliente: data.cliente.id,
          });
          
          // Atualizar o PDV com os dados do cliente
          const updatedPdv = { ...pdv };
          // Ensure we set tipo to 'delivery' for proper receipt handling
          updatedPdv.pdv.venda.tipo = 'delivery';
          updatedPdv.pdv.venda.dados_cliente = {
            id_cliente: data.cliente.id,
            nome: data.cliente.nome,
            telefone: data.cliente.telefone,
            endereco: data.cliente.endereco || '',
            cpf: data.cliente.cpf || '',
          };
          setPdv(updatedPdv);
          
          // Abrir o PDV diretamente
          setPdvOpened(true);
          setIsSearching(false);
        } else {
          // Cliente não encontrado, mostrar formulário de cadastro
          setIsCreatingCustomer(true);
          setIsSearching(false);
          setCustomerDetails({ ...customerDetails, phone: searchPhone });
        }
      } else {
        alert('Erro ao buscar cliente: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      alert('Erro ao buscar cliente. Por favor, tente novamente.');
    }
  };

  const createCustomer = async () => {
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
      alert('Por favor, preencha todos os dados do cliente.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/clientes/${user.loja_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          nome: customerDetails.name,
          telefone: customerDetails.phone,
          endereco: customerDetails.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar o PDV com os dados do novo cliente
        const updatedPdv = { ...pdv };
        // Ensure we set tipo to 'delivery' for proper receipt handling
        updatedPdv.pdv.venda.tipo = 'delivery';
        updatedPdv.pdv.venda.dados_cliente = {
          id_cliente: data.cliente.id,
          nome: data.cliente.nome,
          telefone: data.cliente.telefone,
          endereco: data.cliente.endereco,
          cpf: data.cliente.cpf || '',
        };
        setPdv(updatedPdv);
        
        // Update customer details with ID
        setCustomerDetails({
          ...customerDetails,
          id_cliente: data.cliente.id
        });
        
        // Abrir o PDV
        setPdvOpened(true);
        setIsCreatingCustomer(false);
      } else {
        alert('Erro ao cadastrar cliente: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente. Por favor, tente novamente.');
    }
  };

  const backToSearch = () => {
    setIsSearching(true);
    setIsCreatingCustomer(false);
  };

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

  const categories = Object.keys(products);

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header categories={categories} onSelectCategory={setSelectedCategory} />
      
      {isSearching ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold mb-6 text-center">Delivery</h1>
            <p className="text-gray-300 mb-6 text-center">
              Digite o telefone do cliente para iniciar o atendimento
            </p>
            
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaPhone className="text-gray-400" />
              </div>
              <input
                type="tel"
                placeholder="(99) 99999-9999"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={searchCustomer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaSearch className="mr-2" /> Buscar Cliente
            </button>
            
            {orders.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-blue-400">Pedido em andamento</h3>
                  <span className="text-sm bg-blue-600 rounded-full px-3 py-1">{orders.length} itens</span>
                </div>
                <button
                  onClick={() => {
                    setPdvOpened(true);
                    setIsSearching(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                >
                  Continuar Pedido
                </button>
                <button
                  onClick={clearDeliveryData}
                  className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                >
                  Limpar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      ) : isCreatingCustomer ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold mb-2 text-center">Novo Cliente</h1>
            <p className="text-gray-300 mb-6 text-center">
              Preencha os dados para cadastrar o cliente
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Nome</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                className="bg-gray-700 text-white w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Telefone</label>
              <input
                type="tel"
                placeholder="(99) 99999-9999"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                className="bg-gray-700 text-white w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Endereço</label>
              <textarea
                placeholder="Endereço completo"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                className="bg-gray-700 text-white w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={backToSearch}
                className="w-1/3 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={createCustomer}
                className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaUser className="mr-2" /> Cadastrar e Continuar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex">
          <CategoryMenu categories={categories} onSelectCategory={setSelectedCategory} />
          <div className="ml-64 pt-16 p-4 flex-grow flex">
            <div className="w-3/4 pr-4">
              <div className="bg-gray-800 p-4 rounded-lg mb-4 shadow-md">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl text-center font-bold">PDV - Delivery</h1>
                  <button
                    onClick={clearDeliveryData}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-lg transition-colors"
                  >
                    Novo Pedido
                  </button>
                </div>
                <div className="mt-2 bg-gray-700 p-3 rounded-lg">
                  <h3 className="font-semibold text-lg">Cliente: {pdv.pdv.venda.dados_cliente.nome}</h3>
                  <p className="text-gray-300">
                    <span className="font-medium">Telefone:</span> {pdv.pdv.venda.dados_cliente.telefone}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Endereço:</span> {pdv.pdv.venda.dados_cliente.endereco}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                {selectedCategory && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {products[selectedCategory]?.map((product) => (
                        <div
                          key={product.id}
                          className="bg-gray-800 p-4 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
                          onClick={() => addToOrder(product)}
                        >
                          <h3 className="text-lg font-bold">{product.name}</h3>
                          <p className="text-gray-400">R$ {product.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-1/4 pl-4 bg-yellow-100 text-gray-900 p-4 rounded-lg shadow-lg flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Resumo do Pedido</h2>
              <div className="flex-grow">
                {orders.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum item adicionado ainda
                  </div>
                ) : (
                  <ul className="mt-4 max-h-[calc(100vh-350px)] overflow-y-auto">
                    {orders.map((order, index) => (
                      <li
                        key={index}
                        className={`border-b border-gray-300 py-2 ${order.status?.impresso ? 'text-gray-600 italic' : ''} flex justify-between items-center`}
                      >
                        <span>
                          {order.quantity}x - {order.name} - R$ {order.price} - R$ {order.subtotal.toFixed(2)}
                        </span>
                        <FaTrash
                          className="text-red-500 cursor-pointer hover:text-red-700"
                          onClick={() => removeFromOrder(order.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 font-bold text-xl border-t border-gray-300 pt-3">
                Total: R$
                {orders.reduce((total, order) => total + parseFloat(order.subtotal), 0).toFixed(2)}
              </div>
              {orders.length > 0 && user?.loja_id && (
                <div className="mt-4">
                  <FinalizarButton 
                    pdv={pdv} 
                    setPdv={setPdv} 
                    setOrders={setOrders}
                    loja_id={user.loja_id} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {pdvOpened && user?.loja_id && <PdvActions pdv={pdv} setPdv={setPdv} setOrders={setOrders} loja_id={user.loja_id} />}
    </div>
  );
};

export default Delivery;

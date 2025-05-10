import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, redirect } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { FaTrash } from 'react-icons/fa';
import PdvActions from '../components/PdvActions';
import CategoryMenu from '../components/CategoryMenu';
import { verificarCaixaAberto } from '../services/CaixaService';

const PdvMesa = () => {
  const { validateSession, token, user } = useAuth();
  const { mesaId } = useParams();
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [pdv, setPdv] = useState(() => {
    const pdv_salvo = localStorage.getItem(`pdv_mesa_${mesaId}`);
    return pdv_salvo
      ? JSON.parse(pdv_salvo)
      : {
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
            tipo: '',
            status_venda: '',
            dados_cliente: {
              nome: '',
              cpf: '',
              endereco: null,
            },
            produtos: [],
            total_venda: 0,
            observacoes: '',
            mesa: mesaId,
          },
          totais: {
            quantidade_itens: 0,
            valor_total: 0,
          },
        },
      };
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

    fetchProducts();
    verificarCaixa();
    loadOrders();
  }, [token, user]);

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
        <div className="ml-64 pt-16 p-4 flex-grow flex">
          <div className="w-3/4 pr-4">
            <h1 className="text-3xl text-center font-bold">PDV - Mesa {mesaId}</h1>
            <div className="mt-8">
              {selectedCategory && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {products[selectedCategory]?.map((product) => (
                      <div
                        key={product.id}
                        className="bg-gray-800 p-4 rounded shadow cursor-pointer"
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
          <div className="w-1/4 pl-4 bg-yellow-100 text-gray-900 p-4 rounded">
            <h2 className="text-2xl font-bold">Resumo do Pedido</h2>
            <ul className="mt-4">
              {orders.map((order, index) => (
                <li
                  key={index}
                  className={`border-b border-gray-300 py-2 ${order.status?.impresso ? 'text-gray-600 italic' : ''} flex justify-between items-center`}
                >
                  <span>{order.quantity}x - {order.name} - R$ {order.price} - R$ {order.subtotal.toFixed(2)}</span>
                  <FaTrash
                    className="text-red-500 cursor-pointer"
                    onClick={() => removeFromOrder(order.id)}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 font-bold">
              Total: R$
              {orders.reduce((total, order) => total + parseFloat(order.subtotal), 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      <PdvActions pdv={pdv} setPdv={setPdv} setOrders={setOrders} />
    </div>
  );
};

export default PdvMesa;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import PdvActions from '../components/PdvActions';
import templatePdv from '../templates/templatePDV.json';
import { FaTrash } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { verificarCaixaAberto, abrirCaixa } from '../services/CaixaService';

const Caixa = () => {
  const { validateSession, token, setToken, user } = useAuth(); 
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [pdv, setPdv] = useState(() => {
    const pdv_salvo = localStorage.getItem('pdv');
    return pdv_salvo ? JSON.parse(pdv_salvo) : templatePdv;
  });
  
  const navigate = useNavigate();
  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !token) return;
        try {
          const response = await fetch(`http://localhost:8080/api/produtos?loja_id=${user.loja_id}`, {
            headers: {
              Authorization: `${token}`,
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
        loadOrders();
        setCaixaAberto(true);
      } else {
        setCaixaAberto(false);
      }
    };

    verificarCaixa();
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
    const data = await abrirCaixa(user.id, valorInicial, token);
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
      console.error('Erro ao abrir caixa');
    }
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col">
      <Header categories={categories} onSelectCategory={setSelectedCategory} />
      <div className="flex-grow flex">
        <div className="ml-64 pt-16 p-4 flex-grow flex">
          {caixaAberto ? (
            <>
              <div className="w-3/4 pr-4">
                <h1 className="text-3xl text-center font-bold">Caixa</h1>
                <div className="mt-8">
                  {selectedCategory && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {products[selectedCategory]?.filter(product => product.disponibilidade === 1).map((product) => (
                          <div
                            key={product.id}
                            className="bg-gray-800 p-4 rounded shadow cursor-pointer"
                            onClick={() => addToOrder(product)}
                          >
                            <h3 className="text-lg font-bold">{product.name}</h3>
                            <p className="text-gray-400">R${product.price}</p>
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
                      className={`border-b border-gray-300 py-2 ${order.status.impresso ? 'text-gray-600 italic' : ''} flex justify-between items-center`}
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
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              <h1 className="text-3xl font-bold mb-4">Abrir Caixa</h1>
              <input
                type="number"
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
                className="p-2 rounded bg-gray-800 text-white mb-4"
                placeholder="Valor Inicial"
                autoFocus
              />
              <button
                onClick={handleAbrirCaixa}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Abrir Caixa
              </button>
            </div>
          )}
        </div>
      </div>
      {caixaAberto && (
        <PdvActions
          pdv={pdv}
          setPdv={setPdv}
          setOrders={setOrders}
        />
      )}
    </div>
  );
};

export default Caixa;
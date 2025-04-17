import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import PdvActions from '../components/PdvActions';
import { FaTrash } from 'react-icons/fa';

const Delivery = () => {
  const { validateSession, token, user } = useAuth();
  const [products, setProducts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [orders, setOrders] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    cpf: '',
    address: '',
  });
  const [pdv, setPdv] = useState(() => ({
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
          nome: '',
          cpf: '',
          endereco: '',
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
  }));
  const [pdvOpened, setPdvOpened] = useState(false);

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
        if (data) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    fetchProducts();
  }, [token, user]);

  const handleOpenPdv = () => {
    if (!customerDetails.name || !customerDetails.cpf || !customerDetails.address) {
      alert('Por favor, preencha todos os dados do cliente.');
      return;
    }

    const updatedPdv = { ...pdv };
    updatedPdv.pdv.venda.dados_cliente = { ...customerDetails };
    setPdv(updatedPdv);
    setPdvOpened(true);
  };

  const addToOrder = (product) => {
    // ...similar logic to addToOrder in PdvMesa...
  };

  const removeFromOrder = (productId) => {
    // ...similar logic to removeFromOrder in PdvMesa...
  };

  const categories = Object.keys(products);

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header categories={categories} onSelectCategory={setSelectedCategory} />
      {!pdvOpened ? (
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4">Dados do Cliente</h1>
          <input
            type="text"
            placeholder="Nome"
            value={customerDetails.name}
            onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
            className="p-2 rounded bg-gray-800 text-white mb-4"
          />
          <input
            type="text"
            placeholder="CPF"
            value={customerDetails.cpf}
            onChange={(e) => setCustomerDetails({ ...customerDetails, cpf: e.target.value })}
            className="p-2 rounded bg-gray-800 text-white mb-4"
          />
          <input
            type="text"
            placeholder="Endereço"
            value={customerDetails.address}
            onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
            className="p-2 rounded bg-gray-800 text-white mb-4"
          />
          <button
            onClick={handleOpenPdv}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Abrir PDV
          </button>
        </div>
      ) : (
        <div className="flex-grow flex">
          <div className="ml-64 pt-16 p-4 flex-grow flex">
            <div className="w-3/4 pr-4">
              <h1 className="text-3xl text-center font-bold">PDV - Delivery</h1>
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
      )}
      {pdvOpened && <PdvActions pdv={pdv} setPdv={setPdv} setOrders={setOrders} />}
    </div>
  );
};

export default Delivery;

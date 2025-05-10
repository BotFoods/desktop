import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const Mesas = () => {
  const { token } = useAuth();
  const [mesas, setMesas] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMesas = async () => {
      const options = {
        method: 'GET',
        headers: {
          authorization: token,
        },
        credentials: 'include',
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/mesas`, options);
        const data = await response.json();
        if (data.success) {
          setMesas(data.rows);
        } else if (data.auth === false) {
          console.error('Acesso negado');
          navigate('/login');
        } else {
          console.error('Erro ao buscar mesas:', data);
        }
      } catch (error) {
        console.error('Erro ao buscar mesas:', error);
      }
    };

    fetchMesas();
  }, [token, navigate]);

  const handleMesaClick = (mesaId) => {
    navigate(`/pdv/mesa/${mesaId}`);
  };

  const isMesaOcupada = (mesaId) => {
    const pdvData = localStorage.getItem(`pdv_mesa_${mesaId}`);
    if (!pdvData) return false;
    const pdv = JSON.parse(pdvData);
    return pdv.pdv.venda.produtos && pdv.pdv.venda.produtos.length > 0;
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex">
        <div className="ml-64 pt-16 p-8 flex-grow">
          <h1 className="text-3xl font-bold mb-6 text-center">Mesas</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className="bg-gray-800 p-4 rounded shadow flex flex-col items-center cursor-pointer hover:bg-gray-700"
                onClick={() => handleMesaClick(mesa.id)}
              >
                <h2 className="text-xl font-bold mb-2">Mesa {mesa.numero_mesa}</h2>
                <p className="text-gray-400 mb-2">Capacidade: {mesa.capacidade} pessoas</p>
                <span
                  className={`px-4 py-2 rounded-full text-sm ${
                    isMesaOcupada(mesa.id) ? 'bg-red-500' : 'bg-green-500'
                  } text-white`}
                >
                  {isMesaOcupada(mesa.id) ? 'Ocupada' : 'Disponível'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mesas;

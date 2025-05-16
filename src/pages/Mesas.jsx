import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import AddMesaModal from '../components/AddMesaModal'; // Import the modal

const Mesas = () => {
  const { token, user } = useAuth(); // Ensure 'user' is destructured
  const [mesas, setMesas] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState('');

  const fetchMesas = useCallback(async () => {
    if (!user || !user.loja_id) {
      console.error("User or user.loja_id is undefined. Cannot fetch mesas.");
      // Optionally, set an error state here to inform the user
      // setApiError("Não foi possível carregar as mesas. Informações do usuário ausentes.");
      return;
    }

    const options = {
      method: 'GET',
      headers: {
        authorization: token,
      },
      credentials: 'include',
    };

    try {
      // Add id_loja as a query parameter
      const response = await fetch(`${API_BASE_URL}/api/mesas?id_loja=${user.loja_id}`, options);
      const data = await response.json();
      if (data.success) {
        setMesas(data.mesas);
      } else if (data.auth === false) {
        console.error('Acesso negado');
        navigate('/login');
      } else {
        console.error('Erro ao buscar mesas:', data.message || data);
        setMesas([]); // Clear mesas on error or set an error state
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      setMesas([]); // Clear mesas on network error
    }
  }, [token, navigate, API_BASE_URL, user]);

  useEffect(() => {
    if (user && user.loja_id) { // Ensure user and loja_id are available before fetching
      fetchMesas();
    }
  }, [fetchMesas, user]);

  const handleMesaClick = (mesaId) => {
    navigate(`/pdv/mesa/${mesaId}`);
  };

  // const isMesaOcupada = (mesaId) => {
  //   const pdvData = localStorage.getItem(`pdv_mesa_${mesaId}`);
  //   if (!pdvData) return false;
  //   const pdv = JSON.parse(pdvData);
  //   return pdv.pdv.venda.produtos && pdv.pdv.venda.produtos.length > 0;
  // };

  const getMesaStatus = (mesaId) => {
    // Check if mesa has pending orders
    const pdvData = localStorage.getItem(`pdv_mesa_${mesaId}`);
    if (!pdvData) return { status: 'disponivel', text: 'Disponível' };
    
    const pdv = JSON.parse(pdvData);
    if (pdv.pdv.venda.produtos && pdv.pdv.venda.produtos.length > 0) {
      return { status: 'ocupada', text: 'Ocupada' };
    }
    
    return { status: 'disponivel', text: 'Disponível' };
  };

  const handleOpenAddMesaModal = () => {
    setApiError(''); // Clear previous errors
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (!user || !user.loja_id) {
      setApiError("Não foi possível identificar a loja do usuário. Por favor, tente novamente.");
      console.error("User or user.loja_id is undefined in Mesas.jsx handleModalSubmit");
      return;
    }

    let numeroMesaFinal;
    if (formData.numero_mesa && formData.numero_mesa.trim() !== '') {
      const parsedNumero = parseInt(formData.numero_mesa.trim(), 10);
      if (isNaN(parsedNumero) || parsedNumero <= 0) {
        setApiError("Número da mesa inválido. Deve ser um número positivo.");
        return;
      }
      numeroMesaFinal = parsedNumero;
    } else {
      if (mesas.length > 0) {
        const numericMesaNumbers = mesas
          .map(m => parseInt(m.numero_mesa, 10))
          .filter(n => !isNaN(n));
        if (numericMesaNumbers.length === 0) {
            numeroMesaFinal = 1;
        } else {
            numeroMesaFinal = Math.max(...numericMesaNumbers) + 1;
        }
      } else {
        numeroMesaFinal = 1;
      }
    }

    const capacidadeFinal = parseInt(formData.capacidade, 10);
    if (isNaN(capacidadeFinal) || capacidadeFinal <= 0) {
        setApiError("Capacidade inválida. Deve ser um número positivo.");
        return;
    }

    const novaMesa = {
      numero_mesa: numeroMesaFinal, // Ensure this is an integer
      capacidade: capacidadeFinal,  // Ensure this is an integer
      id_loja: user.loja_id,        // Add id_loja
      // 'status' and 'ativo' will be handled by backend defaults as per schema
    };

    const options = {
      method: 'POST',
      headers: {
        authorization: token, // Just the token
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novaMesa),
      credentials: 'include', // As requested
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/mesas/adicionar`, options);
      const data = await response.json(); 

      // Updated success condition based on the new API response format
      if (data.success === true && data.mesa && data.mesa.id) { 
        fetchMesas(); 
        setIsModalOpen(false); 
        setApiError(''); 
      } else if (data.auth === false) {
        setApiError('Acesso negado. Por favor, faça login novamente.');
        // Optionally navigate to login: navigate('/login');
      } else {
        // Use message from API if available, otherwise a generic one
        const errorMessage = data.message || `Erro ao adicionar mesa. Verifique os dados e tente novamente.`;
        setApiError(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao adicionar mesa:', error);
      setApiError('Ocorreu um erro de rede ou servidor. Tente mais tarde.');
    }
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex">
        <div className="ml-64 pt-16 p-8 flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-center">Mesas</h1>
            {mesas.length > 0 && (
              <button
                onClick={handleOpenAddMesaModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out flex items-center"
              >
                <span className="mr-1">+</span> Adicionar Mesa
              </button>
            )}
          </div>
          {mesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-gray-800 rounded-lg shadow-xl mx-auto max-w-xl">
              <h2 className="text-2xl font-semibold mb-3">Nenhuma mesa cadastrada</h2>
              <p className="text-gray-400 mb-6">
                Parece que você ainda não tem nenhuma mesa. Cadastre sua primeira mesa para começar a gerenciar seus pedidos.
              </p>
              <button
                onClick={handleOpenAddMesaModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition duration-150 ease-in-out flex items-center justify-center"
              >
                <span className="mr-1">+</span> Cadastrar Primeira Mesa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mesas.map((mesa) => {
                const mesaStatus = getMesaStatus(mesa.id);
                return (
                  <div
                    key={mesa.id}
                    className={`bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 ${
                      mesaStatus.status === 'ocupada' 
                        ? 'border-yellow-500 hover:bg-gray-700' 
                        : mesa.status === 'indisponivel' 
                          ? 'border-red-500 hover:bg-gray-700' 
                          : 'border-green-500 hover:bg-gray-700'
                    }`}
                    onClick={() => handleMesaClick(mesa.id)}
                  >
                    <div className="text-3xl font-bold mb-3">Mesa {mesa.numero_mesa}</div>
                    <p className="text-gray-400 mb-4">Capacidade: {mesa.capacidade} pessoas</p>
                    <div 
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        mesaStatus.status === 'ocupada'
                          ? 'bg-yellow-500 text-yellow-900'
                          : mesa.status === 'indisponivel' 
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500 text-white'
                      }`}
                    >
                      {mesaStatus.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <AddMesaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        existingMesaNumbers={mesas.map(m => m.numero_mesa)}
        errorMessage={apiError}
      />
    </div>
  );
};

export default Mesas;

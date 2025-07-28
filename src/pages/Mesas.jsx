import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import AddMesaModal from '../components/AddMesaModal';
// Importando ícones adicionais para as ações de desativar/ativar
import { FaBan, FaCheck, FaEllipsisV } from 'react-icons/fa';
import AlertModal from '../components/AlertModal';
import ApiErrorModal from '../components/ApiErrorModal';
import AccessDeniedPage from '../components/AccessDeniedPage';
import useApiError from '../hooks/useApiError';
import { apiGet, apiPost, apiPatch } from '../services/ApiService';

const Mesas = () => {
  const { token, user } = useAuth();
  const { errorInfo, accessDenied, handleApiError, closeError } = useApiError();
  const [mesas, setMesas] = useState([]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  // Estado para gerenciar o menu de contexto
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, mesaId: null });
  // Estado para o modal de alerta
  const [alertInfo, setAlertInfo] = useState({
    isOpen: false,
    title: 'Atenção',
    message: '',
    type: 'info'
  });

  const fetchMesas = useCallback(async () => {
    if (!user || !user.loja_id) {
      console.error("User or user.loja_id is undefined. Cannot fetch mesas.");
      setApiError("Não foi possível carregar as mesas. Informações do usuário ausentes.");
      return;
    }

    try {
      const data = await apiGet(`/api/mesas?id_loja=${user.loja_id}`, token);
      
      if (data.success) {
        setMesas(data.mesas);
        setApiError('');
      } else if (data._isApiError && data._status === 403) {
        // Usar o novo sistema para erros de permissão com bloqueio de página
        await handleApiError(data._response || data, 'Erro ao carregar mesas', {
          blockPage: true,
          pageName: 'mesas'
        });
      } else if (data.auth === false) {
        console.error('Acesso negado');
        navigate('/login');
      } else {
        console.error('Erro ao buscar mesas:', data.message || data);
        setApiError(data.message || 'Erro ao carregar mesas');
        setMesas([]);
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      setApiError('Erro de conexão ao carregar mesas');
      setMesas([]);
    }
  }, [token, navigate, user, handleApiError]);

  useEffect(() => {
    if (user && user.loja_id) { // Ensure user and loja_id are available before fetching
      fetchMesas();
    }
  }, [fetchMesas, user]);

  // Função para mostrar alerta
  const showAlert = (message, type = 'info', title = 'Atenção') => {
    setAlertInfo({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Fecha o alerta
  const closeAlert = () => {
    setAlertInfo(prev => ({ ...prev, isOpen: false }));
  };

  const handleMesaClick = (mesaId) => {
    navigate(`/pdv/mesa/${mesaId}`);
  };

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

  // Função para abrir o menu de contexto
  const handleContextMenu = (e, mesaId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ 
      visible: true, 
      x: e.clientX, 
      y: e.clientY, 
      mesaId
    });
  };

  // Função para mostrar o menu de ações ao clicar nos três pontos
  const handleActionMenu = (e, mesaId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ 
      visible: true, 
      x: rect.left, 
      y: rect.bottom, 
      mesaId
    });
  };

  // Fechar menu de contexto
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Desativar mesa
  const handleDesativarMesa = async (mesaId) => {
    if (!user || !user.loja_id) {
      showAlert("Erro: Informações do usuário ou loja ausentes.", "error");
      return;
    }

    closeContextMenu();

    try {
      const data = await apiPatch(`/api/mesas/desativar/${mesaId}`, 
        { id_loja: user.loja_id }, 
        token
      );

      if (data.success) {
        // Atualiza o estado da mesa localmente
        setMesas(mesas.map(mesa => 
          mesa.id === mesaId ? { ...mesa, ativo: false } : mesa
        ));
        showAlert(data.message || "Mesa desativada com sucesso!", "success");
      } else if (data._isApiError && data._status === 403) {
        // Usar o novo sistema para erros de permissão
        await handleApiError(data._response || data, 'Erro ao desativar mesa');
      } else {
        showAlert(data.error || data.message || "Erro ao desativar mesa", "error");
      }
    } catch (error) {
      console.error("Erro ao desativar mesa:", error);
      showAlert("Ocorreu um erro ao comunicar com o servidor", "error");
    }
  };

  // Ativar mesa
  const handleAtivarMesa = async (mesaId) => {
    if (!user || !user.loja_id) {
      showAlert("Erro: Informações do usuário ou loja ausentes.", "error");
      return;
    }

    closeContextMenu();

    try {
      const response = await fetch(`${API_BASE_URL}/api/mesas/ativar/${mesaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ id_loja: user.loja_id }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Atualiza o estado da mesa localmente
        setMesas(mesas.map(mesa => 
          mesa.id === mesaId ? { ...mesa, ativo: true } : mesa
        ));
        showAlert(data.message || "Mesa ativada com sucesso!", "success");
      } else {
        showAlert(data.error || "Erro ao ativar mesa", "error");
      }
    } catch (error) {
      console.error("Erro ao ativar mesa:", error);
      showAlert("Ocorreu um erro ao comunicar com o servidor", "error");
    }
  };

  // Função para verificar se uma mesa está ativa de forma robusta
  const isMesaAtiva = (mesa) => {
    if (mesa.ativo === undefined || mesa.ativo === null) return true; // Se não tem o campo, assume ativa
    
    // Conversão para diferentes tipos de dados possíveis
    if (typeof mesa.ativo === 'string') {
      return mesa.ativo.toLowerCase() === 'true' || mesa.ativo === '1';
    }
    
    if (typeof mesa.ativo === 'number') {
      return mesa.ativo === 1;
    }
    
    return Boolean(mesa.ativo); // Para casos booleanos ou outros tipos
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

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex">
        <div className="ml-64 pt-16 my-3 p-8 flex-grow">
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
                
                // Usa a nova função para verificar o estado "ativo" de forma mais robusta
                const isAtiva = isMesaAtiva(mesa);
                const finalStatus = !isAtiva ? 'indisponivel' : mesaStatus.status;
                const finalText = !isAtiva ? 'Indisponível' : mesaStatus.text;
                
                return (
                  <div
                    key={mesa.id}
                    onClick={() => isAtiva && handleMesaClick(mesa.numero_mesa)}
                    onContextMenu={(e) => handleContextMenu(e, mesa.id)}
                    className={`bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center relative 
                      ${isAtiva ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed opacity-80'} 
                      transition-all duration-300 transform border-2 
                      ${finalStatus === 'ocupada' 
                        ? 'border-yellow-500 hover:bg-gray-700' 
                        : !isAtiva 
                          ? 'border-red-500' 
                          : 'border-green-500 hover:bg-gray-700'
                    }`}
                  >
                    {/* Botão de ações (três pontos) */}
                    <button 
                      onClick={(e) => handleActionMenu(e, mesa.id)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <FaEllipsisV />
                    </button>

                    <div className="text-3xl font-bold mb-3">Mesa {mesa.numero_mesa}</div>
                    <p className="text-gray-400 mb-4">Capacidade: {mesa.capacidade} pessoas</p>
                    <div 
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        finalStatus === 'ocupada'
                          ? 'bg-yellow-500 text-yellow-900'
                          : !isAtiva 
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500 text-white'
                      }`}
                    >
                      {finalText}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Menu de contexto */}
      {contextMenu.visible && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div 
            className="fixed z-50 bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              transform: 'translate(-50%, 10px)'
            }}
          >
            {!isMesaAtiva(mesas.find(m => m.id === contextMenu.mesaId) || {}) ? (
              <button
                onClick={() => handleAtivarMesa(contextMenu.mesaId)}
                className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 text-white"
              >
                <FaCheck className="mr-2 text-green-500" />
                <span>Ativar Mesa</span>
              </button>
            ) : (
              <button
                onClick={() => handleDesativarMesa(contextMenu.mesaId)}
                className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 text-white"
              >
                <FaBan className="mr-2 text-red-500" />
                <span>Desativar Mesa</span>
              </button>
            )}
          </div>
        </>
      )}

      <AddMesaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        existingMesaNumbers={mesas.map(m => m.numero_mesa)}
        errorMessage={apiError}
      />

      {/* Modal de alerta */}
      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={closeAlert}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
      />

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

export default Mesas;

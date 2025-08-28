import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import AddMesaModal from '../components/AddMesaModal';
// Importando ícones adicionais para as ações de desativar/ativar
import { FaBan, FaCheck, FaEllipsisV, FaUser, FaChair, FaArrowRight } from 'react-icons/fa';
import AlertModal from '../components/AlertModal';
import ApiErrorModal from '../components/ApiErrorModal';
import AccessDeniedPage from '../components/AccessDeniedPage';
import useApiError from '../hooks/useApiError';
import { apiGet, apiPost, apiPut } from '../services/ApiService';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/mesas.css';

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
  // Estado para controlar o carregamento
  const [isLoading, setIsLoading] = useState(true);

  const fetchMesas = useCallback(async () => {
    if (!user || !user.loja_id) {
      console.error("User or user.loja_id is undefined. Cannot fetch mesas.");
      setApiError("Não foi possível carregar as mesas. Informações do usuário ausentes.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    
    // Mesa só fica ocupada se tiver produtos em preparo (impressos)
    if (pdv.pdv.venda.produtos && pdv.pdv.venda.produtos.length > 0) {
      // Verificar se há produtos impressos (em preparo)
      const produtosEmPreparo = pdv.pdv.venda.produtos.some(produto => produto.status?.impresso);
      
      if (produtosEmPreparo) {
        return { status: 'ocupada', text: 'Ocupada' };
      }
      
      // Se há produtos mas nenhum está em preparo, mesa está com pedido mas não ocupada
      return { status: 'disponivel', text: 'Disponível' };
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
      numero_mesa: numeroMesaFinal,
      capacidade: capacidadeFinal,
      id_loja: user.loja_id,
    };

    try {
      const data = await apiPost('/api/mesas/adicionar', novaMesa, token);

      if (data.success === true && data.mesa && data.mesa.id) { 
        fetchMesas(); 
        setIsModalOpen(false); 
        setApiError(''); 
      } else if (data._isApiError && data._status === 403) {
        // Usar o novo sistema para erros de permissão
        await handleApiError(data._response || data, 'Erro ao adicionar mesa');
      } else if (data.auth === false) {
        setApiError('Acesso negado. Por favor, faça login novamente.');
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
      const data = await apiPut(`/api/mesas/desativar/${mesaId}`, 
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
      const data = await apiPut(`/api/mesas/ativar/${mesaId}`, 
        { id_loja: user.loja_id }, 
        token
      );

      if (data.success) {
        // Atualiza o estado da mesa localmente
        setMesas(mesas.map(mesa => 
          mesa.id === mesaId ? { ...mesa, ativo: true } : mesa
        ));
        showAlert(data.message || "Mesa ativada com sucesso!", "success");
      } else if (data._isApiError && data._status === 403) {
        // Usar o novo sistema para erros de permissão
        await handleApiError(data._response || data, 'Erro ao ativar mesa');
      } else {
        showAlert(data.error || data.message || "Erro ao ativar mesa", "error");
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mesas</h1>
              <p className="text-gray-400">Gerencie as mesas do seu estabelecimento</p>
            </div>
            {!isLoading && mesas.length > 0 && (
              <button
                onClick={handleOpenAddMesaModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 ease-in-out flex items-center group shadow-lg"
              >
                <span className="mr-2 text-lg">+</span> 
                Adicionar Mesa
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={12} />
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="mesa-loading">
              <LoadingSpinner
                size="lg"
                message="Carregando mesas..."
                className="mt-16"
              />
            </div>
          ) : mesas.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChair className="text-3xl text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Nenhuma mesa cadastrada</h2>
                <p className="text-gray-400 leading-relaxed">
                  Parece que você ainda não tem nenhuma mesa cadastrada. 
                  <br />
                  Cadastre sua primeira mesa para começar a gerenciar seus pedidos.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleOpenAddMesaModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 ease-in-out flex items-center justify-center mx-auto group"
                >
                  <span className="mr-2">+</span> 
                  Cadastrar Primeira Mesa
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={12} />
                </button>
                
                <p className="text-xs text-gray-500">
                  Você pode adicionar quantas mesas precisar para seu estabelecimento
                </p>
              </div>
            </div>
          ) : (
            <div className="mesas-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mesas.map((mesa) => {
                const mesaStatus = getMesaStatus(mesa.numero_mesa);
                
                // Usa a nova função para verificar o estado "ativo" de forma mais robusta
                const isAtiva = isMesaAtiva(mesa);
                const finalStatus = !isAtiva ? 'indisponivel' : mesaStatus.status === 'livre' ? 'disponivel' : mesaStatus.status;
                const finalText = !isAtiva ? 'Indisponível' : mesaStatus.text;
                
                return (
                  <div
                    key={mesa.id}
                    onClick={() => isAtiva && handleMesaClick(mesa.numero_mesa)}
                    onContextMenu={(e) => handleContextMenu(e, mesa.id)}
                    className={`mesa-card relative bg-gray-800 rounded-lg border border-gray-600 overflow-hidden group
                      ${isAtiva ? 'cursor-pointer hover:shadow-lg hover:border-gray-500' : 'cursor-not-allowed opacity-70'} 
                      ${finalStatus === 'ocupada' ? 'ocupada' : finalStatus === 'disponivel' ? 'disponivel' : 'indisponivel'}
                    `}
                  >
                    {/* Header Card */}
                    <div 
                      className={`mesa-header p-3 text-center relative ${
                        finalStatus === 'ocupada'
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-100'
                          : !isAtiva 
                            ? 'bg-gradient-to-r from-red-600 to-red-500 text-red-100'
                            : 'bg-gradient-to-r from-green-600 to-green-500 text-green-100'
                      }`}
                      style={{
                        '--bg-color': finalStatus === 'ocupada' ? '#ca8a04' : !isAtiva ? '#dc2626' : '#16a34a',
                        '--bg-dark': finalStatus === 'ocupada' ? '#a16207' : !isAtiva ? '#b91c1c' : '#15803d'
                      }}
                    >
                      <h3 className="text-lg font-bold">Mesa {mesa.numero_mesa}</h3>
                      <p className="text-xs opacity-90">{finalText}</p>
                      
                      {/* Botão de ações (três pontos) */}
                      <button 
                        onClick={(e) => handleActionMenu(e, mesa.id)}
                        className="absolute top-2 right-2 p-1.5 text-white hover:bg-black hover:bg-opacity-20 rounded-full transition-colors opacity-70 hover:opacity-100"
                      >
                        <FaEllipsisV size={12} />
                      </button>
                    </div>

                    {/* Body Card */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {/* Capacidade */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-400 text-sm">
                            <FaUser className="mr-2" size={12} />
                            <span>Capacidade</span>
                          </div>
                          <span className="text-white font-medium">{mesa.capacidade} pessoas</span>
                        </div>

                        {/* Status visual com ícone */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-400 text-sm">
                            <FaChair className="mr-2" size={12} />
                            <span>Status</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`status-indicator w-2 h-2 rounded-full mr-2 ${
                              finalStatus === 'ocupada'
                                ? 'bg-yellow-500'
                                : !isAtiva 
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                            }`}></div>
                            <span className="text-xs font-medium text-gray-300">{finalText}</span>
                          </div>
                        </div>

                        {/* Ação rápida */}
                        {isAtiva && (
                          <div className="pt-2 border-t border-gray-700">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMesaClick(mesa.numero_mesa);
                              }}
                              className="w-full py-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center"
                            >
                              {finalStatus === 'ocupada' ? 'Gerenciar Pedidos' : 'Abrir Mesa'}
                              <FaArrowRight className="ml-1" size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Efeito de hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none ${
                      !isAtiva ? 'hidden' : ''
                    }`}></div>
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
            className="context-menu fixed z-50 bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-600 min-w-[180px]"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              transform: 'translate(-50%, 10px)'
            }}
          >
            <div className="py-2">
              {!isMesaAtiva(mesas.find(m => m.id === contextMenu.mesaId) || {}) ? (
                <button
                  onClick={() => handleAtivarMesa(contextMenu.mesaId)}
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-700 text-white transition-colors group"
                >
                  <div className="w-8 h-8 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <FaCheck className="text-green-400" size={12} />
                  </div>
                  <div>
                    <span className="font-medium">Ativar Mesa</span>
                    <p className="text-xs text-gray-400 mt-0.5">Tornar mesa disponível</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleDesativarMesa(contextMenu.mesaId)}
                  className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-700 text-white transition-colors group"
                >
                  <div className="w-8 h-8 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <FaBan className="text-red-400" size={12} />
                  </div>
                  <div>
                    <span className="font-medium">Desativar Mesa</span>
                    <p className="text-xs text-gray-400 mt-0.5">Tornar mesa indisponível</p>
                  </div>
                </button>
              )}
            </div>
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

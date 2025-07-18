import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaCheck, FaLock, FaUser, FaCog } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const PermissoesCadastro = () => {
  const { token, user, validateSession } = useAuth();
  const [funcoes, setFuncoes] = useState([]);
  const [atividades, setAtividades] = useState({});
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const [permissoesFuncao, setPermissoesFuncao] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [editingPermissions, setEditingPermissions] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    if (token && user?.loja_id) {
      fetchFuncoes();
      fetchAtividades();
    } else {
      if (!token) {
        showMessage('Token não disponível. Faça login novamente.', 'error');
      } else if (!user?.loja_id) {
        showMessage('Dados do usuário não disponíveis. Faça login novamente.', 'error');
      }
    }
  }, [token, user?.loja_id]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  const fetchFuncoes = async () => {
    try {
      setLoading(true);
      
      if (!user?.loja_id) {
        showMessage('Dados do usuário não encontrados. Faça login novamente.', 'error');
        return;
      }
      
      if (!token) {
        showMessage('Token não disponível. Faça login novamente.', 'error');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/funcoes?id_loja=${user.loja_id}`, {
        headers: { 
          'authorization': token,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.funcoes)) {
          setFuncoes(data.funcoes);
          if (data.funcoes.length === 0) {
            showMessage('Nenhuma função cadastrada para esta loja.', 'error');
          }
        } else {
          showMessage('Formato de resposta inválido da API', 'error');
        }
      } else {
        const errorText = await response.text();
        
        try {
          const errorData = JSON.parse(errorText);
          showMessage(errorData.message || 'Erro ao carregar funções', 'error');
        } catch (parseError) {
          showMessage(`Erro HTTP ${response.status}: ${errorText || 'Erro desconhecido'}`, 'error');
        }
      }
    } catch (error) {
      showMessage(`Erro de conexão: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAtividades = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permissoes/atividades`, {
        headers: { authorization: token },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAtividades(data.atividades || {});
      } else {
        showMessage('Erro ao carregar atividades do sistema', 'error');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      showMessage('Erro ao carregar atividades', 'error');
    }
  };

  const fetchPermissoesFuncao = async (funcaoId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/permissoes/funcoes/${funcaoId}?id_loja=${user.loja_id}`, {
        headers: { authorization: token },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissoesFuncao(data.permissoes || {});
        setSelectedFuncao(data.funcao);
      } else {
        showMessage('Erro ao carregar permissões da função', 'error');
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      showMessage('Erro ao carregar permissões', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (modulo, atividadeId, permitido) => {
    setPermissoesFuncao(prev => ({
      ...prev,
      [modulo]: prev[modulo]?.map(atividade => 
        atividade.id === atividadeId 
          ? { ...atividade, permitido } 
          : atividade
      ) || []
    }));
  };

  const salvarPermissoes = async () => {
    if (!selectedFuncao) return;

    try {
      setLoading(true);
      
      // Converter permissões para o formato esperado pela API
      const permissoes = [];
      Object.values(permissoesFuncao).flat().forEach(atividade => {
        if (!atividade.is_owner_only) {
          permissoes.push({
            atividade_id: atividade.id,
            permitido: atividade.permitido
          });
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/permissoes/funcoes/${selectedFuncao.id}?id_loja=${user.loja_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: token
        },
        credentials: 'include',
        body: JSON.stringify({ permissoes })
      });

      if (response.ok) {
        showMessage('Permissões atualizadas com sucesso!');
        setEditingPermissions(false);
      } else {
        const data = await response.json();
        showMessage(data.message || 'Erro ao salvar permissões', 'error');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      showMessage('Erro ao salvar permissões', 'error');
    } finally {
      setLoading(false);
    }
  };

  const configurarPermissoesPadrao = async (tipo) => {
    if (!selectedFuncao) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/permissoes/funcoes/${selectedFuncao.id}/padrao?id_loja=${user.loja_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: token
        },
        credentials: 'include',
        body: JSON.stringify({ tipo })
      });

      if (response.ok) {
        showMessage(`Permissões ${tipo === 'basico' ? 'básicas' : 'completas'} configuradas!`);
        await fetchPermissoesFuncao(selectedFuncao.id);
      } else {
        const data = await response.json();
        showMessage(data.message || 'Erro ao configurar permissões padrão', 'error');
      }
    } catch (error) {
      console.error('Error setting default permissions:', error);
      showMessage('Erro ao configurar permissões padrão', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (modulo) => {
    const icons = {
      produtos: '🛍️',
      categorias: '📂',
      usuarios: '👥',
      funcoes: '🔑',
      caixas: '💰',
      movimentacoes: '💸',
      vendas: '🛒',
      clientes: '👤',
      mesas: '🪑',
      cupons: '🎫',
      impressao: '🖨️',
      whatsapp: '📱',
      relatorios: '📊',
      loja: '🏪',
      pagamentos: '💳'
    };
    return icons[modulo] || '⚙️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FaCog className="text-blue-400" />
            Gerenciamento de Permissões
          </h1>
          <p className="text-gray-300">
            Configure as permissões de acesso para cada função do sistema. 
            <span className="text-yellow-400 ml-2">
              <FaLock className="inline mr-1" />
              Atividades marcadas são exclusivas do proprietário.
            </span>
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'error' 
              ? 'bg-red-900/20 border-red-500 text-red-300' 
              : 'bg-green-900/20 border-green-500 text-green-300'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Funções */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-blue-400" />
              Funções Disponíveis
            </h2>
            
            <div className="space-y-2">
              {funcoes.length === 0 && !loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-3">Nenhuma função encontrada</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        fetchFuncoes();
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Recarregar Funções
                    </button>
                  </div>
                </div>
              ) : (
                funcoes.filter(f => f.ativo).map(funcao => (
                  <button
                    key={funcao.id}
                    onClick={() => fetchPermissoesFuncao(funcao.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedFuncao?.id === funcao.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    disabled={loading}
                  >
                    {funcao.descricao}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Configuração de Permissões */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
            {selectedFuncao ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Permissões: {selectedFuncao.descricao}
                  </h2>
                  <div className="flex gap-2">
                    {!editingPermissions ? (
                      <>
                        <button
                          onClick={() => configurarPermissoesPadrao('basico')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          disabled={loading}
                        >
                          Básico
                        </button>
                        <button
                          onClick={() => setEditingPermissions(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                          disabled={loading}
                        >
                          <FaEdit />
                          Editar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingPermissions(false);
                            fetchPermissoesFuncao(selectedFuncao.id);
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                          disabled={loading}
                        >
                          <FaTimes />
                          Cancelar
                        </button>
                        <button
                          onClick={salvarPermissoes}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                          disabled={loading}
                        >
                          <FaSave />
                          Salvar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de Permissões por Módulo */}
                <div className="space-y-6">
                  {Object.entries(permissoesFuncao).map(([modulo, atividades]) => (
                    <div key={modulo} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <span className="text-2xl">{getModuleIcon(modulo)}</span>
                        {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {atividades.map(atividade => (
                          <div
                            key={atividade.id}
                            className={`p-3 rounded-lg border ${
                              atividade.is_owner_only
                                ? 'bg-yellow-900/20 border-yellow-500'
                                : 'bg-gray-600 border-gray-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {atividade.descricao}
                                  </span>
                                  {atividade.is_owner_only && (
                                    <FaLock className="text-yellow-400 text-xs" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {atividade.nome}
                                </span>
                              </div>
                              
                              {atividade.is_owner_only ? (
                                <span className="text-yellow-400 text-sm font-medium">
                                  Owner Only
                                </span>
                              ) : (
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={atividade.permitido}
                                    onChange={(e) => handlePermissionChange(
                                      modulo, 
                                      atividade.id, 
                                      e.target.checked
                                    )}
                                    disabled={!editingPermissions}
                                    className="sr-only"
                                  />
                                  <div className={`w-12 h-6 rounded-full transition-colors ${
                                    atividade.permitido ? 'bg-green-500' : 'bg-gray-400'
                                  } ${!editingPermissions ? 'opacity-50' : ''}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                      atividade.permitido ? 'translate-x-6' : 'translate-x-0.5'
                                    } mt-0.5`} />
                                  </div>
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <FaCog className="text-6xl mx-auto mb-4 opacity-50" />
                <p>Selecione uma função para configurar suas permissões</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissoesCadastro;

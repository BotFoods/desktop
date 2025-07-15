import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import { FaSearch, FaSpinner, FaArrowUp, FaArrowDown, FaExclamationTriangle, FaPlus, FaMinus, FaWallet, FaFileInvoiceDollar } from 'react-icons/fa';
import InformarcoesRodape from '../components/InformacoesRodape';

const MovimentacoesCaixa = () => {
  const { token, user } = useAuth(); // Removido validateSession redundante
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState('todas');
  const [pdv] = useState(() => {
    const pdv_salvo = localStorage.getItem('pdv');
    return pdv_salvo ? JSON.parse(pdv_salvo) : null;
  });
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Calculate totals
  const totals = filteredMovimentacoes.reduce(
    (acc, mov) => {
      // Handle BigNumber or string values correctly by ensuring proper parsing
      const valor = mov.valor ? 
        typeof mov.valor === 'number' ? mov.valor :
        typeof mov.valor === 'string' ? 
          parseFloat(mov.valor.replace ? mov.valor.replace(',', '.') : mov.valor) || 0 : 0 : 0;
      
      // Check if tipo starts with ENTRADA_ or SAIDA_ prefixes
      if (mov.tipo && typeof mov.tipo === 'string') {
        if (mov.tipo.startsWith('ENTRADA_') || mov.tipo === 'ENTRADA') {
          acc.entradas += valor;
        } else if (mov.tipo.startsWith('SAIDA_') || mov.tipo === 'SAIDA') {
          acc.saidas += valor;
        }
      }
      
      return acc;
    },
    { entradas: 0, saidas: 0 }
  );
  useEffect(() => {
    const fetchMovimentacoes = async () => {
      if (!token || !user?.loja_id) return; // Skip if no token or user loja_id is available
      
      setLoading(true);
      setError(null);
      
      if (pdv && pdv.pdv && pdv.pdv.caixa && pdv.pdv.caixa.id_caixa) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/movimentacoes/${pdv.pdv.caixa.id_caixa}?id_loja=${user.loja_id}`, {
            headers: {
              Authorization: `${token}`,
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`Erro na resposta: ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success && data.movimentacoes) {
            setMovimentacoes(data.movimentacoes);
            setFilteredMovimentacoes(data.movimentacoes);
          } else {
            throw new Error(data.message || 'Erro ao buscar movimentações');
          }
        } catch (error) {
          console.error('Erro ao buscar movimentações:', error);
          setError(error.message || 'Erro ao buscar movimentações');
          setMovimentacoes([]);
          setFilteredMovimentacoes([]);
        }
      } else {
        setError('Nenhum caixa aberto encontrado');
      }
      
      setLoading(false);
    };    // Only fetch data if we have a token and user (after validation)
    if (token && user?.loja_id) {
      fetchMovimentacoes();
    }
  }, [token, user, pdv, API_BASE_URL]);

  // Filter movimentacoes when search term or filter type or active tab changes
  useEffect(() => {
    let results = [...movimentacoes];
    
    // Apply filter type first if exists
    if (filterType) {
      results = results.filter(mov => mov.tipo === filterType);
    }
    
    // Apply tab filter
    if (activeTab === 'entradas') {
      results = results.filter(mov => 
        mov.tipo && typeof mov.tipo === 'string' && 
        (mov.tipo.startsWith('ENTRADA_') || mov.tipo === 'ENTRADA'));
    } else if (activeTab === 'saidas') {
      results = results.filter(mov => 
        mov.tipo && typeof mov.tipo === 'string' && 
        (mov.tipo.startsWith('SAIDA_') || mov.tipo === 'SAIDA'));
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(mov => 
        mov.descricao.toLowerCase().includes(term) ||
        (mov.metodo_pagamento_nome && mov.metodo_pagamento_nome.toLowerCase().includes(term)) ||
        String(mov.id).includes(term)
      );
    }
    
    setFilteredMovimentacoes(results);
  }, [searchTerm, filterType, activeTab, movimentacoes]);

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Try to parse the date - if it's ISO format this will work
      const date = new Date(dateString);
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return dateString; // Return the original string if date is invalid
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString; // Return the original string on error
    }
  };

  // Format currency - improved version
  const formatCurrency = (value) => {
    // Ensure value is a number before formatting
    let numericValue = 0;
    
    try {
      if (typeof value === 'number') {
        numericValue = value;
      } else if (typeof value === 'string') {
        numericValue = parseFloat(value.replace ? value.replace(',', '.') : value);
      }
      
      // Handle NaN
      if (isNaN(numericValue)) {
        numericValue = 0;
      }
    } catch (error) {
      console.error('Error parsing currency value:', error, value);
      numericValue = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  // Helper function to determine if a type is an entry or not
  const isEntryType = (tipo) => {
    return tipo && typeof tipo === 'string' && (tipo.startsWith('ENTRADA_') || tipo === 'ENTRADA');
  };

  return (
    <div className="bg-gray-900 text-white flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex my-3">
        {/* Sidebar de Movimentações */}
        <div className="fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-gray-300 overflow-y-auto">
          <nav className="p-4">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Movimentações
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('todas')}
                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'todas' 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FaWallet />
                <span>Todas</span>
              </button>
              <button 
                onClick={() => setActiveTab('entradas')}
                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'entradas' 
                    ? 'bg-green-600 text-white' 
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FaPlus />
                <span>Entradas</span>
              </button>
              <button 
                onClick={() => setActiveTab('saidas')}
                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === 'saidas' 
                    ? 'bg-red-600 text-white' 
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FaMinus />
                <span>Saídas</span>
              </button>
              <button 
                onClick={() => {}}
                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
              >
                <FaFileInvoiceDollar />
                <span>Relatórios</span>
              </button>
            </div>
          </nav>

          {/* Informações de Suporte no Rodapé */}
          <InformarcoesRodape />
        </div>

        <div className="ml-64 pt-16 p-6 flex-grow flex flex-col">
          <h1 className="text-3xl font-bold mb-6">
            {activeTab === 'todas' && "Todas as Movimentações"}
            {activeTab === 'entradas' && "Entradas de Caixa"}
            {activeTab === 'saidas' && "Saídas de Caixa"}
          </h1>
          
          {/* Filter and Search Bar */}
          <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border-transparent focus:border-blue-500 focus:bg-gray-600 focus:ring-0 text-white"
                  placeholder="Buscar movimentações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  className="bg-gray-700 text-white border-0 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SAIDA">Saídas</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-gray-300">Total de Entradas</h3>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totals.entradas)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-gray-300">Total de Saídas</h3>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totals.saidas)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-gray-300">Balanço</h3>
              <p className={`text-2xl font-bold ${totals.entradas - totals.saidas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totals.entradas - totals.saidas)}
              </p>
            </div>
          </div>

          {/* Table of transactions */}
          <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <FaSpinner className="animate-spin text-blue-500 mr-2" size={24} />
                <span>Carregando movimentações...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-red-400">
                <FaExclamationTriangle size={32} className="mb-3" />
                <p>{error}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Método Pag.</th>
                      <th className="p-3">Ref. ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovimentacoes.length > 0 ? (
                      filteredMovimentacoes.map((movimentacao) => (
                        <tr key={movimentacao.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="p-3">{movimentacao.id}</td>
                          <td className="p-3">{movimentacao.descricao}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${isEntryType(movimentacao.tipo) ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                              {isEntryType(movimentacao.tipo) ? <FaArrowDown className="mr-1" /> : <FaArrowUp className="mr-1" />}
                              {movimentacao.tipo}
                            </span>
                          </td>
                          <td className={`p-3 font-medium ${isEntryType(movimentacao.tipo) ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(movimentacao.valor)}
                          </td>
                          <td className="p-3">{formatDate(movimentacao.data_movimentacao)}</td>
                          <td className="p-3">{movimentacao.metodo_pagamento_nome || 'N/A'}</td>
                          <td className="p-3">
                            {movimentacao.referencia_id ? 
                              <span className="text-blue-400 hover:underline cursor-pointer">
                                {movimentacao.referencia_id}
                              </span> : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-gray-400">
                          Nenhuma movimentação encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {filteredMovimentacoes.length > 0 && (
                  <div className="mt-4 text-right text-sm text-gray-400">
                    Mostrando {filteredMovimentacoes.length} de {movimentacoes.length} movimentações
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimentacoesCaixa;

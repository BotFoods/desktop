import React, { useState, useEffect } from 'react';

const PermissionsDebug = () => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/permissoes/debug`, {
        headers: {
          authorization: token
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDebugData(data.debug);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao buscar dados de debug');
      }
    } catch (err) {
      console.error('Erro ao buscar debug:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDebugData();
    }
  }, [token]);

  if (loading) return <div className="p-4">Carregando debug...</div>;
  if (error) return <div className="p-4 text-red-600">Erro: {error}</div>;
  if (!debugData) return <div className="p-4">Sem dados de debug</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Debug de Permissões</h1>
      
      <div className="space-y-6">
        {/* Dados do Usuário */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Dados do Usuário</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugData.usuario, null, 2)}
          </pre>
        </div>

        {/* Status da View */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Status da View</h2>
          <p className="mb-2">
            <strong>View existe:</strong> 
            <span className={debugData.view_exists ? 'text-green-600' : 'text-red-600'}>
              {debugData.view_exists ? ' ✓ Sim' : ' ✗ Não'}
            </span>
          </p>
          {debugData.view_exists && debugData.view_sample.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Amostra da View:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugData.view_sample, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Atividades de Usuários */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Atividades do Módulo Usuários</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(debugData.atividades_usuarios, null, 2)}
          </pre>
        </div>

        <button
          onClick={fetchDebugData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar Debug
        </button>
      </div>
    </div>
  );
};

export default PermissionsDebug;

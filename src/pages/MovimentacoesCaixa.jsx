import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';

const MovimentacoesCaixa = () => {
  const { token } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [pdv] = useState(() => {
    const pdv_salvo = localStorage.getItem('pdv');
    return pdv_salvo ? JSON.parse(pdv_salvo) : null;
  });
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMovimentacoes = async () => {
      if (pdv && pdv.pdv && pdv.pdv.caixa && pdv.pdv.caixa.id_caixa) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/movimentacoes/${pdv.pdv.caixa.id_caixa}`, {
            headers: {
              Authorization: `${token}`,
            },
            credentials: 'include',
          });
          const data = await response.json();
          if (data.success && data.movimentacoes) {
            setMovimentacoes(data.movimentacoes);
          } else {
            console.error('Erro ao buscar movimentações:', data.message || 'Resposta não sucedida');
            setMovimentacoes([]); // Clear movimentacoes if fetch failed or data is not as expected
          }
        } catch (error) {
          console.error('Erro ao buscar movimentações:', error);
          setMovimentacoes([]); // Clear movimentacoes on error
        }
      }
    };

    fetchMovimentacoes();
  }, [token, pdv, API_BASE_URL]);

  return (
    <div className="bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex-grow flex">
        <div className="ml-64 pt-16 p-4 flex-grow flex">
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-4">Movimentações do Caixa</h1>
            <div className="w-full max-w-4xl bg-gray-800 p-4 rounded shadow">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="border-b border-gray-700 p-2">ID</th>
                    <th className="border-b border-gray-700 p-2">Descrição</th>
                    <th className="border-b border-gray-700 p-2">Tipo</th>
                    <th className="border-b border-gray-700 p-2">Valor</th>
                    <th className="border-b border-gray-700 p-2">Data</th>
                    <th className="border-b border-gray-700 p-2">Método Pag.</th>
                    <th className="border-b border-gray-700 p-2">Ref. ID</th>
                    <th className="border-b border-gray-700 p-2">Ref. Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.length > 0 ? (
                    movimentacoes.map((movimentacao) => (
                      <tr key={movimentacao.id}>
                        <td className="border-b border-gray-700 p-2">{movimentacao.id}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.descricao}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.tipo}</td>
                        <td className="border-b border-gray-700 p-2">R$ {movimentacao.valor}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.data_movimentacao}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.metodo_pagamento_nome || 'N/A'}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.referencia_id || 'N/A'}</td>
                        <td className="border-b border-gray-700 p-2">{movimentacao.referencia_tipo || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="border-b border-gray-700 p-2 text-center">
                        Nenhuma movimentação encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovimentacoesCaixa;

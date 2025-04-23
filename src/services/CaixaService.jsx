// services/CaixaService.js

export const verificarCaixaAberto = async (userId, token) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
    try {
      const response = await fetch(`${API_BASE_URL}/caixas/usuario/${userId}`, {
        headers: {
          Authorization: `${token}`,
        },
        credentials: 'include',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao verificar caixa aberto:', error);
      return { success: false, caixas: [] };
    }
  };
  
  export const abrirCaixa = async (userId, valorInicial, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/caixas/abertura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          id_usuario: userId,
          valor_inicial: valorInicial,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      return { success: false };
    }
  };
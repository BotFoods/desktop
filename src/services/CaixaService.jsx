// services/CaixaService.js
import { apiGet, apiPost } from './ApiService';

export const verificarCaixaAberto = async (userId, token, lojaId) => {
  try {
    const data = await apiGet(`/api/caixas/usuario/${userId}?id_loja=${lojaId}`, token);
    return data;
  } catch (error) {
    return { success: false, caixas: [] };
  }
};

export const abrirCaixa = async (userId, valorInicial, token, lojaId) => {
  try {
    const data = await apiPost(`/api/caixas/abertura?id_loja=${lojaId}`, {
      usuario_abertura_id: userId,
      valor_inicial: valorInicial,
      loja_id: lojaId,
    }, token);
    
    return data;
  } catch (error) {
    return { 
      success: false, 
      message: 'Erro de conexão ao tentar abrir o caixa.',
      _isNetworkError: true 
    };
  }
};
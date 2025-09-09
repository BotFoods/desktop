/**
 * Utilitário para fazer chamadas de API com tratamento padronizado de erros
 * Especialmente útil para detectar e formatar erros de permissão
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Faz uma chamada de API padronizada
 * @param {string} endpoint - Endpoint da API (sem a base URL)
 * @param {Object} options - Opções da chamada fetch
 * @param {string} token - Token de autenticação
 * @returns {Promise<Object>} - Resposta da API com informações de erro padronizadas
 */
export const apiCall = async (endpoint, options = {}, token = null) => {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      defaultHeaders.Authorization = token;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers: defaultHeaders
    });

    const data = await response.json();

    // Se a resposta não foi bem-sucedida, incluir informações para tratamento de erro
    if (!response.ok) {
      return {
        ...data,
        _response: response,
        _isApiError: true,
        _status: response.status
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão com o servidor.',
      _isNetworkError: true,
      _originalError: error
    };
  }
};

/**
 * Faz uma chamada GET padronizada
 * @param {string} endpoint - Endpoint da API
 * @param {string} token - Token de autenticação
 * @param {Object} additionalHeaders - Headers adicionais
 * @returns {Promise<Object>} - Resposta da API
 */
export const apiGet = (endpoint, token = null, additionalHeaders = {}) => {
  return apiCall(endpoint, {
    method: 'GET',
    headers: additionalHeaders
  }, token);
};

/**
 * Faz uma chamada POST padronizada
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados para enviar
 * @param {string} token - Token de autenticação
 * @param {Object} additionalHeaders - Headers adicionais
 * @returns {Promise<Object>} - Resposta da API
 */
export const apiPost = (endpoint, data = {}, token = null, additionalHeaders = {}) => {
  return apiCall(endpoint, {
    method: 'POST',
    headers: additionalHeaders,
    body: JSON.stringify(data)
  }, token);
};

/**
 * Faz uma chamada PUT padronizada
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados para enviar
 * @param {string} token - Token de autenticação
 * @param {Object} additionalHeaders - Headers adicionais
 * @returns {Promise<Object>} - Resposta da API
 */
export const apiPut = (endpoint, data = {}, token = null, additionalHeaders = {}) => {
  return apiCall(endpoint, {
    method: 'PUT',
    headers: additionalHeaders,
    body: JSON.stringify(data)
  }, token);
};

/**
 * Faz uma chamada PATCH padronizada
 * @param {string} endpoint - Endpoint da API
 * @param {Object} data - Dados para enviar
 * @param {string} token - Token de autenticação
 * @param {Object} additionalHeaders - Headers adicionais
 * @returns {Promise<Object>} - Resposta da API
 */
export const apiPatch = (endpoint, data = {}, token = null, additionalHeaders = {}) => {
  return apiCall(endpoint, {
    method: 'PATCH',
    headers: additionalHeaders,
    body: JSON.stringify(data)
  }, token);
};

/**
 * Faz uma chamada DELETE padronizada
 * @param {string} endpoint - Endpoint da API
 * @param {string} token - Token de autenticação
 * @param {Object} additionalHeaders - Headers adicionais
 * @returns {Promise<Object>} - Resposta da API
 */
export const apiDelete = (endpoint, token = null, additionalHeaders = {}) => {
  return apiCall(endpoint, {
    method: 'DELETE',
    headers: additionalHeaders
  }, token);
};

export default {
  apiCall,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete
};

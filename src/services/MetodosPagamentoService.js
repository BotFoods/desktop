import { apiGet, apiPost, apiPut, apiDelete } from './ApiService';

/**
 * Listar métodos de pagamento ativos
 */
export const listarMetodosPagamento = async (token) => {
    return await apiGet('/api/metodos-pagamento', token);
};

/**
 * Listar todos os métodos de pagamento (incluindo inativos) - Admin apenas
 */
export const listarTodosMetodosPagamento = async (token) => {
    return await apiGet('/api/metodos-pagamento/admin/todos', token);
};

/**
 * Buscar método de pagamento por ID
 */
export const buscarMetodoPagamento = async (id, token) => {
    return await apiGet(`/api/metodos-pagamento/${id}`, token);
};

/**
 * Criar novo método de pagamento - Admin apenas
 */
export const criarMetodoPagamento = async (dados, token) => {
    return await apiPost('/api/metodos-pagamento', dados, token);
};

/**
 * Atualizar método de pagamento - Admin apenas
 */
export const atualizarMetodoPagamento = async (id, dados, token) => {
    return await apiPut(`/api/metodos-pagamento/${id}`, dados, token);
};

/**
 * Desativar método de pagamento - Admin apenas
 */
export const desativarMetodoPagamento = async (id, token) => {
    return await apiDelete(`/api/metodos-pagamento/${id}`, token);
};

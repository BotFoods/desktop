import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import ConfirmModal from '../components/ConfirmModal';
import { 
    FaCreditCard, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSave, FaPowerOff
} from 'react-icons/fa';
import {
    listarTodosMetodosPagamento,
    criarMetodoPagamento,
    atualizarMetodoPagamento,
    desativarMetodoPagamento
} from '../services/MetodosPagamentoService';
import usePermissions from '../hooks/usePermissions';

const MetodosPagamento = () => {
    const { token, user } = useAuth();
    const { hasPermission } = usePermissions();
    const [metodos, setMetodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [metodoToDelete, setMetodoToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        metodo: '',
        descricao: '',
        ativo: true
    });
    const [statusMessage, setStatusMessage] = useState(null);

    // Verificar se é owner (apenas owners podem gerenciar métodos)
    // MySQL retorna 0/1, não booleano, então usar Boolean() ou ==
    const canManage = Boolean(user?.is_owner);

    useEffect(() => {
        console.log('[MetodosPagamento] User:', user);
        console.log('[MetodosPagamento] is_owner:', user?.is_owner);
        console.log('[MetodosPagamento] canManage:', canManage);
        
        if (user && !canManage) {
            setStatusMessage({ 
                type: 'error', 
                message: 'Você não tem permissão para gerenciar métodos de pagamento.' 
            });
            setLoading(false);
            return;
        }
        
        if (user && canManage) {
            carregarMetodos();
        }
    }, [token, canManage, user]);

    const carregarMetodos = async () => {
        try {
            setLoading(true);
            const response = await listarTodosMetodosPagamento(token);
            
            // Verificar se a resposta tem a estrutura esperada
            if (response && response.data && Array.isArray(response.data)) {
                setMetodos(response.data);
            } else if (Array.isArray(response)) {
                setMetodos(response);
            } else {
                console.error('Formato de resposta inválido:', response);
                setMetodos([]);
                showMessage('Formato de resposta inválido da API.', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar métodos:', error);
            setMetodos([]);
            showMessage(
                error.response?.status === 403 
                    ? 'Você não tem permissão para acessar esta funcionalidade.' 
                    : 'Erro ao carregar métodos de pagamento.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    const handleOpenModal = (metodo = null) => {
        if (metodo) {
            setEditingId(metodo.id);
            setFormData({
                metodo: metodo.metodo,
                descricao: metodo.descricao || '',
                ativo: metodo.ativo
            });
        } else {
            setEditingId(null);
            setFormData({
                metodo: '',
                descricao: '',
                ativo: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ metodo: '', descricao: '', ativo: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.metodo.trim()) {
            showMessage('Nome do método é obrigatório.', 'error');
            return;
        }

        try {
            if (editingId) {
                await atualizarMetodoPagamento(editingId, formData, token);
                showMessage('Método atualizado com sucesso!', 'success');
            } else {
                await criarMetodoPagamento(formData, token);
                showMessage('Método criado com sucesso!', 'success');
            }
            handleCloseModal();
            carregarMetodos();
        } catch (error) {
            console.error('Erro ao salvar método:', error);
            showMessage(
                error.response?.data?.message || 'Erro ao salvar método de pagamento.', 
                'error'
            );
        }
    };

    const handleDesativar = async (id, metodo) => {
        setMetodoToDelete({ id, metodo });
        setShowConfirmModal(true);
    };

    const confirmDesativar = async () => {
        if (!metodoToDelete) return;

        try {
            await desativarMetodoPagamento(metodoToDelete.id, token);
            showMessage('Método desativado com sucesso!', 'success');
            carregarMetodos();
        } catch (error) {
            console.error('Erro ao desativar método:', error);
            showMessage(
                error.response?.data?.message || 'Erro ao desativar método de pagamento.', 
                'error'
            );
        } finally {
            setShowConfirmModal(false);
            setMetodoToDelete(null);
        }
    };

    const handleToggleAtivo = async (metodo) => {
        try {
            await atualizarMetodoPagamento(metodo.id, { ativo: !metodo.ativo }, token);
            showMessage(
                metodo.ativo ? 'Método desativado!' : 'Método ativado!', 
                'success'
            );
            carregarMetodos();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            showMessage('Erro ao alterar status do método.', 'error');
        }
    };

    if (!canManage) {
        return (
            <div className="bg-gray-900 text-white flex flex-col min-h-screen">
                <Header title="Sem Permissão" showBackButton />
                <div className="flex-grow flex items-center justify-center">
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-8 text-center">
                        <FaTimes className="text-red-500 text-6xl mx-auto mb-4" />
                        <p className="text-white text-xl">
                            Você não tem permissão para acessar esta página.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white flex flex-col min-h-screen">
            <Header title="Métodos de Pagamento" showBackButton />
            
            {/* Status Message */}
            {statusMessage && (
                <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    statusMessage.type === 'success' ? 'bg-green-500' :
                    statusMessage.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                } text-white`}>
                    {statusMessage.message}
                </div>
            )}

            <div className="flex-grow flex my-3">
                <div className="ml-64 pt-16 p-6 flex-grow flex flex-col">
                <h1 className="text-3xl font-bold mb-6">Gerenciar Métodos de Pagamento</h1>
                
                {/* Header com botão adicionar */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ml-auto"
                    >
                        <FaPlus className="mr-2" />
                        Adicionar Método
                    </button>
                </div>

                {/* Tabela de métodos */}
                <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-400 mt-4">Carregando...</p>
                        </div>
                    ) : metodos.length === 0 ? (
                        <div className="text-center py-12">
                            <FaCreditCard className="text-gray-600 text-6xl mx-auto mb-4" />
                            <p className="text-gray-400">Nenhum método de pagamento cadastrado.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Método
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Descrição
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {metodos.map((metodo) => (
                                    <tr key={metodo.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {metodo.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {metodo.metodo}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {metodo.descricao || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleToggleAtivo(metodo)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    metodo.ativo 
                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                } transition-colors`}
                                            >
                                                {metodo.ativo ? (
                                                    <><FaCheck className="inline mr-1" />Ativo</>
                                                ) : (
                                                    <><FaTimes className="inline mr-1" />Inativo</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button
                                                onClick={() => handleOpenModal(metodo)}
                                                className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                                                title="Editar"
                                            >
                                                <FaEdit className="inline text-lg" />
                                            </button>
                                            {metodo.ativo ? (
                                                <button
                                                    onClick={() => handleDesativar(metodo.id, metodo.metodo)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Desativar"
                                                >
                                                    <FaTrash className="inline text-lg" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleAtivo(metodo)}
                                                    className="text-green-400 hover:text-green-300 transition-colors"
                                                    title="Ativar"
                                                >
                                                    <FaPowerOff className="inline text-lg" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                </div>
            </div>

            {/* Modal de Adicionar/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingId ? 'Editar Método de Pagamento' : 'Adicionar Método de Pagamento'}
                        </h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Nome do Método *
                                </label>
                                <input
                                    type="text"
                                    value={formData.metodo}
                                    onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Dinheiro, PIX, Cartão..."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Descrição opcional do método..."
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.ativo}
                                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                        className="form-checkbox h-5 w-5 text-blue-500 rounded bg-gray-700 border-gray-600"
                                    />
                                    <span className="ml-2 text-gray-300">Método ativo</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <FaSave className="mr-2" />
                                    {editingId ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Confirmação de Desativação */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setMetodoToDelete(null);
                }}
                title="Desativar Método de Pagamento"
                message={`Tem certeza que deseja desativar o método "${metodoToDelete?.metodo}"? Ele não estará mais disponível para uso nos PDVs.`}
                confirmText="Desativar"
                cancelText="Cancelar"
                confirmVariant="danger"
                onConfirm={confirmDesativar}
            />
        </div>
    );
};

export default MetodosPagamento;

import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo, FaPlus, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';
import Modal from './Modal';

const FuncaoCadastro = () => {
    const { token, validateSession, user } = useAuth();
    const [funcao, setFuncao] = useState('');
    const [funcoes, setFuncoes] = useState([]);
    const [message, setMessage] = useState('');
    const [messageDuration, setMessageDuration] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, [validateSession]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        if (messageDuration) clearTimeout(messageDuration);
        const timer = setTimeout(() => setMessage(''), 5000);
        setMessageDuration(timer);
    };

    useEffect(() => {
        const fetchFuncoes = async () => {
            setLoading(true);
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include',
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/funcoes/?id_loja=${user.loja_id}`, options);
                const data = await response.json();
                setFuncoes(data.funcoes);
            } catch (error) {
                setMessage({ text: 'Erro ao buscar funções', type: 'error' });
                const timer = setTimeout(() => setMessage(''), 5000);
                setMessageDuration(timer);
            } finally {
                setLoading(false);
            }
        };

        if (token && API_BASE_URL && user?.loja_id) {
            fetchFuncoes();
        }
    }, [token, API_BASE_URL, user?.loja_id]);

    const handleAddFuncao = async () => {
        if (!funcao.trim()) {
            showMessage('Digite o nome da função', 'error');
            return;
        }

        setLoading(true);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ nome: funcao, id_loja: user.loja_id })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/funcoes/cadastrar`, options);
            const data = await response.json();
            if (data.success) {
                const newFuncao = { id: data.id, descricao: funcao, ativo: 1 };
                setFuncoes([...funcoes, newFuncao]);
                setFuncao('');
                showMessage(data.message || 'Função cadastrada com sucesso!');
                setIsModalOpen(false);
            } else {
                showMessage(data.message || 'Erro ao cadastrar função', 'error');
            }
        } catch (error) {
            showMessage('Erro ao cadastrar função', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDesativarFuncao = async (id) => {
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/funcoes/desativar/${id}?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            if (data.success) {
                setFuncoes(funcoes.map(func => func.id === id ? { ...func, ativo: 0 } : func));
                showMessage('Função desativada com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao desativar função', 'error');
            }
        } catch (error) {
            showMessage('Erro ao desativar função', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAtivarFuncao = async (id) => {
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/funcoes/ativar/${id}?id_loja=${user.loja_id}`, options);
            const data = await response.json();
            if (data.success) {
                setFuncoes(funcoes.map(func => func.id === id ? { ...func, ativo: 1 } : func));
                showMessage('Função ativada com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao ativar função', 'error');
            }
        } catch (error) {
            showMessage('Erro ao ativar função', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditFuncao = (index) => {
        const func = funcoes[index];
        const novaFuncao = prompt('Editar nome da função', func.descricao);
        if (novaFuncao && novaFuncao !== func.descricao) {
            setFuncoes((prevFuncoes) => {
                const updatedFuncoes = [...prevFuncoes];
                updatedFuncoes[index] = { ...func, descricao: novaFuncao };
                return updatedFuncoes;
            });
            showMessage('Função editada com sucesso!');
        }
    };

    const openModal = () => {
        setFuncao('');
        setIsModalOpen(true);
    };

    const funcoesAtivas = funcoes.filter(func => func.ativo === 1);
    const funcoesInativas = funcoes.filter(func => func.ativo === 0);

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold relative">
                    <span className="relative inline-block">
                        Lista de Funções
                        <span className="absolute -top-1 -right-6 bg-blue-500 text-xs text-white py-1 px-2 rounded-full">
                            {funcoes.length}
                        </span>
                    </span>
                </h3>
                
                <button 
                    onClick={openModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <FaPlus />
                    <span>Nova Função</span>
                </button>
            </div>
            
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Nova Função" 
                icon={<FaUserTie />}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddFuncao();
                    }}
                    className="space-y-4"
                >
                    <div className="relative">
                        <input
                            id="funcao"
                            type="text"
                            value={funcao}
                            onChange={(e) => setFuncao(e.target.value)}
                            placeholder="Nome da Função"
                            className="w-full p-3 pl-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <button 
                        type="submit" 
                        className={`w-full p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            loading 
                            ? 'bg-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                        } text-white font-bold`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Cadastrando...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <FaPlus className="mr-2" />
                                Cadastrar
                            </span>
                        )}
                    </button>
                </form>
                {message && (
                    <div className={`mt-4 p-2 rounded-lg text-center transition-all duration-300 ${
                        message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                    }`}>
                        {message.text}
                    </div>
                )}
            </Modal>
            
            <div className="mt-8">                
                <h3 className="text-xl font-bold mb-6 text-center relative">
                    <span className="relative inline-block">
                        Funções Ativas
                        <span className="absolute -top-1 -right-6 bg-green-500 text-xs text-white py-1 px-2 rounded-full">
                            {funcoesAtivas.length}
                        </span>
                    </span>
                </h3>
                
                {loading && funcoes.length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : funcoesAtivas.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhuma função ativa encontrada.</p>
                        <p className="text-sm mt-2">Cadastre uma nova função usando o botão acima.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-6 text-left border-b border-gray-600">Função</th>
                                    <th className="py-3 px-6 text-right border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funcoesAtivas.map((func, index) => (
                                    <tr 
                                        key={func.id || `active-${index}`}
                                        className="hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="py-3 px-6 border-b border-gray-700">{func.descricao}</td>
                                        <td className="py-3 px-6 border-b border-gray-700 text-right">
                                            <button 
                                                onClick={() => handleEditFuncao(index)} 
                                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg mr-2 transition-colors duration-200"
                                                title="Editar função"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDesativarFuncao(func.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Desativar função"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="w-full mt-12 mb-4">
                <h3 className="text-xl font-bold mb-6 text-center relative">
                    <span className="relative inline-block">
                        Funções Desativadas
                        <span className="absolute -top-1 -right-6 bg-gray-500 text-xs text-white py-1 px-2 rounded-full">
                            {funcoesInativas.length}
                        </span>
                    </span>
                </h3>
                
                {funcoesInativas.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhuma função desativada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-gray-400 rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-6 text-left border-b border-gray-600">Função</th>
                                    <th className="py-3 px-6 text-right border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funcoesInativas.map((func, index) => (
                                    <tr 
                                        key={func.id || `inactive-${index}`}
                                        className="hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="py-3 px-6 border-b border-gray-700 italic">{func.descricao}</td>
                                        <td className="py-3 px-6 border-b border-gray-700 text-right">
                                            <button 
                                                onClick={() => handleAtivarFuncao(func.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Reativar função"
                                            >
                                                <FaUndo />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default FuncaoCadastro;

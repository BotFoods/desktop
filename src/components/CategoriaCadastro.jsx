import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo, FaPlus, FaTags } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';
import Modal from './Modal';

const CategoriaCadastro = () => {
    const { token, validateSession } = useAuth();
    const [categoria, setCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [message, setMessage] = useState('');
    const [messageDuration, setMessageDuration] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        validateSession();
    }, [validateSession]);

    useEffect(() => {
        const fetchCategorias = async () => {
            setLoading(true);
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include',
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/categorias/`, options);
                const data = await response.json();
                setCategorias(data.categorias);
            } catch (error) {
                console.error('Error fetching categories:', error);
                showMessage('Erro ao buscar categorias', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCategorias();
    }, [token, API_BASE_URL]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        if (messageDuration) clearTimeout(messageDuration);
        const timer = setTimeout(() => setMessage(''), 5000);
        setMessageDuration(timer);
    };

    const handleAddCategoria = async () => {
        if (!categoria.trim()) {
            showMessage('Digite o nome da categoria', 'error');
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
            body: JSON.stringify({ categoria, id_loja: 1 })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/categorias/cadastrar`, options);
            const data = await response.json();
            if (data.success) {
                const newCategoria = { id: data.id, categoria, ativo: 1 };
                setCategorias([...categorias, newCategoria]);
                setCategoria('');
                showMessage(data.message || 'Categoria cadastrada com sucesso!');
                setIsModalOpen(false);
            } else {
                showMessage(data.message || 'Erro ao cadastrar categoria', 'error');
            }
        } catch (error) {
            console.error('Error creating category:', error);
            showMessage('Erro ao cadastrar categoria', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDesativarCategoria = async (id) => {
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/categorias/desativar/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setCategorias(categorias.map(cat => cat.id === id ? { ...cat, ativo: 0 } : cat));
                showMessage('Categoria desativada com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao desativar categoria', 'error');
            }
        } catch (error) {
            console.error('Error deactivating category:', error);
            showMessage('Erro ao desativar categoria', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAtivarCategoria = async (id) => {
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/categorias/ativar/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setCategorias(categorias.map(cat => cat.id === id ? { ...cat, ativo: 1 } : cat));
                showMessage('Categoria ativada com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao ativar categoria', 'error');
            }
        } catch (error) {
            console.error('Error activating category:', error);
            showMessage('Erro ao ativar categoria', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCategoria = (index) => {
        const cat = categorias[index];
        const newCategoria = prompt('Editar nome da categoria', cat.categoria);
        if (newCategoria && newCategoria !== cat.categoria) {
            setCategorias((prevCategorias) => {
                const updatedCategorias = [...prevCategorias];
                updatedCategorias[index] = { ...cat, categoria: newCategoria };
                return updatedCategorias;
            });
            showMessage('Categoria editada com sucesso!');
        }
    };

    const openModal = () => {
        setCategoria('');
        setIsModalOpen(true);
    };

    const categoriasAtivas = categorias.filter(cat => cat.ativo === 1);
    const categoriasInativas = categorias.filter(cat => cat.ativo === 0);

    const CategoryForm = () => (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCategoria();
                }}
                className="space-y-4"
            >
                <div className="relative">
                    <input
                        id="categoria"
                        type="text"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Nome da Categoria"
                        className="w-full p-3 pl-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        autoFocus
                        disabled={loading}
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
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
        </div>
    );

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold relative">
                    <span className="relative inline-block">
                        Lista de Categorias
                        <span className="absolute -top-1 -right-6 bg-blue-500 text-xs text-white py-1 px-2 rounded-full">
                            {categorias.length}
                        </span>
                    </span>
                </h3>
                
                <button 
                    onClick={openModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <FaPlus />
                    <span>Nova Categoria</span>
                </button>
            </div>
            
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Nova Categoria" 
                icon={<FaTags />}
            >
                <CategoryForm />
            </Modal>
            
            <div className="mt-8">                
                <h3 className="text-xl font-bold mb-6 text-center relative">
                    <span className="relative inline-block">
                        Categorias Ativas
                        <span className="absolute -top-1 -right-6 bg-green-500 text-xs text-white py-1 px-2 rounded-full">
                            {categoriasAtivas.length}
                        </span>
                    </span>
                </h3>
                
                {loading && categorias.length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : categoriasAtivas.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhuma categoria ativa encontrada.</p>
                        <p className="text-sm mt-2">Cadastre uma nova categoria usando o botão acima.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-6 text-left border-b border-gray-600">Categoria</th>
                                    <th className="py-3 px-6 text-right border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoriasAtivas.map((cat, index) => (
                                    <tr 
                                        key={cat.id || `active-${index}`}
                                        className="hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="py-3 px-6 border-b border-gray-700">{cat.categoria}</td>
                                        <td className="py-3 px-6 border-b border-gray-700 text-right">
                                            <button 
                                                onClick={() => handleEditCategoria(index)} 
                                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg mr-2 transition-colors duration-200"
                                                title="Editar categoria"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={() => handleDesativarCategoria(cat.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Desativar categoria"
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
                        Categorias Desativadas
                        <span className="absolute -top-1 -right-6 bg-gray-500 text-xs text-white py-1 px-2 rounded-full">
                            {categoriasInativas.length}
                        </span>
                    </span>
                </h3>
                
                {categoriasInativas.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhuma categoria desativada.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow">
                        <table className="min-w-full bg-gray-800 text-gray-400 rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-6 text-left border-b border-gray-600">Categoria</th>
                                    <th className="py-3 px-6 text-right border-b border-gray-600">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoriasInativas.map((cat, index) => (
                                    <tr 
                                        key={cat.id || `inactive-${index}`}
                                        className="hover:bg-gray-700 transition-colors duration-150"
                                    >
                                        <td className="py-3 px-6 border-b border-gray-700 italic">{cat.categoria}</td>
                                        <td className="py-3 px-6 border-b border-gray-700 text-right">
                                            <button 
                                                onClick={() => handleAtivarCategoria(cat.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                                                title="Reativar categoria"
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

export default CategoriaCadastro;

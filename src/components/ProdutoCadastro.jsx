import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo, FaPlus, FaBoxOpen, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';
import Modal from './Modal';

const ProdutoCadastro = () => {
    const { token, validateSession, user } = useAuth();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [produtos, setProdutos] = useState({});
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [activeTab, setActiveTab] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [loading, setLoading] = useState(false);

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
                setCategorias(data.categorias.filter(cat => cat.ativo === 1));
            } catch (error) {
                console.error('Error fetching categories:', error);
                showMessage('Erro ao buscar categorias', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCategorias();
    }, [token, API_BASE_URL]);

    useEffect(() => {
        const fetchProdutos = async () => {
            setLoading(true);
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                },
                credentials: 'include',
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/produtos?loja_id=${user?.loja_id || 1}`, options);
                const data = await response.json();
                setProdutos(data);
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                showMessage('Erro ao buscar produtos. Verifique sua conexão.', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (token && API_BASE_URL && user) {
            fetchProdutos();
        }
    }, [token, API_BASE_URL, user]);

    useEffect(() => {
        if (categorias.length > 0) {
            setActiveTab(categorias[0].categoria);
        }
    }, [categorias]);

    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
        }, 5000);
    };

    const fetchProdutos = async () => {
        if (!token || !API_BASE_URL || !user) return;
        
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                authorization: `${token}`
            },
            credentials: 'include',
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos?loja_id=${user?.loja_id || 1}`, options);
            const data = await response.json();
            setProdutos(data);
        } catch (error) {
            console.error('Erro ao recarregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return '0,00';
        return Number(price).toFixed(2).replace('.', ',');
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;

        // Remove todos os caracteres que não são números ou vírgula
        const numericValue = value.replace(/[^0-9,]/g, '');

        // Substitui vírgula por ponto para armazenamento interno
        setPreco(numericValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nome.trim()) {
            showMessage('Digite o nome do produto', 'error');
            return;
        }

        if (!preco.trim()) {
            showMessage('Digite o preço do produto', 'error');
            return;
        }

        if (!idCategoria) {
            showMessage('Selecione uma categoria', 'error');
            return;
        }

        setLoading(true);

        // Converte o preço para o formato esperado pela API
        const precoFormatado = preco.replace(',', '.');

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                nome,
                descricao,
                preco: precoFormatado,
                id_categoria: idCategoria,
                loja_id: 1,
                sku: '',
                codigo_barras: '',
                disponibilidade: 1
            })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos/cadastrar`, options);
            const data = await response.json();

            if (data.success) {
                const newProduct = { id: data.id, nome, descricao, preco, id_categoria: idCategoria, disponibilidade: 1 };
                
                setProdutos((prevProdutos) => {
                    const updatedProdutos = { ...prevProdutos };
                    const category = categorias.find(cat => cat.id === parseInt(idCategoria, 10));
                    
                    if (category) {
                        const categoryName = category.categoria;
                        if (!updatedProdutos[categoryName]) {
                            updatedProdutos[categoryName] = [];
                        }
                        updatedProdutos[categoryName].push({
                            ...newProduct,
                            name: nome,  // Add name property for display
                            price: preco // Add price property for display
                        });
                    }
                    return updatedProdutos;
                });
                setNome('');
                setDescricao('');
                setPreco('');
                setIdCategoria('');
                showMessage(data.message || 'Produto cadastrado com sucesso!');
                setIsFormModalOpen(false);
                
                // Recarregar a lista de produtos para garantir sincronização
                await fetchProdutos();
            } else {
                showMessage(data.message || 'Erro ao cadastrar produto', 'error');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showMessage('Erro ao cadastrar produto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editProduct || !editProduct.nome) {
            showMessage('Nome do produto é obrigatório', 'error');
            return;
        }

        if (!editProduct.price && !editProduct.preco) {
            showMessage('Preço do produto é obrigatório', 'error');
            return;
        }

        setLoading(true);

        // Converte o preço para o formato esperado pela API
        const precoFormatado = (editProduct.price || editProduct.preco).toString().replace(',', '.');

        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                id: editProduct.id,
                nome: editProduct.nome || editProduct.name,
                descricao: editProduct.descricao,
                preco: precoFormatado,
                loja_id: 1,
                id_categoria: editProduct.id_categoria
            })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos/atualizar/${editProduct.id}`, options);
            const data = await response.json();

            if (data.success) {
                // Atualiza o produto na lista
                setProdutos((prevProdutos) => {
                    const updatedProdutos = { ...prevProdutos };

                    // Encontra a categoria do produto
                    for (const categoria in updatedProdutos) {
                        const index = updatedProdutos[categoria].findIndex(p => p.id === editProduct.id);
                        if (index !== -1) {
                            updatedProdutos[categoria][index] = {
                                ...updatedProdutos[categoria][index],
                                nome: editProduct.nome || editProduct.name,
                                name: editProduct.nome || editProduct.name,
                                descricao: editProduct.descricao,
                                preco: precoFormatado,
                                price: precoFormatado
                            };
                            break;
                        }
                    }

                    return updatedProdutos;
                });

                showMessage('Produto atualizado com sucesso!');
                setIsEditModalOpen(false);
            } else {
                showMessage(data.message || 'Erro ao atualizar produto', 'error');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            showMessage('Erro ao atualizar produto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDisponibilidade = async (categoria, productId, novaDisponibilidade) => {
        setLoading(true);

        const options = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                disponibilidade: novaDisponibilidade
            })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/produtos/disponibilidade/${productId}`, options);
            const data = await response.json();

            if (data.success) {
                // Atualiza o produto na lista
                setProdutos((prevProdutos) => {
                    const updatedProdutos = { ...prevProdutos };

                    if (updatedProdutos[categoria]) {
                        const index = updatedProdutos[categoria].findIndex(p => p.id === productId);
                        if (index !== -1) {
                            updatedProdutos[categoria][index] = {
                                ...updatedProdutos[categoria][index],
                                disponibilidade: novaDisponibilidade
                            };
                        }
                    }

                    return updatedProdutos;
                });

                showMessage(novaDisponibilidade === 1 ? 'Produto ativado com sucesso!' : 'Produto desativado com sucesso!');
            } else {
                showMessage(data.message || 'Erro ao alterar disponibilidade do produto', 'error');
            }
        } catch (error) {
            console.error('Error toggling product availability:', error);
            showMessage('Erro ao alterar disponibilidade do produto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTabClick = (categoria) => {
        setActiveTab(categoria);
    };

    const openFormModal = () => {
        setNome('');
        setDescricao('');
        setPreco('');
        setIdCategoria('');
        setIsFormModalOpen(true);
    };

    const handleEditProduto = (categoria, index) => {
        const product = produtos[categoria][index];
        setEditProduct({ ...product });
        setIsEditModalOpen(true);
    };

    return (
        <>
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold relative">
                    <span className="relative inline-block">
                        Catálogo de Produtos
                        <span className="absolute -top-1 -right-6 bg-blue-500 text-xs text-white py-1 px-2 rounded-full">
                            {Object.values(produtos).flat().length}
                        </span>
                    </span>
                </h3>

                <button
                    onClick={openFormModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                    <FaPlus />
                    <span>Novo Produto</span>
                </button>
            </div>

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title="Novo Produto"
                icon={<FaBoxOpen />}
                width="max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="nomeProduto" className="block text-sm font-medium text-gray-300 mb-1">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nomeProduto"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Nome do Produto"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="descricaoProduto" className="block text-sm font-medium text-gray-300 mb-1">
                            Descrição
                        </label>
                        <textarea
                            id="descricaoProduto"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descrição do Produto"
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            rows="3"
                            disabled={loading}
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="precoProduto" className="block text-sm font-medium text-gray-300 mb-1">
                            Preço <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                R$
                            </span>
                            <input
                                id="precoProduto"
                                type="text"
                                value={preco}
                                onChange={handlePriceChange}
                                placeholder="0,00"
                                className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="categoriaProduto" className="block text-sm font-medium text-gray-300 mb-1">
                            Categoria <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="categoriaProduto"
                            value={idCategoria}
                            onChange={(e) => setIdCategoria(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            disabled={loading || categorias.length === 0}
                        >
                            <option value="">Selecione uma Categoria</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.categoria}
                                </option>
                            ))}
                        </select>
                        {categorias.length === 0 && (
                            <p className="mt-1 text-sm text-yellow-400">
                                Nenhuma categoria disponível. Cadastre uma categoria primeiro.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={`w-full p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            loading || categorias.length === 0
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                            } text-white font-bold`}
                        disabled={loading || categorias.length === 0}
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
                                Cadastrar Produto
                            </span>
                        )}
                    </button>
                </form>
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-center transition-all duration-300 ${
                        messageType === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                        }`}>
                        {message}
                    </div>
                )}
            </Modal>

            <div className="w-full mt-8">
                <hr className="my-8 border-gray-700" />

                <h3 className="text-xl font-bold mb-6 text-center">Lista de Produtos</h3>

                {categorias.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                        <p>Nenhuma categoria cadastrada.</p>
                        <p className="text-sm mt-2">Cadastre uma categoria antes de adicionar produtos.</p>
                    </div>
                ) : loading && Object.keys(produtos).length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap justify-center gap-2 mb-6 overflow-x-auto pb-2">
                            {categorias.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleTabClick(cat.categoria)}
                                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                                        activeTab === cat.categoria
                                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    disabled={!cat.ativo}
                                >
                                    {cat.categoria}
                                </button>
                            ))}
                        </div>

                        {categorias.map((cat) => (
                            <div key={cat.id} className={`${activeTab === cat.categoria ? 'block' : 'hidden'} transition-opacity duration-300`}>
                                <div className="mb-8">
                                    <div className="flex items-center mb-4">
                                        <h4 className="text-lg font-bold flex items-center">
                                            <FaCheck className="text-green-500 mr-2" />
                                            Produtos Disponíveis
                                        </h4>
                                        <span className="ml-2 bg-green-500 text-xs text-white py-1 px-2 rounded-full">
                                            {produtos[cat.categoria]?.filter(prod => prod.disponibilidade === 1).length || 0}
                                        </span>
                                    </div>

                                    {!produtos[cat.categoria] || produtos[cat.categoria].filter(prod => prod.disponibilidade === 1).length === 0 ? (
                                        <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                                            <p>Nenhum produto disponível nesta categoria.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg shadow">
                                            <table className="min-w-full bg-gray-800 text-white rounded-lg overflow-hidden">
                                                <thead className="bg-gray-700">
                                                    <tr>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Nome</th>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Descrição</th>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Preço</th>
                                                        <th className="py-3 px-4 text-center border-b border-gray-600">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produtos[cat.categoria].filter(prod => prod.disponibilidade === 1).map((prod, index) => (
                                                        <tr
                                                            key={prod.id}
                                                            className="hover:bg-gray-700 transition-colors duration-150"
                                                        >
                                                            <td className="py-3 px-4 border-b border-gray-700">{prod.nome || prod.name}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700">{prod.descricao || '-'}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700">R$ {formatPrice(prod.price || prod.preco)}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700 flex justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditProduto(cat.categoria, index)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                                    title="Editar produto"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleDisponibilidade(cat.categoria, prod.id, 0)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                                                                    title="Desativar produto"
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

                                <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                        <h4 className="text-lg font-bold flex items-center">
                                            <FaTimes className="text-red-500 mr-2" />
                                            Produtos Indisponíveis
                                        </h4>
                                        <span className="ml-2 bg-gray-500 text-xs text-white py-1 px-2 rounded-full">
                                            {produtos[cat.categoria]?.filter(prod => prod.disponibilidade === 0).length || 0}
                                        </span>
                                    </div>

                                    {!produtos[cat.categoria] || produtos[cat.categoria].filter(prod => prod.disponibilidade === 0).length === 0 ? (
                                        <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
                                            <p>Nenhum produto indisponível nesta categoria.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg shadow">
                                            <table className="min-w-full bg-gray-800 text-gray-400 rounded-lg overflow-hidden">
                                                <thead className="bg-gray-700">
                                                    <tr>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Nome</th>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Descrição</th>
                                                        <th className="py-3 px-4 text-left border-b border-gray-600">Preço</th>
                                                        <th className="py-3 px-4 text-center border-b border-gray-600">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produtos[cat.categoria].filter(prod => prod.disponibilidade === 0).map((prod) => (
                                                        <tr
                                                            key={prod.id}
                                                            className="hover:bg-gray-700 transition-colors duration-150 italic"
                                                        >
                                                            <td className="py-3 px-4 border-b border-gray-700">{prod.nome || prod.name}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700">{prod.descricao || '-'}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700">R$ {formatPrice(prod.price || prod.preco)}</td>
                                                            <td className="py-3 px-4 border-b border-gray-700 flex justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleToggleDisponibilidade(cat.categoria, prod.id, 1)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors duration-200"
                                                                    title="Reativar produto"
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
                            </div>
                        ))}
                    </>
                )}
            </div>

            {isEditModalOpen && editProduct && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Editar Produto"
                    icon={<FaEdit />}
                    width="max-w-xl"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={editProduct.nome || editProduct.name || ''}
                                onChange={(e) => setEditProduct({ ...editProduct, nome: e.target.value, name: e.target.value })}
                                placeholder="Nome do Produto"
                                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Descrição
                            </label>
                            <textarea
                                value={editProduct.descricao || ''}
                                onChange={(e) => setEditProduct({ ...editProduct, descricao: e.target.value })}
                                placeholder="Descrição do Produto"
                                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                rows="3"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Preço <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    R$
                                </span>
                                <input
                                    type="text"
                                    value={editProduct.price || editProduct.preco || ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9,]/g, '');
                                        setEditProduct({ ...editProduct, price: value, preco: value })
                                    }}
                                    placeholder="0,00"
                                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-1/2 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors duration-200"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className={`w-1/2 p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                    } text-white font-bold`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Salvando...
                                    </span>
                                ) : (
                                    <span>Salvar</span>
                                )}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ProdutoCadastro;

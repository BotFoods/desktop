import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaUndo } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const ProdutoCadastro = () => {
    const { token, setToken } = useAuth();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [produtos, setProdutos] = useState({});
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    useEffect(() => {
        const fetchCategorias = async () => {
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                }
            };

            try {
                const response = await fetch('http://localhost:8080/api/categorias/', options);
                const data = await response.json();
                if (data.auth === false) {
                    setToken('');
                }
                setCategorias(data.categorias.filter(cat => cat.ativo));
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategorias();
    }, [token]);

    useEffect(() => {
        const fetchProdutos = async () => {
            const options = {
                method: 'GET',
                headers: {
                    authorization: `${token}`
                }
            };

            try {
                const response = await fetch('http://localhost:8080/api/produtos?loja_id=1', options);
                const data = await response.json();
                setProdutos(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProdutos();
    }, [token]);

    useEffect(() => {
        document.getElementById('nomeProduto').focus();
    }, []);

    useEffect(() => {
        if (categorias.length > 0) {
            setActiveTab(categorias[0].categoria);
        }
    }, [categorias]);

    const handleAddProduto = async () => {
        if (nome.trim() && preco.trim() && idCategoria) {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `${token}`
                },
                body: JSON.stringify({ nome, descricao, preco, disponibilidade: 1, id_categoria: idCategoria })
            };

            try {
                const response = await fetch('http://localhost:8080/api/produtos/cadastrar', options);
                const data = await response.json();
                if (data.success) {
                    const newProduct = { id: data.id, nome, descricao, preco, id_categoria: idCategoria };
                    setProdutos((prevProdutos) => {
                        const updatedProdutos = { ...prevProdutos };
                        const category = categorias.find(cat => cat.id === idCategoria);
                        if (category) {
                            const categoryName = category.categoria;
                            if (!updatedProdutos[categoryName]) {
                                updatedProdutos[categoryName] = [];
                            }
                            updatedProdutos[categoryName].push(newProduct);
                        }
                        return updatedProdutos;
                    });
                    setNome('');
                    setDescricao('');
                    setPreco('');
                    setIdCategoria('');
                    setMessage(data.message);
                } else {
                    console.error('Error adding product:', data.message);
                }
            } catch (error) {
                console.error('Error adding product:', error);
            }
        }
    };

    const handleEditProduto = (category, index) => {
        const product = produtos[category][index];
        setEditProduct({ ...product, category, index });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        const { category, index, nome, descricao, preco } = editProduct;
        setProdutos((prevProdutos) => {
            const updatedProdutos = { ...prevProdutos };
            updatedProdutos[category][index] = { ...updatedProdutos[category][index], nome, descricao, preco };
            return updatedProdutos;
        });
        setIsEditModalOpen(false);
    };

    const handleToggleDisponibilidade = async (category, id, disponibilidade) => {
        const options = {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${token}`
            },
            body: JSON.stringify({ disponibilidade })
        };

        try {
            const response = await fetch(`http://localhost:8080/api/produtos/disponibilidade/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setProdutos((prevProdutos) => {
                    const updatedProdutos = { ...prevProdutos };
                    updatedProdutos[category] = updatedProdutos[category].map(prod => 
                        prod.id === id ? { ...prod, disponibilidade } : prod
                    );
                    return updatedProdutos;
                });
            } else {
                console.error('Error changing product availability:', data.message);
            }
        } catch (error) {
            console.error('Error changing product availability:', error);
        }
    };

    const handleTabClick = (category) => {
        setActiveTab(category);
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddProduto();
                    }}
                    className="space-y-4"
                >
                    <input
                        id="nomeProduto"
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome do Produto"
                        className="w-full p-2 rounded bg-gray-700 text-white"
                        autoFocus
                    />
                    <textarea
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descrição do Produto"
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <input
                        type="number"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        placeholder="Preço do Produto"
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <select
                        value={idCategoria}
                        onChange={(e) => setIdCategoria(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        <option value="">Selecione uma Categoria</option>
                        {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.categoria}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="w-full p-2 rounded bg-blue-600 text-white font-bold">
                        Cadastrar
                    </button>
                </form>
                {message && <p className="mt-4 text-green-500">{message}</p>}
            </div>
            <div className="w-full">
                <hr className="my-8 border-gray-700" />
                <h3 className="text-xl font-bold mb-4 text-center">Lista de Produtos</h3>
                <div className="flex justify-center mb-4">
                    {categorias.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleTabClick(cat.categoria)}
                            className={`px-4 py-2 mx-2 rounded ${activeTab === cat.categoria ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                            disabled={!cat.ativo}
                        >
                            {cat.categoria}
                        </button>
                    ))}
                </div>
                {categorias.map((cat) => (
                    <div key={cat.id} className={`${activeTab === cat.categoria ? 'block' : 'hidden'}`}>
                        <h4 className="text-lg font-bold mb-2">Disponíveis</h4>
                        <table className="min-w-full bg-gray-800 text-white text-center">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b border-gray-700">Nome</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Descrição</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Preço</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Categoria</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos[cat.categoria] && produtos[cat.categoria].filter(prod => prod.disponibilidade === 1).map((prod, index) => (
                                    <tr key={prod.id}>
                                        <td className="py-2 px-4 border-b border-gray-700">{prod.name}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">{prod.descricao ? prod.descricao : '-'}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">R$ {prod.price}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">{cat.categoria}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">
                                            <button onClick={() => handleEditProduto(cat.categoria, index)} className="mr-2">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleToggleDisponibilidade(cat.categoria, prod.id, 0)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h4 className="text-lg font-bold mt-6 mb-2">Indisponíveis</h4>
                        <table className="min-w-full bg-gray-800 text-white text-center">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b border-gray-700">Nome</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Descrição</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Preço</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Categoria</th>
                                    <th className="py-2 px-4 border-b border-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos[cat.categoria] && produtos[cat.categoria].filter(prod => prod.disponibilidade === 0).map((prod, index) => (
                                    <tr key={prod.id} className="text-gray-500 italic line-through">
                                        <td className="py-2 px-4 border-b border-gray-700">{prod.name}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">{prod.descricao ? prod.descricao : '-'}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">R$ {prod.price}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">{cat.categoria}</td>
                                        <td className="py-2 px-4 border-b border-gray-700">
                                            <button onClick={() => handleToggleDisponibilidade(cat.categoria, prod.id, 1)} className='text-gray-100'>
                                                <FaUndo />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            {isEditModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Editar Produto</h2>
                        <input
                            type="text"
                            value={editProduct.nome}
                            onChange={(e) => setEditProduct({ ...editProduct, nome: e.target.value })}
                            placeholder="Nome do Produto"
                            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
                        />
                        <textarea
                            value={editProduct.descricao}
                            onChange={(e) => setEditProduct({ ...editProduct, descricao: e.target.value })}
                            placeholder="Descrição do Produto"
                            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
                        />
                        <input
                            type="number"
                            value={editProduct.preco}
                            onChange={(e) => setEditProduct({ ...editProduct, preco: e.target.value })}
                            placeholder="Preço do Produto"
                            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
                        />
                        <button onClick={handleSaveEdit} className="w-full p-2 rounded bg-blue-600 text-white font-bold">
                            Salvar
                        </button>
                        <button onClick={() => setIsEditModalOpen(false)} className="w-full p-2 rounded bg-red-600 text-white font-bold mt-2">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProdutoCadastro;

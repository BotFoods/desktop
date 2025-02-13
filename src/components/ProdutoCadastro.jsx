import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const ProdutoCadastro = () => {
    const { token } = useAuth();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [produtos, setProdutos] = useState({});

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
                setCategorias(data.categorias);
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
                        const category = categorias.find(cat => cat.id === idCategoria).categoria;
                        if (!updatedProdutos[category]) {
                            updatedProdutos[category] = [];
                        }
                        updatedProdutos[category].push(newProduct);
                        return updatedProdutos;
                    });
                    setNome('');
                    setDescricao('');
                    setPreco('');
                    setIdCategoria('');
                } else {
                    console.error('Error adding product:', data.message);
                }
            } catch (error) {
                console.error('Error adding product:', error);
            }
        }
    };

    const handleDeleteProduto = async (category, id) => {
        const options = {
            method: 'DELETE',
            headers: {
                authorization: `${token}`
            }
        };

        try {
            const response = await fetch(`http://localhost:8080/api/produtos/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setProdutos((prevProdutos) => {
                    const updatedProdutos = { ...prevProdutos };
                    updatedProdutos[category] = updatedProdutos[category].filter(prod => prod.id !== id);
                    return updatedProdutos;
                });
            } else {
                console.error('Error deleting product:', data.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleEditProduto = (category, index) => {
        const product = produtos[category][index];
        const newNome = prompt('Edit Product Name', product.nome);
        const newDescricao = prompt('Edit Product Description', product.descricao);
        const newPreco = prompt('Edit Product Price', product.preco);
        if (newNome && newDescricao && newPreco) {
            setProdutos((prevProdutos) => {
                const updatedProdutos = { ...prevProdutos };
                updatedProdutos[category][index] = { ...product, nome: newNome, descricao: newDescricao, preco: newPreco };
                return updatedProdutos;
            });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleAddProduto();
                }}
                className="mb-4"
            >
                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do Produto"
                    className="p-2 border border-gray-300 rounded w-full text-black mb-2"
                />
                <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição do Produto"
                    className="p-2 border border-gray-300 rounded w-full text-black mb-2"
                />
                <input
                    type="number"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="Preço do Produto"
                    className="p-2 border border-gray-300 rounded w-full text-black mb-2"
                />
                <select
                    value={idCategoria}
                    onChange={(e) => setIdCategoria(e.target.value)}
                    className="p-2 border border-gray-300 rounded w-full text-black mb-2"
                >
                    <option value="">Selecione uma Categoria</option>
                    {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.categoria}
                        </option>
                    ))}
                </select>
                <button type="submit" className="mt-2 p-2 bg-blue-500 text-white rounded w-full">
                    Cadastrar
                </button>
            </form>
            {Object.keys(produtos).map((category) => (
                <div key={category}>
                    <h3 className="text-xl font-bold mb-2">{category}</h3>
                    <ul className="list-disc pl-5">
                        {produtos[category].map((prod, index) => (
                            <li key={prod.id} className="flex justify-between items-center mb-2">
                                {prod.name} - R$ {prod.price}
                                <div>
                                    <button onClick={() => handleEditProduto(category, index)} className="mr-2">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteProduto(category, prod.id)}>
                                        <FaTrash />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default ProdutoCadastro;

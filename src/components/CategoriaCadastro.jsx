import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const CategoriaCadastro = () => {
    const { token } = useAuth();
    const [categoria, setCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);
    const [message, setMessage] = useState('');

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

    const handleAddCategoria = async () => {
        if (categoria.trim()) {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `${token}`
                },
                body: JSON.stringify({ categoria, id_loja: 1 })
            };

            try {
                const response = await fetch('http://localhost:8080/api/categorias/cadastrar', options);
                const data = await response.json();
                if (data.success) {
                    setCategorias([...categorias, { id: data.id, categoria }]);
                    setCategoria('');
                    setMessage(data.message);
                } else {
                    console.error('Error adding category:', data.message);
                }
            } catch (error) {
                console.error('Error adding category:', error);
            }
        }
    };

    const handleDeleteCategoria = async (id) => {
        const options = {
            method: 'DELETE',
            headers: {
                authorization: `${token}`
            }
        };

        try {
            const response = await fetch(`http://localhost:8080/api/categorias/${id}`, options);
            const data = await response.json();
            if (data.success) {
                setCategorias((prevCategorias) => prevCategorias.filter(cat => cat.id !== id));
            } else {
                console.error('Error deleting category:', data.message);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleEditCategoria = (index) => {
        const newCategoria = prompt('Edit Category', categorias[index].categoria);
        if (newCategoria) {
            const newCategorias = categorias.map((cat, i) => (i === index ? { ...cat, categoria: newCategoria } : cat));
            setCategorias(newCategorias);
        }
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAddCategoria();
                    }}
                    className="space-y-4"
                >
                    <input
                        type="text"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Nome da Categoria"
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                    <button type="submit" className="w-full p-2 rounded bg-blue-600 text-white font-bold">
                        Cadastrar
                    </button>
                </form>
                {message && <p className="mt-4 text-green-500">{message}</p>}
            </div>
            <div className="w-full">
                <hr className="my-8 border-gray-700" />
                <h3 className="text-xl font-bold mb-4 text-center">Lista de Categorias</h3>
                <table className="min-w-full bg-gray-800 text-white text-center">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-700">Categoria</th>
                            <th className="py-2 px-4 border-b border-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.map((cat, index) => (
                            <tr key={cat.id}>
                                <td className="py-2 px-4 border-b border-gray-700">{cat.categoria}</td>
                                <td className="py-2 px-4 border-b border-gray-700">
                                    <button onClick={() => handleEditCategoria(index)} className="mr-2">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteCategoria(cat.id)}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default CategoriaCadastro;

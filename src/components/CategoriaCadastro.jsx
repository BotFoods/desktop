import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../services/AuthContext';

const CategoriaCadastro = () => {
    const { token } = useAuth();
    const [categoria, setCategoria] = useState('');
    const [categorias, setCategorias] = useState([]);

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
                } else {
                    console.error('Error adding category:', data.message);
                }
            } catch (error) {
                console.error('Error adding category:', error);
            }
        }
    };

    const handleDeleteCategoria = (index) => {
        const newCategorias = categorias.filter((_, i) => i !== index);
        setCategorias(newCategorias);
    };

    const handleEditCategoria = (index) => {
        const newCategoria = prompt('Edit Category', categorias[index].categoria);
        if (newCategoria) {
            const newCategorias = categorias.map((cat, i) => (i === index ? { ...cat, categoria: newCategoria } : cat));
            setCategorias(newCategorias);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleAddCategoria();
                }}
                className="mb-4"
            >
                <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Nome da Categoria"
                    className="p-2 border border-gray-300 rounded w-full text-black"
                />
                <button type="submit" className="mt-2 p-2 bg-blue-500 text-white rounded w-full">
                    Cadastrar
                </button>
            </form>
            <ul className="list-disc pl-5">
                {categorias.map((cat, index) => (
                    <li key={cat.id} className="flex justify-between items-center mb-2">
                        {cat.categoria}
                        <div>
                            <button onClick={() => handleEditCategoria(index)} className="mr-2">
                                <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteCategoria(index)}>
                                <FaTrash />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CategoriaCadastro;

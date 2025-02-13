import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import Header from '../components/Header';
import CategoriaCadastro from '../components/CategoriaCadastro';
import ProdutoCadastro from '../components/ProdutoCadastro';

const Cadastros = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [products, setProducts] = useState({});

    useEffect(() => {
        fetch('https://jsonplaceholder.typicode.com/users')
            .then(response => response.json())
            .then(data => setUsers(data));
    }, []);

    const categories = Object.keys(products);

    const renderContent = () => {
        switch (selectedCategory) {
            case 'Categorias':
                return <CategoriaCadastro />;
            case 'Produtos':
                return <ProdutoCadastro />;
            case 'Pessoas':
                return <div>Pessoas Content</div>;
            default:
                return <div>Selecione uma categoria</div>;
        }
    };

    return (
        <div className="bg-gray-900 text-white flex flex-col">
            <Header categories={categories} onSelectCategory={setSelectedCategory} />
            <div className="flex-grow flex">
                <div className="ml-64 pt-16 p-4 flex-grow flex">
                    <div className="w-full flex flex-col items-center justify-center">
                        <h1 className="text-3xl font-bold mb-4">Cadastros</h1>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cadastros;
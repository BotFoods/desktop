import { useState } from 'react';
import Header from '../components/Header';
import CategoriaCadastro from '../components/CategoriaCadastro';
import ProdutoCadastro from '../components/ProdutoCadastro';
import PessoaCadastro from '../components/PessoaCadastro';
import FuncaoCadastro from '../components/FuncaoCadastro';
import { FaBox, FaTags, FaUsers, FaUserTie } from 'react-icons/fa';
import InformarcoesRodape from '../components/InformacoesRodape';

const Cadastros = () => {
    const [selectedCategory, setSelectedCategory] = useState('Produtos');
    const [products] = useState({});

    const categories = Object.keys(products);

    const renderContent = () => {
        switch (selectedCategory) {
            case 'Categorias':
                return <CategoriaCadastro />;
            case 'Produtos':
                return <ProdutoCadastro />;
            case 'Pessoas':
                return <PessoaCadastro />;
            case 'Funcoes':
                return <FuncaoCadastro />;
            default:
                return <ProdutoCadastro />;
        }
    };

    const renderTitle = () => {
        switch (selectedCategory) {
            case 'Categorias':
                return 'Cadastrar Categorias';
            case 'Produtos':
                return 'Cadastrar Produtos';
            case 'Pessoas':
                return 'Cadastrar Pessoas';
            case 'Funcoes':
                return 'Cadastrar Funções';
            default:
                return '';
        }
    };

    // Função para determinar a largura máxima do container com base na categoria
    const getContainerWidth = () => {
        switch (selectedCategory) {
            case 'Produtos':
                return 'max-w-6xl'; // Container mais largo para produtos
            default:
                return 'max-w-4xl'; // Largura padrão para outras categorias
        }
    };

    return (
        <div className="bg-gray-900 text-white flex flex-col min-h-screen">
            <Header categories={categories} onSelectCategory={setSelectedCategory} />
            <div className="flex-grow flex">
                {/* Sidebar de Cadastros */}
                <div className="fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-gray-300 overflow-y-auto">
                    <nav className="p-4">
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Cadastros
                        </h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setSelectedCategory('Produtos')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    selectedCategory === 'Produtos' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaBox />
                                <span>Produtos</span>
                            </button>
                            <button 
                                onClick={() => setSelectedCategory('Categorias')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    selectedCategory === 'Categorias' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaTags />
                                <span>Categorias</span>
                            </button>
                            <button 
                                onClick={() => setSelectedCategory('Pessoas')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    selectedCategory === 'Pessoas' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaUsers />
                                <span>Pessoas</span>
                            </button>
                            <button 
                                onClick={() => setSelectedCategory('Funcoes')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    selectedCategory === 'Funcoes' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaUserTie />
                                <span>Funções</span>
                            </button>
                        </div>
                    </nav>

                    {/* Informações de Suporte no Rodapé */}
                    <InformarcoesRodape />
                </div>

                <div className="ml-64 pt-20 p-6 flex-grow flex">
                    <div className="w-full flex flex-col items-center justify-start">
                        <div className={`w-full ${getContainerWidth()} bg-gray-800 p-8 rounded-lg shadow-xl`}>
                            <h1 className="text-3xl font-bold mb-8 text-center">{renderTitle()}</h1>
                            <div className="mt-4">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cadastros;
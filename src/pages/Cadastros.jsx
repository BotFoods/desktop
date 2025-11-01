import { useState, useEffect } from 'react';
import Header from '../components/Header';
import CategoriaCadastro from '../components/CategoriaCadastro';
import ProdutoCadastro from '../components/ProdutoCadastro';
import PessoaCadastro from '../components/PessoaCadastro';
import FuncaoCadastro from '../components/FuncaoCadastro';
import { FaBox, FaTags, FaUsers, FaUserTie } from 'react-icons/fa';
import InformarcoesRodape from '../components/InformacoesRodape';
import usePermissions from '../hooks/usePermissions';
import AccessDeniedPage from '../components/AccessDeniedPage';
import LoadingSpinner from '../components/LoadingSpinner';

const Cadastros = () => {
    const { hasPermission, loading: permissoesLoading } = usePermissions();
    const [selectedCategory, setSelectedCategory] = useState('Produtos');
    const [products] = useState({});

    const categories = Object.keys(products);

    // Verificar quais permissões o usuário tem
    const temProdutos = hasPermission('produtos');
    const temCategorias = hasPermission('categorias');
    const temClientes = hasPermission('clientes');
    const temUsuarios = hasPermission('usuarios');

    // Lista de cadastros disponíveis com suas permissões
    const cadastrosDisponiveis = [
        { nome: 'Produtos', permissao: temProdutos },
        { nome: 'Categorias', permissao: temCategorias },
        { nome: 'Pessoas', permissao: temClientes },
        { nome: 'Funcoes', permissao: temUsuarios }
    ].filter(c => c.permissao);

    // Se não tiver nenhuma permissão de cadastro, bloquear acesso
    const temAlgumaPermissao = temProdutos || temCategorias || temClientes || temUsuarios;

    // Ajustar categoria selecionada para a primeira disponível
    useEffect(() => {
        if (!permissoesLoading && temAlgumaPermissao) {
            // Verificar se a categoria atual está disponível
            const categoriaAtualDisponivel = 
                (selectedCategory === 'Produtos' && temProdutos) ||
                (selectedCategory === 'Categorias' && temCategorias) ||
                (selectedCategory === 'Pessoas' && temClientes) ||
                (selectedCategory === 'Funcoes' && temUsuarios);

            // Se não estiver disponível, selecionar a primeira que estiver
            if (!categoriaAtualDisponivel) {
                if (temProdutos) setSelectedCategory('Produtos');
                else if (temCategorias) setSelectedCategory('Categorias');
                else if (temClientes) setSelectedCategory('Pessoas');
                else if (temUsuarios) setSelectedCategory('Funcoes');
            }
        }
    }, [permissoesLoading, temProdutos, temCategorias, temClientes, temUsuarios, selectedCategory, temAlgumaPermissao]);

    const renderContent = () => {
        switch (selectedCategory) {
            case 'Categorias':
                return temCategorias ? <CategoriaCadastro /> : <AccessDeniedPage />;
            case 'Produtos':
                return temProdutos ? <ProdutoCadastro /> : <AccessDeniedPage />;
            case 'Pessoas':
                return temClientes ? <PessoaCadastro /> : <AccessDeniedPage />;
            case 'Funcoes':
                return temUsuarios ? <FuncaoCadastro /> : <AccessDeniedPage />;
            default:
                // Redirecionar para o primeiro cadastro disponível
                if (temProdutos) return <ProdutoCadastro />;
                if (temCategorias) return <CategoriaCadastro />;
                if (temClientes) return <PessoaCadastro />;
                if (temUsuarios) return <FuncaoCadastro />;
                return <AccessDeniedPage />;
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

    // Verificar permissões primeiro
    if (permissoesLoading) {
        return (
            <div className="bg-gray-900 text-white flex flex-col min-h-screen">
                <LoadingSpinner 
                    fullScreen={true}
                    size="xl"
                    message="Verificando permissões..."
                />
            </div>
        );
    }

    // Bloquear acesso se não tiver nenhuma permissão de cadastro
    if (!temAlgumaPermissao) {
        return <AccessDeniedPage />;
    }

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
                            {temProdutos && (
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
                            )}
                            {temCategorias && (
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
                            )}
                            {temClientes && (
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
                            )}
                            {temUsuarios && (
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
                            )}
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
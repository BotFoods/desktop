import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';
import PrinterManager from '../components/printer/PrinterManager';
import StatusAssinatura from '../components/StatusAssinatura';
import WhatsAppController from '../components/WhatsAppController';
import { 
    FaWhatsapp, FaPhone, FaEdit, FaLink, FaUnlink, 
    FaCog, FaPrint, FaCreditCard, FaUser, 
    FaStore, FaReceipt, FaTags, FaDatabase, FaStripe, FaKey
} from 'react-icons/fa';
import InformarcoesRodape from '../components/InformacoesRodape';
import PermissoesCadastro from '../components/PermissoesCadastro';
import usePermissions from '../hooks/usePermissions';

const Configuracoes = () => {
    const [statusMessage, setStatusMessage] = useState(null);
    const [editablePhoneNumber, setEditablePhoneNumber] = useState('');
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [activeSection, setActiveSection] = useState('whatsapp');
    const { token, user } = useAuth();
    const { isOwner } = usePermissions();
    const navigate = useNavigate();
    
    // Função para exibir mensagens
    const showMessage = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };
    
    useEffect(() => {
        // Inicializa o número de telefone editável com o número atual do usuário
        setEditablePhoneNumber(user?.contato_loja || '');
    }, [user]);

    // Função para renderizar o conteúdo com base na seção ativa
    const renderContent = () => {
        switch (activeSection) {
            case 'whatsapp':
                return (
                    <div className="w-full max-w-2xl">
                        <div className="mb-6 text-center">
                            <h1 className="text-3xl font-bold text-white flex items-center justify-center mb-2">
                                <FaWhatsapp className="mr-3 text-green-500" />
                                WhatsApp Business
                            </h1>
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                                <FaCog className="text-blue-400" />
                                <span>Controlado via Service Electron</span>
                            </div>
                        </div>
                        
                        <WhatsAppController showMessage={showMessage} />
                        
                        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                            <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                                <FaCog className="mr-2" />
                                Recursos do WhatsApp
                            </h3>
                            <ul className="text-sm text-blue-200 space-y-1">
                                <li>• <strong>Conectar:</strong> Inicia uma nova conexão com o WhatsApp</li>
                                <li>• <strong>Desconectar:</strong> Finaliza a conexão mas mantém a sessão</li>
                                <li>• <strong>Limpar Sessão:</strong> Remove sessão salva (requer novo QR Code)</li>
                                <li>• <strong>QR Code:</strong> Aparece automaticamente quando necessário</li>
                                <li>• <strong>Status:</strong> Atualizado automaticamente a cada 3 segundos</li>
                                <li>• <strong>Service:</strong> Funciona em localhost:3000 (deve estar rodando)</li>
                            </ul>
                        </div>
                    </div>
                );
            
            case 'impressora':
                return <PrinterManager showMessage={showMessage} />;
            
            case 'pagamento':
                return (
                    <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h1 className="text-3xl font-bold mb-4 text-center text-white flex items-center justify-center">
                            <FaCreditCard className="mr-2 text-yellow-500" />
                            Métodos de Pagamento
                        </h1>
                        
                        <p className="text-gray-400 text-center mb-8">
                            Configure os métodos de pagamento disponíveis no PDV.
                        </p>

                        {/* Status da Assinatura */}
                        <div className="mb-8">
                            <StatusAssinatura />
                        </div>

                        {/* Configuração de Pagamento Online - Stripe */}
                        <div className="mb-8 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                            <div className="flex items-center mb-3">
                                <FaStripe className="mr-2 text-white text-xl" />
                                <h3 className="text-white font-semibold">Gestão de Assinatura</h3>
                            </div>
                            <p className="text-white text-sm mb-4 opacity-90">
                                Configure seu método de pagamento para a assinatura do BotFood e gerencie seus dados de cobrança.
                            </p>
                            <button 
                                onClick={() => navigate('/configuracao-pagamento')}
                                className="w-full bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-150 ease-in-out flex items-center justify-center"
                            >
                                <FaCreditCard className="mr-2" />
                                Gerenciar Assinatura e Pagamento
                            </button>
                        </div>

                        {/* Separador */}
                        <div className="border-t border-gray-600 mb-6 pt-6">
                            <h3 className="text-white font-semibold mb-4 text-center">Métodos do PDV Local</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="credito" className="mr-3 h-5 w-5" defaultChecked />
                                <label htmlFor="credito" className="text-white flex-grow">Cartão de Crédito</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="debito" className="mr-3 h-5 w-5" defaultChecked />
                                <label htmlFor="debito" className="text-white flex-grow">Cartão de Débito</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="pix" className="mr-3 h-5 w-5" defaultChecked />
                                <label htmlFor="pix" className="text-white flex-grow">PIX</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="dinheiro" className="mr-3 h-5 w-5" defaultChecked />
                                <label htmlFor="dinheiro" className="text-white flex-grow">Dinheiro</label>
                            </div>
                        </div>
                        
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition duration-150 ease-in-out">
                            Salvar Configurações
                        </button>
                    </div>
                );

            case 'perfil':
                return (
                    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h1 className="text-3xl font-bold mb-4 text-center text-white flex items-center justify-center">
                            <FaUser className="mr-2 text-purple-500" />
                            Perfil do Usuário
                        </h1>
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-4xl">
                                <FaUser />
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome
                            </label>
                            <input
                                type="text"
                                value={user?.nome || ''}
                                className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                readOnly
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                readOnly
                            />
                        </div>
                        
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded transition duration-150 ease-in-out">
                            Alterar Senha
                        </button>
                    </div>
                );
            
            case 'permissoes':
                return <PermissoesCadastro />;
            
            default:
                return (
                    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h1 className="text-3xl font-bold mb-4 text-center text-white">
                            Selecione uma opção
                        </h1>
                        <p className="text-gray-400 text-center">
                            Por favor, escolha uma das opções no menu lateral para configurar o sistema.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-900 text-white flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex">
                {/* Sidebar de Configurações */}
                <div className="fixed top-16 bottom-0 left-0 w-64 bg-gray-800 text-gray-300 overflow-y-auto">
                    <nav className="p-4">
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                            Configurações
                        </h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setActiveSection('whatsapp')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    activeSection === 'whatsapp' 
                                        ? 'bg-green-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaWhatsapp className="text-xl" />
                                <span>WhatsApp</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('impressora')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    activeSection === 'impressora' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaPrint className="text-xl" />
                                <span>Impressora</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('pagamento')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    activeSection === 'pagamento' 
                                        ? 'bg-yellow-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaCreditCard className="text-xl" />
                                <span>Formas de Pagamento</span>
                            </button>
                        </div>
                        
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6 mb-4">
                            Sistema
                        </h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setActiveSection('perfil')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    activeSection === 'perfil' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <FaUser className="text-xl" />
                                <span>Perfil</span>
                            </button>
                            {isOwner && (
                                <button 
                                    onClick={() => setActiveSection('permissoes')}
                                    className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                        activeSection === 'permissoes' 
                                            ? 'bg-orange-600 text-white' 
                                            : 'hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    <FaKey className="text-xl" />
                                    <span>Permissões</span>
                                </button>
                            )}
                            <button 
                                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <FaStore className="text-xl" />
                                <span>Dados da Loja</span>
                            </button>
                            <button 
                                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <FaReceipt className="text-xl" />
                                <span>Cupom Fiscal</span>
                            </button>
                        </div>
                        
                        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6 mb-4">
                            Avançado
                        </h3>
                        <div className="space-y-2">
                            <button 
                                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <FaTags className="text-xl" />
                                <span>Etiquetas</span>
                            </button>
                            <button 
                                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <FaDatabase className="text-xl" />
                                <span>Backup</span>
                            </button>
                            <button 
                                className="flex items-center w-full space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-700 hover:text-white"
                            >
                                <FaCog className="text-xl" />
                                <span>PDV Avançado</span>
                            </button>
                        </div>
                    </nav>
                    
                    {/* Informações de Suporte no Rodapé */}
                    <InformarcoesRodape />
                </div>
                
                <div className="ml-64 pt-20 p-6 flex-grow flex items-start justify-center">
                    {renderContent()}
                </div>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
                    statusMessage.type === 'success' ? 'bg-green-500 text-white' :
                    statusMessage.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }`}>
                    {statusMessage.message}
                </div>
            )}
        </div>
    );
};

export default Configuracoes;

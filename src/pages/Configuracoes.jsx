import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import Header from '../components/Header';
import { useAuth } from '../services/AuthContext';
import PrinterManager from '../components/printer/PrinterManager';
import StatusAssinatura from '../components/StatusAssinatura';
import WhatsAppManagerV2 from '../components/WhatsAppManagerV2';
import { 
    FaWhatsapp, FaPhone, FaEdit, FaLink, FaUnlink, 
    FaCog, FaPrint, FaCreditCard, FaUser, 
    FaStore, FaReceipt, FaTags, FaDatabase, FaStripe, FaKey, FaRocket
} from 'react-icons/fa';
import InformarcoesRodape from '../components/InformacoesRodape';
import PermissoesCadastro from '../components/PermissoesCadastro';
import usePermissions from '../hooks/usePermissions';

// Helper function to format phone number for API calls
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters and add +55 prefix if not already present
    phone = phone.replace(/\D/g, '');
    if (phone.length === 11 && !phone.startsWith('55')) {
        phone = '55' + phone; // Add country code if missing
    }
    // Ensure the phone number is in the format expected by the API
    if (phone.length < 10 || phone.length > 15) {
        console.warn('Número de telefone inválido:', phone);
        return '';
    }
    // Return the phone number with only digits
    return phone.replace(/\D/g, '');
};

const Configuracoes = () => {
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [editablePhoneNumber, setEditablePhoneNumber] = useState('');
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [activeSection, setActiveSection] = useState('whatsapp');
    const { token, user } = useAuth();
    const { isOwner } = usePermissions();
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const socket = io(API_BASE_URL);
    
    const WHATSAPP_STORAGE_KEY = 'whatsapp_config';

    const [whatsappConfig] = useState(() => {
        const config_salvo = localStorage.getItem(WHATSAPP_STORAGE_KEY);
        
        const defaultConfig = {
            phoneNumber: user?.contato_loja || '',
            isConnected: false,
            lastConnectionStatus: null,
            lastQrCodeId: null,
        };
        
        if (config_salvo) {
            try {
                return JSON.parse(config_salvo);
            } catch (e) {
                console.error("Erro ao carregar configuração do WhatsApp do localStorage, usando estado padrão:", e);
                return defaultConfig;
            }
        }
        return defaultConfig;
    });
    
    useEffect(() => {
        // Inicializa o número de telefone editável com o número atual do usuário
        setEditablePhoneNumber(user?.contato_loja || '');
    }, [user]);
    
    useEffect(() => {
        // Salvar configuração no localStorage sempre que mudar
        localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(whatsappConfig));
    }, [whatsappConfig]);

    useEffect(() => {
        const formattedPhoneNumber = formatPhoneNumber(user?.contato_loja);
        if (!formattedPhoneNumber) return;

        const qrCodeEvent = `qr_code_${formattedPhoneNumber}`;
        const statusEvent = `status_${formattedPhoneNumber}`;

        const handleQrCode = (data) => {
            setQrCode(data.qrCodeImage);
            setStatusMessage(null);
            setLoading(false);
        };

        const handleStatus = (data) => {
            setQrCode(null);
            setStatusMessage({ type: data.status === 'ready' ? 'success' : 'info', text: data.message });
            setLoading(false);
        };

        socket.on(qrCodeEvent, handleQrCode);
        socket.on(statusEvent, handleStatus);

        return () => {
            socket.off(qrCodeEvent, handleQrCode);
            socket.off(statusEvent, handleStatus);
        };
    }, [user, socket]);


    const handleConnect = async () => {
        setLoading(true);
        setStatusMessage({ type: 'info', text: 'Iniciando conexão... Aguardando QR Code.' });
        setQrCode(null);
        const formattedPhoneNumber = formatPhoneNumber(user.contato_loja);
        try {
            const startOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: formattedPhoneNumber }),
            };

            const startResponse = await fetch(`${API_BASE_URL}/api/start`, startOptions);
            const startData = await startResponse.json();

            if (startData.status === 'already_started' || startData.status === 'ready') {
                setQrCode(null);
                setStatusMessage({ type: 'success', text: 'Você já está conectado.' });
                setLoading(false);
            } else if (!startResponse.ok) {
                setStatusMessage({ type: 'error', text: startData.message || 'Erro ao iniciar conexão.' });
                setLoading(false);
            }
            // Não fazemos mais nada aqui, o useEffect cuidará do QR Code
        } catch (error) {
            console.error('Error during connection:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao iniciar conexão.' });
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        setStatusMessage(null); 
        const formattedPhoneNumber = formatPhoneNumber(user.contato_loja);
        try {
            const stopOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ id: formattedPhoneNumber }),
            };

            const stopResponse = await fetch(`${API_BASE_URL}/api/stop`, stopOptions);
            if (stopResponse.ok) {
                setQrCode(null);
                setStatusMessage({ type: 'success', text: 'Desconectado com sucesso.' });
            } else {
                console.error('Erro ao desconectar');
                setStatusMessage({ type: 'error', text: 'Você já foi desconectado.' });
            }
        } catch (error) {
            console.error('Error during disconnection:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao desconectar.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeWhatsApp = async (newNumber) => {
        setLoading(true);
        setStatusMessage(null);
        const formattedPhoneNumber = formatPhoneNumber(newNumber);
        try {
            const changeOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
                credentials: 'include',
                body: JSON.stringify({ newNumber: formattedPhoneNumber }),
            };

            const changeResponse = await fetch(`${API_BASE_URL}/api/change-number`, changeOptions);
            const responseData = await changeResponse.json();
            
            if (changeResponse.ok && responseData.success) {
                setStatusMessage({ type: 'success', text: responseData.message || 'Número do WhatsApp alterado com sucesso.' });
                setIsEditingPhoneNumber(false);
                
                // Atualizar o estado local do usuário com o novo número
                if (user) {
                    user.contato_loja = formattedPhoneNumber;
                    setEditablePhoneNumber(formattedPhoneNumber);
                }
            } else {
                console.error('Erro ao alterar número do WhatsApp:', responseData);
                setStatusMessage({ type: 'error', text: responseData.message || 'Erro ao alterar número do WhatsApp. Tente novamente.' });
            }
        } catch (error) {
            console.error('Error during WhatsApp number change:', error);
            setStatusMessage({ type: 'error', text: 'Erro ao alterar número do WhatsApp. Verifique sua conexão e tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditPhoneNumber = () => {
        setEditablePhoneNumber(user.contato_loja || ''); // Reset to current official number
        setIsEditingPhoneNumber(true);
        setStatusMessage(null);
    };

    const handleSavePhoneNumber = () => {
        handleChangeWhatsApp(editablePhoneNumber);
    };

    const handleCancelEditPhoneNumber = () => {
        setIsEditingPhoneNumber(false);
        setEditablePhoneNumber(user.contato_loja || ''); // Revert to original
        setStatusMessage(null);
    };

    // Função para renderizar o conteúdo com base na seção ativa
    const renderContent = () => {
        switch (activeSection) {
            case 'whatsapp':
                return (
                    <div className="w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h1 className="text-3xl font-bold mb-4 text-center text-white flex items-center justify-center">
                            <FaWhatsapp className="mr-2 text-green-500" />
                            Atendimento no WhatsApp
                        </h1>
                        
                        <p className="text-gray-400 text-center mb-8">
                            Este é o número de WhatsApp associado à sua loja para a integração com o sistema de mensagens.
                        </p>
                        
                        <div className="mb-8 bg-gray-700 p-5 rounded-lg">
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Número do WhatsApp
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={editablePhoneNumber}
                                        onChange={(e) => setEditablePhoneNumber(e.target.value)}
                                        className={`p-3 pl-10 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${!isEditingPhoneNumber ? 'disabled:opacity-70' : ''}`}
                                        placeholder="Número do WhatsApp"
                                        disabled={!isEditingPhoneNumber || loading}
                                    />
                                </div>
                            </div>
                            
                            {!isEditingPhoneNumber ? (
                                <button
                                    onClick={handleEditPhoneNumber}
                                    className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out mb-2 ${loading || isEditingPhoneNumber
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    disabled={loading || isEditingPhoneNumber}
                                >
                                    <span className="flex items-center justify-center">
                                        <FaEdit className="mr-2" />
                                        Alterar Número
                                    </span>
                                </button>
                            ) : (
                                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center mb-2">
                                    <button
                                        onClick={handleSavePhoneNumber}
                                        className={`text-white font-bold py-3 px-6 rounded w-full sm:w-auto transition duration-150 ease-in-out ${loading
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Salvando...
                                            </span>
                                        ) : 'Salvar Alterações'}
                                    </button>
                                    <button
                                        onClick={handleCancelEditPhoneNumber}
                                        className={`text-gray-300 font-bold py-3 px-6 rounded w-full sm:w-auto transition duration-150 ease-in-out bg-gray-600 hover:bg-gray-700`}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col space-y-4 mb-8">
                            <button
                                onClick={handleConnect}
                                className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out ${loading || isEditingPhoneNumber
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={loading || isEditingPhoneNumber}
                            >
                                {loading && qrCode === null && !statusMessage && !isEditingPhoneNumber ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Conectando...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <FaLink className="mr-2" />
                                        Conectar
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={handleDisconnect}
                                className={`text-white font-bold py-3 px-6 rounded w-full transition duration-150 ease-in-out ${loading || isEditingPhoneNumber
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                disabled={loading || isEditingPhoneNumber}
                            >
                                {loading && statusMessage?.text?.includes('Desconectado') && !isEditingPhoneNumber ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Desconectando...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <FaUnlink className="mr-2" />
                                        Desconectar
                                    </span>
                                )}
                            </button>
                        </div>

                        {statusMessage && (
                            <div
                                className={`mt-4 mb-4 p-3 rounded-lg text-center transition-all duration-300 ${
                                    statusMessage.type === 'success' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                            >
                                {statusMessage.text}
                            </div>
                        )}

                        {loading && !qrCode && !statusMessage && (
                            <div className="flex justify-center items-center py-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {qrCode && !loading && (
                            <div className="mt-6 flex flex-col items-center bg-white p-4 rounded-lg">
                                <h2 className="text-xl font-bold mb-2 text-gray-800">Escaneie o QR Code</h2>
                                <p className="text-gray-600 mb-4 text-sm text-center">Abra o WhatsApp no seu celular e escaneie este QR Code para conectar</p>
                                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                            </div>
                        )}
                        
                        {whatsappConfig.isConnected && (
                            <div className="mt-4 p-3 bg-green-500/20 text-green-300 rounded-lg text-center">
                                Atualmente conectado a {whatsappConfig.phoneNumber}
                            </div>
                        )}
                    </div>
                );
            
            case 'whatsapp-v2':
                return (
                    <div className="w-full max-w-2xl">
                        <div className="mb-6 text-center">
                            <h1 className="text-3xl font-bold text-white flex items-center justify-center mb-2">
                                <FaWhatsapp className="mr-3 text-green-500" />
                                WhatsApp Business v2
                            </h1>
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                                <FaRocket className="text-yellow-400" />
                                <span>Nova Arquitetura Isolada</span>
                            </div>
                        </div>
                        
                        <WhatsAppManagerV2 />
                        
                        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                            <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                                <FaRocket className="mr-2" />
                                Melhorias da v2
                            </h3>
                            <ul className="text-sm text-blue-200 space-y-1">
                                <li>• Arquitetura isolada e mais estável</li>
                                <li>• Provisionamento automático por loja</li>
                                <li>• Monitoramento em tempo real</li>
                                <li>• Maior confiabilidade</li>
                                <li>• Suporte a múltiplas instâncias</li>
                            </ul>
                        </div>
                    </div>
                );
            
            case 'impressora':
                return <PrinterManager />;
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
                                <input type="checkbox" id="credito" className="mr-3 h-5 w-5" checked />
                                <label htmlFor="credito" className="text-white flex-grow">Cartão de Crédito</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="debito" className="mr-3 h-5 w-5" checked />
                                <label htmlFor="debito" className="text-white flex-grow">Cartão de Débito</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="pix" className="mr-3 h-5 w-5" checked />
                                <label htmlFor="pix" className="text-white flex-grow">PIX</label>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                                <input type="checkbox" id="dinheiro" className="mr-3 h-5 w-5" checked />
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
                                <span>WhatsApp (Legado)</span>
                            </button>
                            <button 
                                onClick={() => setActiveSection('whatsapp-v2')}
                                className={`flex items-center w-full space-x-3 p-3 rounded-lg transition-colors ${
                                    activeSection === 'whatsapp-v2' 
                                        ? 'bg-green-600 text-white' 
                                        : 'hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                <div className="relative">
                                    <FaWhatsapp className="text-xl" />
                                    <FaRocket className="absolute -top-1 -right-1 text-xs text-yellow-400" />
                                </div>
                                <span>WhatsApp v2</span>
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
                            {isOwner() && (
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
        </div>
    );
};

export default Configuracoes;

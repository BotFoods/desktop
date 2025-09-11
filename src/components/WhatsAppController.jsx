import React, { useState, useEffect } from 'react';
import { 
    FaWhatsapp, 
    FaQrcode, 
    FaPlay, 
    FaStop, 
    FaSync, 
    FaTrash,
    FaWifi,
    FaTimes,
    FaExclamationTriangle,
    FaCheckCircle,
    FaPause,
    FaRobot,
    FaBan
} from 'react-icons/fa';
import useWhatsApp from '../hooks/useWhatsApp';
import ConfirmModal from './ConfirmModal';
import { useAuth } from '../services/AuthContext';

const WhatsAppController = ({ showMessage }) => {
    const { user } = useAuth();
    const [showClearModal, setShowClearModal] = useState(false);
    const [operationState, setOperationState] = useState('idle'); // idle, connecting, generating_qr, clearing_session
    const [refreshLoading, setRefreshLoading] = useState(false); // Loading específico para o botão refresh
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [autoReplyStats, setAutoReplyStats] = useState({
        messagesSent: 0,
        lastMessageTime: null,
        loja_id: null,
        isConnected: false
    });
    
    const {
        status,
        loading,
        error,
        serviceAvailable,
        connect,
        disconnect,
        clearSession,
        configureAutoReply,
        getAutoReplyStats,
        refreshStatus,
        clearError,
        isConnected,
        hasQRCode,
        qrCode,
        state
    } = useWhatsApp();

    // Monitor state changes to reset operation state and show appropriate messages
    useEffect(() => {
        if (operationState === 'generating_qr') {
            if (state === 'qr_ready' && hasQRCode) {
                showMessage?.('QR Code gerado! Escaneie com seu WhatsApp', 'success');
                setOperationState('idle');
            } else if (state === 'connected') {
                showMessage?.('WhatsApp conectado com sucesso!', 'success');
                setOperationState('idle');
            }
        }
    }, [state, hasQRCode, operationState, showMessage]);

    // Load auto-reply stats on mount and when connected
    useEffect(() => {
        const loadAutoReplyStats = async () => {
            if (isConnected) {
                const result = await getAutoReplyStats();
                if (result.success) {
                    setAutoReplyStats(result.stats);
                    setAutoReplyEnabled(result.stats.autoReplyEnabled || false);
                }
            }
        };

        loadAutoReplyStats();
        
        // Refresh stats every 30 seconds if connected
        const interval = setInterval(() => {
            if (isConnected) {
                loadAutoReplyStats();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isConnected, getAutoReplyStats]);

    const handleConnect = async () => {
        if (!user?.loja_id) {
            showMessage?.('Erro: ID da loja não encontrado', 'error');
            return;
        }

        setOperationState('connecting');
        showMessage?.('Iniciando conexão com WhatsApp...', 'info');
        
        const result = await connect(user.loja_id);
        
        if (result.success) {
            setOperationState('generating_qr');
            showMessage?.('Aguarde... Gerando QR Code', 'info');
        } else {
            showMessage?.(`Erro ao conectar: ${result.error}`, 'error');
            setOperationState('idle');
        }
    };

    const handleDisconnect = async () => {
        if (!user?.loja_id) {
            showMessage?.('Erro: ID da loja não encontrado', 'error');
            return;
        }

        setOperationState('disconnecting');
        showMessage?.('Desconectando WhatsApp...', 'info');
        
        const result = await disconnect(user.loja_id);
        if (result.success) {
            showMessage?.('WhatsApp desconectado com sucesso', 'success');
        } else {
            showMessage?.(`Erro ao desconectar: ${result.error}`, 'error');
        }
        setOperationState('idle');
    };

    const handleClearSession = async () => {
        setShowClearModal(true);
    };

    const confirmClearSession = async () => {
        if (!user?.loja_id) {
            showMessage?.('Erro: ID da loja não encontrado', 'error');
            return;
        }

        setOperationState('clearing_session');
        showMessage?.('Limpando sessão... Aguarde...', 'info');
        
        const result = await clearSession(user.loja_id);
        if (result.success) {
            showMessage?.('Sessão limpa com sucesso', 'success');
        } else {
            showMessage?.(`Erro ao limpar sessão: ${result.error}`, 'error');
        }
        setOperationState('idle');
    };

    const handleToggleAutoReply = async () => {
        if (!user?.loja_id) {
            showMessage?.('Erro: ID da loja não encontrado', 'error');
            return;
        }

        if (!isConnected) {
            showMessage?.('WhatsApp precisa estar conectado para configurar auto-resposta', 'warning');
            return;
        }

        const newStatus = !autoReplyEnabled;
        showMessage?.(`${newStatus ? 'Ativando' : 'Pausando'} robô...`, 'info');
        
        try {
            const result = await configureAutoReply(newStatus, user.loja_id);
            if (result.success) {
                setAutoReplyEnabled(newStatus);
                showMessage?.(`Robô ${newStatus ? 'ativado' : 'pausado'} com sucesso!`, 'success');
                
                // Atualizar stats mesmo com resultado bem-sucedido
                const statsResult = await getAutoReplyStats();
                if (statsResult.success) {
                    setAutoReplyStats(statsResult.stats);
                }
            } else {
                // Mesmo com erro na API, se a operação foi realizada, atualizar o estado
                // Isso resolve o problema de precisar atualizar a página
                showMessage?.(`Aviso: ${result.error}. Verificando status atual...`, 'warning');
                
                // Tentar obter o status atual para verificar se a operação funcionou
                const statsResult = await getAutoReplyStats();
                if (statsResult.success && statsResult.stats.autoReplyEnabled !== autoReplyEnabled) {
                    setAutoReplyEnabled(statsResult.stats.autoReplyEnabled);
                    setAutoReplyStats(statsResult.stats);
                    showMessage?.(`Robô ${statsResult.stats.autoReplyEnabled ? 'ativado' : 'pausado'} com sucesso!`, 'success');
                } else {
                    showMessage?.(`Erro ao configurar robô: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            showMessage?.(`Erro inesperado: ${error.message}`, 'error');
            
            // Tentar sincronizar o estado atual mesmo com erro
            try {
                const statsResult = await getAutoReplyStats();
                if (statsResult.success) {
                    setAutoReplyStats(statsResult.stats);
                    setAutoReplyEnabled(statsResult.stats.autoReplyEnabled);
                }
            } catch (syncError) {
                console.error('Erro ao sincronizar estado:', syncError);
            }
        }
    };

    // Função personalizada para refresh com loading local
    const handleRefresh = async () => {
        setRefreshLoading(true);
        clearError(); // Limpa erros anteriores quando o usuário tenta novamente
        try {
            await refreshStatus();
            // Só mostra mensagem se o serviço estiver disponível após refresh
            if (serviceAvailable) {
                showMessage?.('Status atualizado com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        } finally {
            setRefreshLoading(false);
        }
    };

    // Verifica se está em operação para desabilitar botões
    const isOperating = loading || operationState !== 'idle';

    // Mensagem de operação atual
    const getOperationMessage = () => {
        switch (operationState) {
            case 'connecting':
                return 'Conectando ao WhatsApp...';
            case 'generating_qr':
                return 'Gerando QR Code...';
            case 'clearing_session':
                return 'Limpando sessão...';
            case 'disconnecting':
                return 'Desconectando...';
            default:
                return null;
        }
    };

    const getStatusInfo = () => {
        switch (state) {
            case 'disconnected':
                return {
                    icon: FaTimes,
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/20',
                    borderColor: 'border-red-500/30',
                    text: 'Desconectado',
                    description: 'WhatsApp não está conectado'
                };
            case 'connecting':
                return {
                    icon: FaSync,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/20',
                    borderColor: 'border-yellow-500/30',
                    text: 'Conectando...',
                    description: 'Estabelecendo conexão'
                };
            case 'qr_ready':
                return {
                    icon: FaQrcode,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/20',
                    borderColor: 'border-blue-500/30',
                    text: 'QR Code Pronto',
                    description: 'Escaneie o QR Code com seu celular'
                };
            case 'connected':
                return {
                    icon: FaCheckCircle,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/20',
                    borderColor: 'border-green-500/30',
                    text: 'Conectado',
                    description: 'WhatsApp conectado e funcionando'
                };
            case 'service_offline':
                return {
                    icon: FaExclamationTriangle,
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-500/20',
                    borderColor: 'border-orange-500/30',
                    text: 'Serviço Offline',
                    description: 'Serviço WhatsApp não está rodando'
                };
            default:
                return {
                    icon: FaExclamationTriangle,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/20',
                    borderColor: 'border-gray-500/30',
                    text: 'Status Desconhecido',
                    description: state || 'Estado indefinido'
                };
        }
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    if (!serviceAvailable && !loading) {
        return (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center">
                    <FaExclamationTriangle className="text-orange-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Serviço Indisponível</h3>
                    <p className="text-gray-400 mb-4">
                        O serviço WhatsApp não está rodando. Inicie o serviço primeiro.
                    </p>
                    <button
                        onClick={refreshStatus}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        <FaSync className="inline mr-2" />
                        Verificar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white flex items-center">
                        <FaWhatsapp className="mr-3 text-green-500" />
                        Gerenciamento WhatsApp
                    </h2>
                    
                    {/* Botão condicional: discreto quando conectado, visível quando há problemas */}
                    {serviceAvailable ? (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshLoading}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Atualizar Status"
                        >
                            <FaSync className={`${refreshLoading ? 'animate-spin' : ''}`} />
                        </button>
                    ) : (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshLoading}
                            className={`px-4 py-2 rounded transition-colors flex items-center ${
                                refreshLoading 
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title="Verificar Novamente"
                        >
                            {refreshLoading ? (
                                <>
                                    <FaSync className="animate-spin mr-2" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <FaSync className="mr-2" />
                                    Verificar Novamente
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Indicador de Status do Serviço e Erros */}
                {(!serviceAvailable || error) && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center">
                        <FaExclamationTriangle className="text-red-400 mr-3 flex-shrink-0" />
                        <div>
                            {!serviceAvailable ? (
                                <>
                                    <p className="text-red-200 font-medium">Serviço Indisponível</p>
                                    <p className="text-red-300 text-sm">
                                        O serviço WhatsApp não está rodando. Inicie o serviço primeiro.
                                    </p>
                                    {/* Adiciona mensagem de erro específica se houver */}
                                    {error && (
                                        <p className="text-red-300 text-sm mt-2 pt-2 border-t border-red-500/20">
                                            <strong>Erro:</strong> {error}
                                        </p>
                                    )}
                                </>
                            ) : error ? (
                                <>
                                    <p className="text-red-200 font-medium">Erro de Conexão</p>
                                    <p className="text-red-300 text-sm">{error}</p>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Conteúdo principal - só mostra quando o serviço está disponível */}
                {serviceAvailable && (
                    <>
            {/* Status Card */}
            <div className={`p-6 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <StatusIcon className={`text-2xl ${statusInfo.color} mt-1`} />
                        <div>
                            <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                                {statusInfo.text}
                            </h3>
                            <p className="text-gray-300 text-sm">
                                {statusInfo.description}
                            </p>
                            {status.timestamp && (
                                <p className="text-gray-500 text-xs mt-1">
                                    Última atualização: {new Date(status.timestamp).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {isConnected && (
                        <div className="flex items-center space-x-2">
                            <FaWifi className="text-green-500" />
                            <span className="text-green-500 text-sm font-semibold">Online</span>
                        </div>
                    )}
                </div>

                {/* QR Code Section - Unified Display */}
                {(state === 'qr_ready' || operationState === 'generating_qr') && (
                    <div className="mt-6 text-center">
                        {hasQRCode && qrCode ? (
                            // QR Code Ready
                            <>
                                <div className="mb-4">
                                    <h4 className="text-white font-semibold mb-2">
                                        QR Code pronto!
                                    </h4>
                                    <p className="text-green-400 text-sm">
                                        Escaneie este código com seu WhatsApp
                                    </p>
                                </div>
                                <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                                    <img 
                                        src={qrCode} 
                                        alt="QR Code WhatsApp" 
                                        className="w-48 h-48 mx-auto"
                                        key={`qr-${Date.now()}`}
                                    />
                                </div>
                                <p className="text-gray-400 text-sm mt-4">
                                    Abra o WhatsApp no seu celular → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
                                </p>
                            </>
                        ) : (
                            // Generating QR Code
                            <div className="inline-flex items-center space-x-2 text-yellow-400">
                                <FaSync className="animate-spin" />
                                <span>Gerando QR Code... Aguarde</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
                        <FaExclamationTriangle className="inline mr-2" />
                        {error}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
                {state === 'disconnected' && (
                    <button
                        onClick={handleConnect}
                        disabled={isOperating}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {operationState === 'connecting' || operationState === 'generating_qr' ? (
                            <FaSync className="animate-spin" />
                        ) : (
                            <FaPlay />
                        )}
                        <span>
                            {operationState === 'connecting' ? 'Conectando...' : 
                             operationState === 'generating_qr' ? 'Gerando QR...' : 'Conectar'}
                        </span>
                    </button>
                )}

                {['connecting', 'qr_ready', 'connected'].includes(state) && (
                    <button
                        onClick={handleDisconnect}
                        disabled={isOperating}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {operationState === 'disconnecting' ? (
                            <FaSync className="animate-spin" />
                        ) : (
                            <FaStop />
                        )}
                        <span>{operationState === 'disconnecting' ? 'Desconectando...' : 'Desconectar'}</span>
                    </button>
                )}

                {/* Botão Auto-Reply apenas quando conectado */}
                {isConnected && (
                    <button
                        onClick={handleToggleAutoReply}
                        disabled={isOperating}
                        className={`flex items-center space-x-2 px-4 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            autoReplyEnabled 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {autoReplyEnabled ? <FaPause /> : <FaRobot />}
                        <span>
                            {autoReplyEnabled ? 'Pausar Robô' : 'Ativar Robô'}
                        </span>
                    </button>
                )}

                <button
                    onClick={handleClearSession}
                    disabled={isOperating}
                    className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {operationState === 'clearing_session' ? (
                        <FaSync className="animate-spin" />
                    ) : (
                        <FaTrash />
                    )}
                    <span>{operationState === 'clearing_session' ? 'Limpando...' : 'Limpar Sessão'}</span>
                </button>
            </div>

            {/* Estatísticas Auto-Reply */}
            {isConnected && (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <FaRobot className="mr-2 text-blue-400" />
                        Mensagens Automáticas
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 p-3 rounded">
                            <div className="text-sm text-gray-400">Status</div>
                            <div className={`font-semibold flex items-center ${autoReplyEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                {autoReplyEnabled ? <FaRobot className="mr-1" /> : <FaBan className="mr-1" />}
                                {autoReplyEnabled ? 'Ativo' : 'Pausado'}
                            </div>
                        </div>
                        
                        <div className="bg-slate-700/50 p-3 rounded">
                            <div className="text-sm text-gray-400">Mensagens Enviadas</div>
                            <div className="text-lg font-semibold text-white">
                                {autoReplyStats.messagesSent || 0}
                            </div>
                        </div>
                        
                        <div className="bg-slate-700/50 p-3 rounded">
                            <div className="text-sm text-gray-400">Última Mensagem</div>
                            <div className="text-sm text-white">
                                {autoReplyStats.lastMessageTime 
                                    ? new Date(autoReplyStats.lastMessageTime).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Nenhuma'
                                }
                            </div>
                        </div>
                    </div>

                    {user?.loja_id && (
                        <div className="mt-3 p-3 bg-blue-900/30 rounded border border-blue-500/30">
                            <div className="text-sm text-blue-300">
                                <strong>Loja conectada:</strong> #{user.loja_id}
                            </div>
                            <div className="text-xs text-blue-400 mt-1">
                                Mensagens automáticas direcionam para: www.botfood.com.br/cardapio/{user.loja_id}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay with Operation Message */}
            {isOperating && (
                <div className="text-center py-4">
                    <div className="inline-flex items-center space-x-2 text-blue-400">
                        <FaSync className="animate-spin" />
                        <span>{getOperationMessage() || 'Processando...'}</span>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação para Limpar Sessão */}
                    </>
                )}

            <ConfirmModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Confirmar Limpeza da Sessão"
                message="Tem certeza que deseja limpar a sessão? Será necessário escanear o QR Code novamente para conectar."
                confirmText="Limpar Sessão"
                cancelText="Cancelar"
                confirmVariant="warning"
                onConfirm={confirmClearSession}
                loading={operationState === 'clearing_session'}
            />
            </div>
        </div>
    );
};

export default WhatsAppController;

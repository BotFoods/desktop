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
    FaCheckCircle
} from 'react-icons/fa';
import useWhatsApp from '../hooks/useWhatsApp';
import ConfirmModal from './ConfirmModal';

const WhatsAppController = ({ showMessage }) => {
    const [showClearModal, setShowClearModal] = useState(false);
    const [operationState, setOperationState] = useState('idle'); // idle, connecting, generating_qr, clearing_session
    
    const {
        status,
        loading,
        error,
        serviceAvailable,
        connect,
        disconnect,
        clearSession,
        refreshStatus,
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

    const handleConnect = async () => {
        setOperationState('connecting');
        showMessage?.('Iniciando conexão com WhatsApp...', 'info');
        
        const result = await connect();
        
        if (result.success) {
            setOperationState('generating_qr');
            showMessage?.('Aguarde... Gerando QR Code', 'info');
        } else {
            showMessage?.(`Erro ao conectar: ${result.error}`, 'error');
            setOperationState('idle');
        }
    };

    const handleDisconnect = async () => {
        setOperationState('disconnecting');
        showMessage?.('Desconectando WhatsApp...', 'info');
        
        const result = await disconnect();
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
        setOperationState('clearing_session');
        showMessage?.('Limpando sessão... Aguarde...', 'info');
        
        const result = await clearSession();
        if (result.success) {
            showMessage?.('Sessão limpa com sucesso', 'success');
        } else {
            showMessage?.(`Erro ao limpar sessão: ${result.error}`, 'error');
        }
        setOperationState('idle');
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center">
                    <FaWhatsapp className="mr-2 text-green-500" />
                    Controle WhatsApp
                </h2>
                <button
                    onClick={refreshStatus}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Atualizar Status"
                >
                    <FaSync className={`${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

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

                <button
                    onClick={handleClearSession}
                    disabled={isOperating}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {operationState === 'clearing_session' ? (
                        <FaSync className="animate-spin" />
                    ) : (
                        <FaTrash />
                    )}
                    <span>{operationState === 'clearing_session' ? 'Limpando...' : 'Limpar Sessão'}</span>
                </button>
            </div>

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
    );
};

export default WhatsAppController;

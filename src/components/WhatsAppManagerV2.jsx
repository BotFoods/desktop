/**
 * WhatsApp Manager v2 Component
 * 
 * Componente moderno para gerenciar a nova arquitetura WhatsApp isolada
 */

import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheck, FaTimes, FaSpinner, FaPlay, FaRedo, FaExclamationTriangle } from 'react-icons/fa';
import whatsappOrchestratorService from '../services/WhatsAppOrchestratorService';
import useWhatsAppEvents from '../hooks/useWhatsAppEvents';
import { useAuth } from '../services/AuthContext';

const WhatsAppManagerV2 = ({ onStatusChange = null }) => {
    const { user, token } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progressMessage, setProgressMessage] = useState('');

    // Hook para eventos em tempo real
    const {
        isConnected: socketConnected,
        lastEvent,
        qrCode,
        connectionStatus,
        clearQrCode,
        isWaitingForQr,
        isConnectedToWhatsApp,
        hasError
    } = useWhatsAppEvents(user, (event) => {
        console.log('Evento WhatsApp recebido no componente:', event);
        
        // Atualizar mensagem de progresso baseada no evento
        switch (event.type) {
            case 'whatsapp_provisioned':
                setProgressMessage('WhatsApp provisionado com sucesso!');
                setTimeout(() => setProgressMessage(''), 3000);
                break;
            case 'whatsapp_qr_ready':
                setProgressMessage('QR Code gerado! Escaneie para conectar.');
                break;
            case 'whatsapp_connected':
                setProgressMessage('WhatsApp conectado com sucesso!');
                setTimeout(() => setProgressMessage(''), 3000);
                break;
            case 'whatsapp_disconnected':
                setProgressMessage('WhatsApp desconectado.');
                break;
            default:
                if (event.message) {
                    setProgressMessage(event.message);
                }
        }

        // Recarregar status após eventos importantes
        if (['whatsapp_provisioned', 'whatsapp_connected', 'whatsapp_disconnected'].includes(event.type)) {
            setTimeout(loadCurrentStatus, 1000);
        }
    });

    // Carregar status inicial
    useEffect(() => {
        loadCurrentStatus();
    }, [user, token]);

    const loadCurrentStatus = async () => {
        if (!user?.loja_id || !token) return;

        try {
            setLoading(true);
            setError(null);

            const result = await whatsappOrchestratorService.checkCurrentLojaStatus(user, token);
            
            if (result.success && result.data) {
                setStatus(result.data);
                onStatusChange?.(result.data);
            } else {
                setError(result.message || 'Erro ao carregar status');
            }
        } catch (err) {
            console.error('Erro ao carregar status:', err);
            setError('Erro ao carregar status WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleProvision = async () => {
        if (!user?.loja_id || !token) return;

        try {
            setLoading(true);
            setError(null);
            setProgressMessage('Provisionando infraestrutura...');

            const result = await whatsappOrchestratorService.provisionWhatsApp(user.loja_id, token);
            
            if (result.success) {
                setProgressMessage('Provisionamento iniciado! Aguarde...');
                
                // Atualizar status após um delay
                setTimeout(() => {
                    loadCurrentStatus();
                    setProgressMessage('');
                }, 3000);
            } else {
                setError(result.message || 'Erro ao provisionar WhatsApp');
            }
        } catch (err) {
            console.error('Erro ao provisionar:', err);
            setError('Erro ao provisionar WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleStartConnection = async () => {
        if (!user?.loja_id || !token) return;

        try {
            setLoading(true);
            setError(null);
            setProgressMessage('Iniciando conexão...');

            const result = await whatsappOrchestratorService.startConnection(user.loja_id, token);
            
            if (result.success) {
                setProgressMessage('Conexão iniciada! QR Code será exibido em breve...');
                
                // Atualizar status
                setTimeout(() => {
                    loadCurrentStatus();
                    setProgressMessage('');
                }, 2000);
            } else {
                setError(result.message || 'Erro ao iniciar conexão');
            }
        } catch (err) {
            console.error('Erro ao conectar:', err);
            setError('Erro ao iniciar conexão WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupComplete = async () => {
        if (!user?.loja_id || !token) return;

        try {
            setLoading(true);
            setError(null);

            const result = await whatsappOrchestratorService.setupWhatsApp(
                user, 
                token, 
                (message) => setProgressMessage(message)
            );
            
            if (result.success) {
                setProgressMessage('Setup concluído! Aguarde o QR Code...');
                setTimeout(() => {
                    loadCurrentStatus();
                    setProgressMessage('');
                }, 3000);
            }
        } catch (err) {
            console.error('Erro no setup:', err);
            setError(err.message || 'Erro no setup WhatsApp');
            setProgressMessage('');
        } finally {
            setLoading(false);
        }
    };

    const getStatusDisplay = () => {
        if (!status) return { text: 'Carregando...', color: '#6b7280' };
        
        const statusInfo = whatsappOrchestratorService.getStatusInfo(status.status);
        return {
            text: statusInfo.text,
            color: whatsappOrchestratorService.getStatusColor(status.status)
        };
    };

    const canProvision = () => {
        return status && whatsappOrchestratorService.canExecuteAction(status.status, 'provision');
    };

    const canConnect = () => {
        return status && whatsappOrchestratorService.canExecuteAction(status.status, 'connect');
    };

    const statusDisplay = getStatusDisplay();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <FaWhatsapp className="text-green-500 text-2xl" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">WhatsApp Business</h3>
                        <p className="text-sm text-gray-600">Nova Arquitetura Isolada</p>
                    </div>
                </div>
                
                <button
                    onClick={loadCurrentStatus}
                    disabled={loading}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    title="Atualizar status"
                >
                    <FaRedo className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Status Atual */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    {status?.port && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Porta: {status.port}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-2">
                    <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusDisplay.color }}
                    />
                    <span className="text-sm font-medium" style={{ color: statusDisplay.color }}>
                        {statusDisplay.text}
                    </span>
                </div>
            </div>

            {/* Mensagem de Progresso */}
            {progressMessage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <FaSpinner className="animate-spin text-blue-500" />
                        <span className="text-sm text-blue-700">{progressMessage}</span>
                    </div>
                </div>
            )}

            {/* Erro */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <FaExclamationTriangle className="text-red-500" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* QR Code */}
            {qrCode && (
                <div className="mb-6 text-center">
                    <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Escaneie o QR Code com seu WhatsApp:</p>
                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Aguardando escaneamento...</span>
                        </div>
                    </div>
                    <div className="relative inline-block">
                        <img 
                            src={qrCode} 
                            alt="QR Code WhatsApp" 
                            className="mx-auto border rounded-lg shadow-sm bg-white p-2"
                            style={{ maxWidth: '200px' }}
                        />
                        {socketConnected && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={clearQrCode}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                        Limpar QR Code
                    </button>
                </div>
            )}

            {/* Status de Conexão em Tempo Real */}
            {(isWaitingForQr || isConnectedToWhatsApp) && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        {isWaitingForQr && (
                            <>
                                <FaSpinner className="animate-spin text-green-500" />
                                <span className="text-sm text-green-700">Aguardando conexão WhatsApp...</span>
                            </>
                        )}
                        {isConnectedToWhatsApp && (
                            <>
                                <FaCheck className="text-green-500" />
                                <span className="text-sm text-green-700">WhatsApp conectado e funcionando!</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
                {/* Setup Completo */}
                <button
                    onClick={handleSetupComplete}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <FaWhatsapp />
                    )}
                    <span>
                        {loading ? 'Configurando...' : 'Configurar WhatsApp Automaticamente'}
                    </span>
                </button>

                {/* Ações Individuais */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleProvision}
                        disabled={loading || !canProvision()}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        <FaPlay />
                        <span>Provisionar</span>
                    </button>

                    <button
                        onClick={handleStartConnection}
                        disabled={loading || !canConnect()}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        <FaCheck />
                        <span>Conectar</span>
                    </button>
                </div>
            </div>

            {/* Informações Técnicas */}
            {status && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Informações Técnicas
                        </summary>
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                            <div>Loja ID: {status.loja_id}</div>
                            {status.port && <div>Porta: {status.port}</div>}
                            {status.database_status && <div>Status BD: {status.database_status}</div>}
                            <div>Provisionado: {status.provisioned ? 'Sim' : 'Não'}</div>
                            <div className="flex items-center space-x-2 pt-2">
                                <span>Socket.IO:</span>
                                <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                    <span className={socketConnected ? 'text-green-600' : 'text-red-600'}>
                                        {socketConnected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>
                            </div>
                            {lastEvent && (
                                <div className="pt-2 border-t border-gray-100">
                                    <span>Último evento: {lastEvent.type}</span>
                                    {lastEvent.timestamp && (
                                        <div className="text-gray-400">
                                            {new Date(lastEvent.timestamp).toLocaleTimeString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default WhatsAppManagerV2;

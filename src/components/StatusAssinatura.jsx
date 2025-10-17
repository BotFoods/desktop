import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNotifications } from '../services/NotificationContext';
import { FaCheckCircle, FaExclamationTriangle, FaCreditCard, FaCalendarAlt, FaClock } from 'react-icons/fa';

const StatusAssinatura = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const { assinatura, refreshAssinatura } = useNotifications();

    // Usar dados do contexto ao invés de fazer request próprio
    useEffect(() => {
        if (!assinatura && token) {
            // Se não temos dados no contexto, tentar buscar uma vez
            refreshData();
        }
    }, [token]);

    const refreshData = async () => {
        try {
            setLoading(true);
            setError(null);
            await refreshAssinatura();
        } catch (err) {
            setError('Erro ao carregar informações da assinatura');
        } finally {
            setLoading(false);
        }
    };

    const formatarData = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatarValor = (valor) => {
        if (!valor) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor / 100);
    };

    const calcularDiasRestantes = () => {
        if (!assinatura?.trial_end) return 0;
        const trialEnd = new Date(assinatura.trial_end);
        const now = new Date();
        const diffTime = trialEnd - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'trialing':
                return {
                    label: 'Período de Teste',
                    color: 'text-yellow-400',
                    icon: FaClock,
                    bgColor: 'bg-yellow-500/20'
                };
            case 'active':
                return {
                    label: 'Ativa',
                    color: 'text-green-400',
                    icon: FaCheckCircle,
                    bgColor: 'bg-green-500/20'
                };
            case 'past_due':
                return {
                    label: 'Pagamento Pendente',
                    color: 'text-red-400',
                    icon: FaExclamationTriangle,
                    bgColor: 'bg-red-500/20'
                };
            case 'canceled':
            case 'cancelled':
                return {
                    label: 'Cancelada',
                    color: 'text-gray-400',
                    icon: FaExclamationTriangle,
                    bgColor: 'bg-gray-500/20'
                };
            default:
                return {
                    label: 'Desconhecido',
                    color: 'text-gray-400',
                    icon: FaExclamationTriangle,
                    bgColor: 'bg-gray-500/20'
                };
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-gray-700 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">
                    Erro ao carregar informações da assinatura: {error}
                </p>
            </div>
        );
    }

    if (!assinatura) {
        return (
            <div className="p-4 bg-gray-700 rounded-lg">
                <p className="text-gray-400 text-sm">
                    Nenhuma assinatura encontrada.
                </p>
            </div>
        );
    }

    const statusInfo = getStatusInfo(assinatura.subscription_status);
    const StatusIcon = statusInfo.icon;
    const diasRestantes = calcularDiasRestantes();

    return (
        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Status da Assinatura</h4>
                <div className={`flex items-center px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                    <StatusIcon className={`mr-1 text-sm ${statusInfo.color}`} />
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Plano:</span>
                    <span className="text-white">BotFood Standard</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-white">R$ 199,00/mês</span>
                </div>

                {assinatura.trial_end && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Fim do teste:</span>
                        <span className="text-white">{formatarData(assinatura.trial_end)}</span>
                    </div>
                )}

                {assinatura.current_period_end && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Próxima cobrança:</span>
                        <span className="text-white">{formatarData(assinatura.current_period_end)}</span>
                    </div>
                )}

                {assinatura.assinatura?.metadados_stripe?.payment_method && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Método de pagamento:</span>
                        <div className="flex items-center text-white">
                            <FaCreditCard className="mr-1" />
                            <span>**** {assinatura.assinatura.metadados_stripe.payment_method.last4}</span>
                        </div>
                    </div>
                )}
            </div>

            {assinatura.subscription_status === 'trialing' && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <div className="flex items-center mb-2">
                        <FaClock className="text-blue-400 mr-2" />
                        <span className="text-blue-400 font-medium">Período de teste</span>
                    </div>
                    <p className="text-blue-300 text-sm">
                        Restam {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} do seu período de teste gratuito.
                    </p>
                    {!assinatura.payment_method_configured && (
                        <p className="text-yellow-400 text-xs mt-2">
                            Configure seu método de pagamento antes do fim do período de teste.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatusAssinatura;

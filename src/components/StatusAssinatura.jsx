import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { FaCheckCircle, FaExclamationTriangle, FaCreditCard, FaCalendarAlt, FaClock } from 'react-icons/fa';

const StatusAssinatura = () => {
    const [assinatura, setAssinatura] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        buscarAssinatura();
    }, []);

    const buscarAssinatura = async () => {
        try {
            setLoading(true);
            
            if (!token) {
                console.log('Token não disponível para buscar assinatura');
                setError('Usuário não autenticado');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/pagamentos/minha-assinatura`, {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setAssinatura(data);
                setError(null);
            } else if (response.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (response.status === 404) {
                setAssinatura(null);
                setError(null);
                console.log('Nenhuma assinatura encontrada');
            } else {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Erro ao buscar assinatura:', err);
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

    const statusInfo = getStatusInfo(assinatura.status);
    const StatusIcon = statusInfo.icon;

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
                    <span className="text-white">{assinatura.plano || 'Básico'}</span>
                </div>

                {assinatura.valor && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Valor:</span>
                        <span className="text-white">{formatarValor(assinatura.valor)}/mês</span>
                    </div>
                )}

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

                {assinatura.payment_method && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Método de pagamento:</span>
                        <div className="flex items-center text-white">
                            <FaCreditCard className="mr-1" />
                            <span>**** {assinatura.payment_method.last4}</span>
                        </div>
                    </div>
                )}
            </div>

            {assinatura.status === 'trialing' && !assinatura.payment_method && (
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500 rounded">
                    <p className="text-yellow-400 text-xs">
                        Configure seu método de pagamento antes do fim do período de teste.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StatusAssinatura;

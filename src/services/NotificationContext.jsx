import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [assinatura, setAssinatura] = useState(null);
    const { token, user } = useAuth();
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Verificar status da assinatura apenas uma vez no login
    useEffect(() => {
        if (token && user && !assinatura) {
            // Verificar apenas uma vez quando o usuário loggar
            verificarAssinatura();
        }
    }, [token, user]);

    const verificarAssinatura = async (forceRefresh = false) => {
        try {
            // Verificar se o token existe e é válido
            if (!token || !user) {
                return;
            }

            // Se já temos dados e não é refresh forçado, não fazer nova requisição
            if (assinatura && !forceRefresh) {
                return assinatura;
            }

            const response = await fetch(`${API_BASE_URL}/api/pagamentos/minha-assinatura`, {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                const data = result.success ? result.data : result;
                setAssinatura(data);
                verificarNotificacoesAssinatura(data);
                return data;
            } else if (response.status === 401) {
                // Não mostrar erro 401 como erro crítico
                setAssinatura(null);
                return null;
            } else {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('NotificationContext: Erro ao verificar assinatura:', error);
            // Não definir assinatura como null em caso de erro de rede
            // para evitar notificações falsas
            return null;
        }
    };

    const verificarNotificacoesAssinatura = (assinatura) => {
        if (!assinatura) return;

        const agora = new Date();
        const notificacoesExistentes = notifications.filter(n => n.type === 'subscription');

        // Trial terminando em breve
        if (assinatura.subscription_status === 'trialing' && assinatura.trial_end) {
            const trialEnd = new Date(assinatura.trial_end);
            const diasRestantes = Math.ceil((trialEnd - agora) / (1000 * 60 * 60 * 24));

            if (diasRestantes <= 3 && !assinatura.payment_method_configured) {
                const notificationId = 'trial-ending';
                if (!notificacoesExistentes.find(n => n.id === notificationId)) {
                    addNotification({
                        id: notificationId,
                        type: 'subscription',
                        severity: 'warning',
                        title: 'Período de teste terminando',
                        message: `Seu período de teste termina em ${diasRestantes} dia(s). Configure seu método de pagamento para continuar usando o BotFood.`,
                        action: {
                            label: 'Configurar Pagamento',
                            path: '/configuracao-pagamento'
                        },
                        persistent: true
                    });
                }
            }
        }

        // Pagamento em atraso
        if (assinatura.subscription_status === 'past_due') {
            const notificationId = 'payment-overdue';
            if (!notificacoesExistentes.find(n => n.id === notificationId)) {
                addNotification({
                    id: notificationId,
                    type: 'subscription',
                    severity: 'error',
                    title: 'Pagamento em atraso',
                    message: 'Há um pagamento pendente em sua assinatura. Atualize seu método de pagamento para evitar a suspensão do serviço.',
                    action: {
                        label: 'Atualizar Pagamento',
                        path: '/configuracao-pagamento'
                    },
                    persistent: true
                });
            }
        }

        // Método de pagamento expirado/inválido
        if (assinatura.subscription_status === 'active' && assinatura.payment_method?.status === 'requires_action') {
            const notificationId = 'payment-method-issue';
            if (!notificacoesExistentes.find(n => n.id === notificationId)) {
                addNotification({
                    id: notificationId,
                    type: 'subscription',
                    severity: 'warning',
                    title: 'Problema com método de pagamento',
                    message: 'Há um problema com seu método de pagamento. Atualize suas informações para evitar interrupções no serviço.',
                    action: {
                        label: 'Atualizar Método',
                        path: '/configuracao-pagamento'
                    },
                    persistent: true
                });
            }
        }
    };

    const addNotification = (notification) => {
        const newNotification = {
            ...notification,
            id: notification.id || `notification-${Date.now()}`,
            timestamp: new Date(),
            read: false
        };

        setNotifications(prev => {
            // Evitar duplicatas
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) return prev;
            
            return [...prev, newNotification];
        });
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getUnreadCount = () => {
        return notifications.filter(n => !n.read).length;
    };

    const getPersistentNotifications = () => {
        return notifications.filter(n => n.persistent && !n.read);
    };

    const refreshAssinatura = async () => {
        return await verificarAssinatura(true);
    };

    const value = {
        notifications,
        assinatura,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll,
        getUnreadCount,
        getPersistentNotifications,
        verificarAssinatura,
        refreshAssinatura // Nova função para refresh manual
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// hooks/useSubscriptionData.js
import { useState, useCallback } from 'react';
import { useNotifications } from '../services/NotificationContext';

/**
 * Hook personalizado para páginas que precisam de dados específicos de assinatura
 * Usa o contexto de notificações mas permite refresh manual quando necessário
 */
export const useSubscriptionData = () => {
    const { assinatura, refreshAssinatura } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await refreshAssinatura();
            return data;
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados da assinatura');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshAssinatura]);

    return {
        subscriptionData: assinatura,
        loading,
        error,
        refreshData,
        // Helpers úteis
        isActive: assinatura?.subscription_status === 'active',
        isTrialing: assinatura?.subscription_status === 'trialing',
        isPastDue: assinatura?.subscription_status === 'past_due',
        hasPaymentMethod: assinatura?.payment_method_configured,
        trialEnd: assinatura?.trial_end,
        nextPaymentDate: assinatura?.next_payment_date
    };
};

export default useSubscriptionData;
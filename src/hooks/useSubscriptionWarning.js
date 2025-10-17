import { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNotifications } from '../services/NotificationContext';

export const useSubscriptionWarning = () => {
  const [shouldShowWarning, setShouldShowWarning] = useState(false);
  const { token, user } = useAuth();
  const { assinatura: subscriptionData } = useNotifications();

  useEffect(() => {
    if (subscriptionData) {
      // Verificar se deve mostrar o aviso baseado nos dados do contexto
      const shouldShow = evaluateWarningConditions(subscriptionData);
      setShouldShowWarning(shouldShow);
    }
  }, [subscriptionData]);

  const evaluateWarningConditions = (data) => {
    if (!data) return false;
    
    // Não mostrar se já tem método de pagamento configurado
    if (data.payment_method_configured) return false;
    
    // Mostrar apenas se está em período de teste
    if (data.subscription_status !== 'trialing') return false;
    
    // Calcular dias restantes
    if (data.trial_end) {
      const trialEnd = new Date(data.trial_end);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      // Mostrar quando restam 7 dias ou menos
      return daysRemaining <= 7 && daysRemaining > 0;
    }
    
    return false;
  };

  const calculateDaysRemaining = () => {
    if (!subscriptionData?.trial_end) return 0;
    const trialEnd = new Date(subscriptionData.trial_end);
    const now = new Date();
    return Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  };

  const isUrgent = () => {
    const days = calculateDaysRemaining();
    return days <= 3;
  };

  return {
    subscriptionData,
    shouldShowWarning,
    daysRemaining: calculateDaysRemaining(),
    isUrgent: isUrgent(),
    trialEndDate: subscriptionData?.trial_end ? new Date(subscriptionData.trial_end) : null
  };
};

export default useSubscriptionWarning;

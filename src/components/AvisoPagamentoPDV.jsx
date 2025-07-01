import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionWarning } from '../hooks/useSubscriptionWarning';
import { 
  FaInfoCircle, 
  FaCreditCard, 
  FaTimes, 
  FaClock,
  FaCalendarAlt 
} from 'react-icons/fa';

const AvisoPagamentoPDV = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  
  const { 
    subscriptionData, 
    shouldShowWarning, 
    daysRemaining, 
    isUrgent, 
    trialEndDate 
  } = useSubscriptionWarning();

  const handleConfigurePayment = () => {
    navigate('/configuracao-pagamento');
  };

  const handleDismiss = () => {
    setDismissed(true);
    
    // Salvar dismissal no sessionStorage para não mostrar novamente na sessão atual
    sessionStorage.setItem('payment_warning_dismissed', Date.now().toString());
  };

  // Verificar se foi dismissed recentemente (nas últimas 24 horas)
  useEffect(() => {
    const dismissedTime = sessionStorage.getItem('payment_warning_dismissed');
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setDismissed(true);
      } else {
        sessionStorage.removeItem('payment_warning_dismissed');
      }
    }
  }, []);

  // Não mostrar se foi dismissed ou se não deve mostrar warning
  if (!shouldShowWarning || !subscriptionData || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-blue-900/20 border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-blue-400" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-sm font-medium text-blue-300">
                    {isUrgent ? 'Período de teste terminando em breve' : 'Configure seu método de pagamento'}
                  </h3>
                  <p className="text-xs text-blue-400/80">
                    Seu teste gratuito termina em{' '}
                    <span className="font-medium text-blue-300">
                      {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}
                    </span>
                    . Configure seu pagamento para continuar usando o BotFood.
                  </p>
                </div>
                
                <div className="hidden lg:flex items-center space-x-3 text-xs text-blue-400/70">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-1" />
                    <span>Termina: {trialEndDate?.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCreditCard className="mr-1" />
                    <span>R$ 199,00/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleConfigurePayment}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200"
            >
              <FaCreditCard className="mr-1.5 h-3 w-3" />
              Configurar
            </button>
            
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center w-6 h-6 text-blue-400 hover:text-blue-300 hover:bg-blue-800/30 rounded transition-colors duration-200"
              aria-label="Dispensar aviso"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvisoPagamentoPDV;

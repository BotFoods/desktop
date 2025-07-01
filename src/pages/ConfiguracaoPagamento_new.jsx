// src/pages/ConfiguracaoPagamento.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../services/AuthContext';
import { 
  FaLock, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaCreditCard,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaArrowLeft,
  FaEdit
} from 'react-icons/fa';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RTSRnENjNaLcfKyTqPL8PGrqgZ6RkzaOfxO2MLTolG6IWxV4EuQzUVrMY7MoJ5nui91Iwg25kUVfoXr0IB93og700axaAdHdG');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#fff',
      '::placeholder': {
        color: '#aab7c4',
      },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    },
  },
};

// Componente do formulário de configuração de pagamento
const PaymentSetupForm = ({ 
  onSuccess, 
  onError,
  subscriptionData,
  userInfo
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [setupIntent, setSetupIntent] = useState(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [existingPaymentMethod, setExistingPaymentMethod] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Carregar método de pagamento existente se houver
  useEffect(() => {
    const loadExistingPaymentMethod = async () => {
      if (!subscriptionData?.payment_method_configured) {
        setIsEditingPayment(true); // Se não tem método configurado, já entra no modo de edição
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/pagamentos/payment-method`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.payment_method) {
            setExistingPaymentMethod(data.payment_method);
            setIsEditingPayment(false); // Mostra os dados existentes primeiro
          }
        }
      } catch (err) {
        console.error('Erro ao carregar método de pagamento:', err);
      }
    };

    if (subscriptionData) {
      loadExistingPaymentMethod();
    }
  }, [subscriptionData, API_BASE_URL]);

  // Criar Setup Intent para salvar método de pagamento (só quando estiver editando)
  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pagamentos/setup-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${localStorage.getItem('token')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            customer_id: subscriptionData.stripe_customer_id
          })
        });

        const data = await response.json();
        if (data.success) {
          setSetupIntent(data.setup_intent);
        } else {
          setError(data.message || 'Erro ao preparar configuração de pagamento');
        }
      } catch (err) {
        console.error('Erro ao criar Setup Intent:', err);
        setError('Falha na conexão com o servidor');
      }
    };

    if (subscriptionData?.stripe_customer_id && isEditingPayment) {
      createSetupIntent();
    }
  }, [subscriptionData, API_BASE_URL, isEditingPayment]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !setupIntent) {
      setError('Configuração de pagamento não foi carregada. Tente recarregar a página.');
      return;
    }

    if (!cardComplete) {
      setError('Por favor, preencha todos os dados do cartão corretamente.');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirmar o Setup Intent para salvar o método de pagamento
      const { error: confirmError, setupIntent: confirmedSetupIntent } = await stripe.confirmCardSetup(
        setupIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: userInfo.nome || userInfo.nomeLoja,
              email: userInfo.email,
              phone: userInfo.whatsapp
            },
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message);
        if (onError) onError(confirmError);
      } else if (confirmedSetupIntent.status === 'succeeded') {
        // Método de pagamento salvo com sucesso
        // Agora associar o método de pagamento à assinatura
        await associarMetodoPagamentoAssinatura(confirmedSetupIntent.payment_method);
      }
    } catch (err) {
      console.error('Erro ao configurar pagamento:', err);
      setError('Erro inesperado durante a configuração do pagamento.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const associarMetodoPagamentoAssinatura = async (paymentMethodId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pagamentos/assinaturas/payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription_id: subscriptionData.stripe_subscription_id,
          payment_method_id: paymentMethodId
        })
      });

      const data = await response.json();
      if (data.success) {
        if (onSuccess) onSuccess(data);
      } else {
        setError(data.message || 'Erro ao associar método de pagamento');
        if (onError) onError(new Error(data.message));
      }
    } catch (err) {
      console.error('Erro ao associar método de pagamento:', err);
      setError('Erro ao finalizar configuração');
      if (onError) onError(err);
    }
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const calcularDiasRestantes = () => {
    if (!subscriptionData.trial_end) return 0;
    const trialEnd = new Date(subscriptionData.trial_end);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const diasRestantes = calcularDiasRestantes();

  return (
    <div className="space-y-6">
      {/* Status da assinatura */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <h3 className="text-white font-medium mb-3 flex items-center">
          <FaInfoCircle className="text-blue-500 mr-2" />
          Status da Sua Assinatura
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Plano:</span>
            <span className="text-white font-medium">BotFood Standard</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Valor mensal:</span>
            <span className="text-white font-medium">R$ 199,00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              subscriptionData.subscription_status === 'trialing' 
                ? 'bg-blue-900 text-blue-300' 
                : 'bg-green-900 text-green-300'
            }`}>
              {subscriptionData.subscription_status === 'trialing' ? 'Em teste' : 'Ativa'}
            </span>
          </div>
          
          {subscriptionData.subscription_status === 'trialing' && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <FaClock className="text-blue-400 mr-2" />
                <span className="text-blue-400 font-medium">Período de teste</span>
              </div>
              <p className="text-blue-300 text-sm">
                Restam {diasRestantes} dia{diasRestantes !== 1 ? 's' : ''} do seu período de teste gratuito.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Método de Pagamento Atual (se existir) */}
      {existingPaymentMethod && !isEditingPayment && (
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-medium flex items-center">
              <FaCreditCard className="text-green-500 mr-2" />
              Método de Pagamento Atual
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingPayment(true)}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
            >
              <FaEdit className="mr-1" />
              Editar
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Cartão:</span>
              <span className="text-white">
                **** **** **** {existingPaymentMethod.last4} 
                <span className="text-gray-400 ml-2">
                  {existingPaymentMethod.brand?.toUpperCase()}
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Válido até:</span>
              <span className="text-white">
                {existingPaymentMethod.exp_month?.toString().padStart(2, '0')}/{existingPaymentMethod.exp_year}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Configuração/Edição */}
      {isEditingPayment && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h3 className="text-white font-medium mb-4 flex items-center">
              <FaCreditCard className="text-blue-500 mr-2" />
              {existingPaymentMethod ? 'Atualizar Método de Pagamento' : 'Configurar Método de Pagamento'}
            </h3>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-3">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-400 font-medium">Erro na configuração</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={!stripe || loading || !cardComplete || !setupIntent}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                !stripe || loading || !cardComplete || !setupIntent
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Processando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FaLock className="mr-2" />
                  {existingPaymentMethod ? 'Atualizar Método de Pagamento' : 'Salvar Método de Pagamento'}
                </div>
              )}
            </button>
            
            {existingPaymentMethod && (
              <button
                type="button"
                onClick={() => setIsEditingPayment(false)}
                className="w-full mt-3 py-2 px-4 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
          
          {/* Informações importantes */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Como funciona:</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li>• Salvaremos seu método de pagamento com segurança</li>
              <li>• A cobrança só acontece após o período de teste</li>
              <li>• Você pode cancelar a qualquer momento</li>
              <li>• Faturamento mensal de R$ 199,00</li>
              <li>• Sem taxas adicionais ou multas</li>
            </ul>
          </div>
          
          <p className="text-center text-xs text-gray-400">
            Ao continuar, você concorda com nossos termos de serviço e política de privacidade
          </p>
        </form>
      )}
    </div>
  );
};

// Componente principal
const ConfiguracaoPagamento = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        // Usar dados do AuthContext se disponível
        if (user) {
          setUserInfo({
            id: user.id,
            nome: user.nome_loja || user.nome,
            email: user.email,
            whatsapp: user.contato_loja || user.whatsapp
          });
        } else {
          // Fallback: tentar carregar dados do usuário via API
          try {
            const userResponse = await fetch(`${API_BASE_URL}/api/usuarios/perfil`, {
              headers: {
                'Authorization': `${token}`
              },
              credentials: 'include'
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserInfo({
                id: userData.id,
                nome: userData.nome_loja || userData.nome,
                email: userData.email,
                whatsapp: userData.contato_loja || userData.whatsapp
              });
            }
          } catch (userError) {
            console.warn('Não foi possível carregar dados do usuário via API:', userError);
          }
        }

        // Carregar dados da assinatura
        try {
          const subscriptionResponse = await fetch(`${API_BASE_URL}/api/pagamentos/minha-assinatura`, {
            headers: {
              'Authorization': `${token}`
            },
            credentials: 'include'
          });

          if (subscriptionResponse.ok) {
            const result = await subscriptionResponse.json();
            const subscriptionData = result.success ? result.data : result;
            setSubscriptionData(subscriptionData);
          } else {
            throw new Error('Não foi possível carregar dados da assinatura');
          }
        } catch (subscriptionError) {
          console.error('Erro ao carregar assinatura:', subscriptionError);
          throw new Error('Falha ao carregar dados da assinatura');
        }

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [API_BASE_URL, user]);

  const handleSuccess = (data) => {
    console.log('Método de pagamento configurado com sucesso:', data);
    setSuccess(true);
    // Atualizar dados da assinatura
    if (data.subscription) {
      setSubscriptionData(prev => ({
        ...prev,
        payment_method_configured: true
      }));
    }
  };

  const handleError = (error) => {
    console.error('Erro na configuração:', error);
    setError(error.message || 'Erro ao configurar método de pagamento');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-white">Carregando informações da assinatura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-red-400 font-bold mb-2">Erro ao carregar dados</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 text-center max-w-md">
          <div className="bg-green-600 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <FaCheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Método de Pagamento Configurado!</h2>
          <p className="text-gray-300 mb-6">
            Seu cartão foi salvo com segurança. Agora você pode usar o sistema sem interrupções.
          </p>
          <button
            onClick={() => navigate('/configuracoes')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Voltar para Configurações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/configuracoes')}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar para Configurações
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">
            Gestão de Assinatura
          </h1>
          <p className="text-gray-400">
            {subscriptionData?.payment_method_configured 
              ? 'Gerencie seu método de pagamento e dados da assinatura'
              : 'Configure seu método de pagamento para continuar usando o BotFood após o período de teste'
            }
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
            <PaymentSetupForm
              onSuccess={handleSuccess}
              onError={handleError}
              subscriptionData={subscriptionData}
              userInfo={userInfo}
            />
          </div>
        </Elements>
      </div>
    </div>
  );
};

export default ConfiguracaoPagamento;

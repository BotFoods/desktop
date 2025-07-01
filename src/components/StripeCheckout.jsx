// src/components/StripeCheckout.jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaLock, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// Carregue sua chave pública do Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RTSRnENjNaLcfKyTqPL8PGrqgZ6RkzaOfxO2MLTolG6IWxV4EuQzUVrMY7MoJ5nui91Iwg25kUVfoXr0IB93og700axaAdHdG');

// Opções para o CardElement
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

// Componente do formulário de pagamento
const CheckoutForm = ({ 
  clientSecret, 
  onSuccess, 
  onError, 
  customerData,
  subscriptionData 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Stripe não foi carregado corretamente. Tente recarregar a página.');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirmar o pagamento
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerData.nomeLoja,
              email: customerData.email,
              phone: customerData.whatsapp
            },
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message);
        if (onError) onError(confirmError);
      } else if (paymentIntent.status === 'succeeded') {
        // Pagamento confirmado com sucesso
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Erro no pagamento:', err);
      setError('Erro inesperado durante o processamento do pagamento.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações da assinatura */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <h3 className="text-white font-medium mb-3 flex items-center">
          <FaCheckCircle className="text-green-500 mr-2" />
          Resumo da Assinatura
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Plano:</span>
            <span className="text-white">{subscriptionData?.planName || 'BotFood Standard'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Valor:</span>
            <span className="text-white">{subscriptionData?.price || 'R$ 199,00'}/mês</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Teste grátis:</span>
            <span className="text-green-400 font-medium">15 dias</span>
          </div>
          <div className="border-t border-gray-600 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Cobrança hoje:</span>
              <span className="text-green-400 font-bold">R$ 0,00</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Você será cobrado após o período de teste
            </p>
          </div>
        </div>
      </div>

      {/* Formulário do cartão */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <label className="flex items-center text-white font-medium mb-3">
          <FaLock className="mr-2 text-gray-400" />
          Informações do Cartão de Crédito
        </label>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        
        <p className="text-xs text-gray-400 mt-2 flex items-center">
          <FaLock className="mr-1" />
          Seus dados estão seguros e criptografados
        </p>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start">
          <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Erro no pagamento</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Informações importantes */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">Informações importantes:</h4>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Você pode cancelar a qualquer momento durante o teste</li>
          <li>• Sem taxa de cancelamento ou multas</li>
          <li>• Cobrança automática apenas após o período de teste</li>
          <li>• Suporte prioritário durante todo o período</li>
        </ul>
      </div>

      {/* Botão de confirmação */}
      <button
        type="submit"
        disabled={!stripe || loading || !cardComplete || !clientSecret}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center ${
          loading || !cardComplete || !clientSecret
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Processando...
          </>
        ) : (
          <>
            <FaLock className="mr-2" />
            Iniciar Teste Grátis
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Ao continuar, você concorda com nossos termos de serviço
      </p>
    </form>
  );
};

// Componente principal do checkout com Stripe
const StripeCheckout = ({ 
  customerData, 
  subscriptionData, 
  onSuccess, 
  onError 
}) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Criar setup intent ou subscription
  const initializePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/pagamentos/assinaturas/criar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          clienteEmail: customerData.email,
          nomeLoja: customerData.nomeLoja,
          senha: customerData.senha,
          whatsapp: customerData.whatsapp,
          pricePlanId: subscriptionData.priceId,
          descricao: `Assinatura ${subscriptionData.planName} - BotFood`,
          metadata: {
            plano: 'standard',
            origem: 'desktop'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.clientSecret);
      } else {
        setError(data.message || 'Erro ao inicializar pagamento');
        if (onError) onError(new Error(data.message));
      }
    } catch (err) {
      console.error('Erro ao inicializar pagamento:', err);
      setError('Falha na conexão com o servidor');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar pagamento quando o componente for montado
  useEffect(() => {
    if (customerData && subscriptionData) {
      initializePayment();
    }
  }, [customerData, subscriptionData]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
        <p className="text-white">Preparando pagamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <h3 className="text-red-400 font-bold mb-2">Erro ao carregar pagamento</h3>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={initializePayment}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Finalize sua Assinatura
          </h2>
          <p className="text-gray-400">
            Configure seu método de pagamento para após o período de teste
          </p>
        </div>

        <CheckoutForm
          clientSecret={clientSecret}
          onSuccess={onSuccess}
          onError={onError}
          customerData={customerData}
          subscriptionData={subscriptionData}
        />
      </div>
    </Elements>
  );
};

export default StripeCheckout;

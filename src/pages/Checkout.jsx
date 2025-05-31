import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCreditCard, FaLock, FaRegCheckCircle, FaRegClock, FaSpinner, FaStore, FaEnvelope } from 'react-icons/fa';
import PropTypes from 'prop-types';
import logo from '../assets/logo_chatgpt.png';

// Carregar Stripe com a chave pública
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Componente para o formulário do cartão
const CheckoutForm = ({ clientSecret, onComplete, isLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [cardFeedback, setCardFeedback] = useState('');

  // Função para identificar o tipo do cartão
  const handleCardChange = (event) => {
    const { empty, complete, error, brand } = event;
    setCardBrand(brand);
    setCardComplete(complete);
    
    if (error) {
      setError(error.message);
      setCardFeedback('');
    } else if (empty) {
      setError('');
      setCardFeedback('');
    } else if (complete) {
      setError('');
      setCardFeedback('Cartão válido');
    } else {
      setError('');
      setCardFeedback('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou
      return;
    }

    if (error) {
      elements.getElement(CardElement).focus();
      return;
    }

    if (cardComplete) {
      setProcessing(true);
    } else {
      setError('Por favor, preencha os dados do cartão corretamente');
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          setSucceeded(true);
          setError(null);
          setProcessing(false);
          onComplete(result.paymentIntent);
        }
      }
    } catch (err) {
      console.error("Erro ao processar pagamento:", err);
      setError("Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
        <div className="mb-6">
          <label htmlFor="card-element" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <FaCreditCard className="mr-2" /> Dados do Cartão
          </label>
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
            <CardElement
              id="card-element"
              options={{
                style: {
                  base: {
                    color: 'white',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '16px',
                    '::placeholder': {
                      color: '#94a3b8', // slate-400
                    },
                    iconColor: '#ffffff',
                  },
                  invalid: {
                    color: '#f87171', // red-400
                    iconColor: '#f87171',
                  },
                },
              }}
              onChange={handleCardChange}
            />
          </div>
          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          {cardFeedback && !error && (
            <div className="text-green-400 text-sm mt-2 flex items-center">
              <FaRegCheckCircle className="mr-1" />
              {cardFeedback} {cardBrand && `(${cardBrand})`}
            </div>
          )}
        </div>
        
        <div className="flex items-center mb-4 text-sm text-gray-400">
          <FaLock className="mr-2" />
          <span>Seus dados estão seguros e criptografados</span>
        </div>
        
        <button
          disabled={processing || !stripe || !cardComplete || succeeded || isLoading}
          type="submit"
          className={`w-full p-3 rounded-lg ${
            processing || isLoading || !cardComplete ? 'bg-blue-700 opacity-70' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          } text-white font-bold flex items-center justify-center transition-all duration-200`}
        >
          {processing || isLoading ? (
            <span className="flex items-center">
              <FaSpinner className="animate-spin mr-2" />
              Processando...
            </span>
          ) : (
            <span className="flex items-center">
              Confirmar assinatura
            </span>
          )}
        </button>
      </div>
    </form>
  );
};

// Componente principal da página de checkout
const Checkout = () => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [email, setEmail] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [selectedPlan] = useState('price_standard');
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const plans = [
    {
      id: 'price_standard',
      name: 'Plano BotFood',
      price: 'R$ 199,00',
      period: '/mês',
      priceId: 'price_1RTYq9ENjNaLcfKyIsdpbF3A', // ID do plano no Stripe (substitua pelo ID real)
      features: [
        'Controle completo do restaurante',
        'Cardápio digital ilimitado',
        'Gestão de pedidos e mesas',
        'Relatórios gerenciais',
        'Suporte prioritário 24/7',
        'Atualizações gratuitas',
        'Acesso a todos os módulos'
      ]
    }
  ];

  // Criando a assinatura ao enviar o formulário inicial
  const handleStartSubscription = async (e) => {
    e.preventDefault();
    
    if (!email || !nomeLoja || !selectedPlan) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Buscar o plano selecionado
    const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pagamentos/assinaturas/criar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteEmail: email,
          nomeLoja,
          pricePlanId: selectedPlanData.priceId, // Usar o ID do preço do plano no Stripe
          descricao: `Assinatura ${selectedPlanData.name} - BotFoods`,
          metadata: {
            plano: 'standard',
            origem: 'desktop'
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClientSecret(data.clientSecret);
        setSubscription({
          id: data.subscriptionId,
          status: data.status,
          trialEnd: data.trialEnd
        });
      } else {
        setError(data.message || 'Erro ao criar assinatura. Por favor, tente novamente.');
      }
    } catch (err) {
      console.error('Erro na criação da assinatura:', err);
      setError('Falha na conexão com o servidor. Por favor, verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com a confirmação da assinatura
  const handleSubscriptionCompleted = (paymentIntent) => {
    setCompleted(true);
    // Salvando o ID do pagamento para referência futura ou exibição ao usuário
    console.log('Pagamento confirmado:', paymentIntent.id);
    
    // Aqui você pode implementar redirecionamento para o dashboard
    // ou outras ações após a assinatura ser confirmada
  };

  // Exibir a página adequada com base no estado da assinatura
  const renderContent = () => {
    if (completed) {
      // Encontrar o plano selecionado
      const planDetails = plans[0]; // Agora só temos um plano
      
      // Calcular data de término do teste (15 dias após hoje)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 15);
      const formattedTrialEndDate = trialEndDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      return (
        <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl border-2 border-green-500 text-center relative overflow-hidden">
          {/* Background decorativo */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500 opacity-10 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 opacity-10 rounded-full transform -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-600 text-white text-xs px-4 py-1 rounded-full font-bold animate-pulse">
                TESTE GRÁTIS ATIVADO
              </div>
            </div>
            
            <div className="mb-8 text-center pt-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-600 rounded-full p-4 shadow-lg">
                  <FaRegCheckCircle size={48} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Assinatura Confirmada!</h2>
              <p className="text-gray-300">
                Parabéns! Seu período de teste foi iniciado com sucesso. Você receberá um e-mail com os detalhes.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-white mb-3 flex items-center">
              <FaRegCheckCircle className="text-green-500 mr-2" />
              Detalhes da Assinatura:
            </h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• Loja: <span className="text-white">{nomeLoja}</span></p>
              <p>• E-mail: <span className="text-white">{email}</span></p>
              <p>• Plano: <span className="text-white">{planDetails?.name || 'Plano selecionado'}</span></p>
              <p>• Valor: <span className="text-white">{planDetails?.price || ''} {planDetails?.period || ''}</span></p>
              <p>• Status: <span className="text-green-400 font-medium">Período de teste ativo</span></p>
              <p className="flex items-center">
                • Acesso gratuito até: 
                <span className="bg-green-900/30 text-green-400 font-medium rounded ml-2 px-2 py-0.5">
                  {formattedTrialEndDate}
                </span>
              </p>
            </div>
          </div>
          
          <div className="bg-green-900/20 text-green-300 p-4 rounded-lg mb-6 border border-green-800/30">
            <h4 className="font-medium mb-2">Seu teste grátis inclui:</h4>
            <ul className="text-sm text-left space-y-2">
              <li className="flex items-start">
                <FaRegCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Acesso completo a todas as funcionalidades do sistema por 15 dias</span>
              </li>
              <li className="flex items-start">
                <FaRegCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Suporte técnico prioritário para ajudar na configuração inicial</span>
              </li>
              <li className="flex items-start">
                <FaRegCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>Cancele a qualquer momento durante o período de teste</span>
              </li>
            </ul>
          </div>
          
          <a 
            href="/login" 
            className="w-full block p-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-center transition-all duration-200 shadow-lg"
          >
            Acessar Meu Sistema Agora
          </a>
        </div>
      );
    }
    
    if (clientSecret && subscription) {
      return (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna de Resumo à Esquerda */}
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6">Resumo da Assinatura</h3>
              
              <div className="bg-green-900/20 p-3 rounded-lg border border-green-800/30 mb-6">
                <div className="flex items-center mb-2">
                  <FaRegClock className="text-green-400 mr-2" />
                  <span className="text-green-400 font-medium">15 dias grátis</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Seu período de teste já está garantido
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Plano</span>
                  <span className="font-medium text-white">{plans[0].name}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Valor</span>
                  <span className="font-medium text-white">{plans[0].price}{plans[0].period}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Primeira cobrança</span>
                  <span className="font-medium text-white">após 15 dias</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center text-blue-400 mb-4">
                  <FaLock className="mr-2" />
                  <span className="text-sm">
                    Você não será cobrado durante o período de teste.
                  </span>
                </div>
                
                <div className="bg-blue-900/20 text-blue-300 p-3 rounded-lg text-sm">
                  Após os 15 dias de teste, o valor será cobrado automaticamente no cartão informado. Você pode cancelar a qualquer momento.
                </div>
              </div>
            </div>
          </div>
          
          {/* Coluna de Pagamento à Direita */}
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 relative">
              {/* Indicador de etapa */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold py-1 px-4 rounded-full">
                PASSO 2 DE 2
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Finalizar Assinatura</h2>
              <p className="text-gray-400 mb-6">Adicione um cartão para garantir sua assinatura após o período de teste</p>
              
              {error && (
                <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">
                  {error}
                </div>
              )}
              
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  clientSecret={clientSecret} 
                  onComplete={handleSubscriptionCompleted}
                  isLoading={loading}
                />
              </Elements>
              
              <div className="mt-4 flex items-center justify-center text-gray-400 text-sm">
                <FaLock className="mr-2" />
                <span>Seus dados estão protegidos com criptografia de ponta a ponta</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Formulário inicial
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Sistema BotFood para seu Restaurante</h1>
          <p className="text-gray-400">
            Comece hoje com o BotFood e transforme a gestão do seu negócio.
          </p>
        </div>
        
        {/* Seção de benefícios em destaque antes dos preços */}
        <div className="mb-12">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 relative overflow-hidden">
            {/* Fundo decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-8 relative">
              Por que escolher o <span className="text-blue-400">BotFood</span>?
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-4 bg-gray-750 hover:bg-gray-700 rounded-lg transition-all duration-300">
                <div className="bg-blue-900/30 p-3 rounded-full mb-4">
                  <FaRegClock className="text-blue-400 text-2xl" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">15 dias de teste grátis</h4>
                <p className="text-gray-400">Experimente todas as funcionalidades sem compromisso por 15 dias, sem necessidade de cartão.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 bg-gray-750 hover:bg-gray-700 rounded-lg transition-all duration-300">
                <div className="bg-blue-900/30 p-3 rounded-full mb-4">
                  <FaStore className="text-blue-400 text-2xl" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Gestão completa</h4>
                <p className="text-gray-400">Controle seu restaurante, mesas, pedidos e clientes em um só lugar, com interface intuitiva.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 bg-gray-750 hover:bg-gray-700 rounded-lg transition-all duration-300">
                <div className="bg-blue-900/30 p-3 rounded-full mb-4">
                  <FaRegCheckCircle className="text-blue-400 text-2xl" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Sem taxas extras</h4>
                <p className="text-gray-400">Preço único e transparente, sem taxas adicionais por pedido, mesmo em grandes volumes.</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-800/40">
              <p className="text-center text-blue-300">
                <span className="font-bold">Mais de 500 restaurantes</span> já utilizam o BotFood para otimizar seus processos e aumentar as vendas.
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}
        
        {/* Grid com plano e formulário lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Coluna do plano */}
          <div className="bg-gray-800 border-2 border-blue-600 p-8 rounded-lg shadow-lg relative overflow-hidden h-full">
            {/* Etiqueta de teste grátis */}
            <div className="absolute -right-12 top-7 bg-green-600 text-white px-10 py-1 transform rotate-45 shadow-lg font-bold text-sm md:text-base">
              15 DIAS GRÁTIS
            </div>
            {/* Badge adicional de teste grátis - mais visível em mobile */}
            <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
              TESTE GRÁTIS
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">{plans[0].name}</h3>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">{plans[0].price}</span>
              <span className="text-gray-400">{plans[0].period}</span>
            </div>
            
            <div className="bg-green-900/30 text-green-400 text-sm font-medium px-4 py-2 rounded-full inline-block mb-6">
              <span className="flex items-center">
                <FaRegClock className="mr-1" />
                Teste grátis por 15 dias - cancele quando quiser
              </span>
            </div>
            
            <div className="p-4 bg-gray-750 rounded-lg mb-6">
              <h4 className="text-white font-medium mb-3">O que está incluído:</h4>
              <ul className="space-y-3">
                {plans[0].features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <FaRegCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="font-bold">Suporte Premium:</span> Assistência prioritária durante todo o período de teste
              </p>
            </div>
          </div>
          
          {/* Coluna do formulário */}
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 relative h-full">
            {/* Indicador de etapa */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold py-1 px-4 rounded-full">
              PASSO 1 DE 2
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Informações da Loja</h2>
              <div className="bg-green-900/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                <FaRegClock className="mr-1" /> 15 DIAS GRÁTIS
              </div>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-800/30">
              <p className="text-blue-300 text-sm">
                Preencha os dados abaixo para iniciar seu período de teste <span className="font-bold">gratuito de 15 dias</span>. Sem compromisso e sem necessidade de cartão de crédito agora.
              </p>
            </div>
            
            <form onSubmit={handleStartSubscription} className="space-y-4">
              <div>
                <label htmlFor="loja" className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Loja
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStore className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="loja"
                    placeholder="Nome da sua Loja"
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="pt-5">
                <button 
                  type="submit" 
                  className="w-full p-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center justify-center transition-all duration-200 shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Iniciar Meu Teste Grátis <FaRegClock className="ml-2" />
                    </span>
                  )}
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-green-400 text-sm font-medium">Sem compromisso • Cancele quando quiser</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Ao clicar em continuar, você concorda com nossos 
                    <a href="#" className="text-blue-400 hover:text-blue-300 ml-1">Termos de Serviço</a>.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="BotFood Logo" className="h-16 w-16 mb-2" />
          <h2 className="text-2xl font-bold text-white">BotFood</h2>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-6xl w-full mx-auto flex-grow">
        {renderContent()}
      </div>

      {/* Seção de FAQ */}
      {!clientSecret && !completed && <FAQSection />}

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto mt-12 pt-6 border-t border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} BotFood. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-300 text-sm">Termos de Serviço</a>
            <a href="#" className="text-gray-400 hover:text-gray-300 text-sm">Política de Privacidade</a>
            <a href="#" className="text-gray-400 hover:text-gray-300 text-sm">Suporte</a>
          </div>
        </div>
      </div>
      
      {/* Seção de Perguntas Frequentes (FAQ) */}
      {/* <FAQSection /> */}
    </div>
  );
};

// Componente FAQ
const FAQSection = () => {
  const faqs = [
    {
      question: "Como funciona o período de teste de 15 dias?",
      answer: "Você tem acesso completo a todas as funcionalidades do BotFood por 15 dias, sem precisar cadastrar um cartão de crédito. Ao final do período, você poderá escolher assinar um plano para continuar utilizando o sistema."
    },
    {
      question: "Preciso cadastrar meu cartão para o teste?",
      answer: "Não! O teste de 15 dias é totalmente gratuito e sem compromisso. Você só precisará adicionar um método de pagamento se decidir continuar após o período de avaliação."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, mesmo durante o período de teste, você pode decidir não continuar. Se você assinar um plano, também poderá cancelar sua assinatura quando desejar, conforme nossos termos de serviço."
    },
    {
      question: "Quais são as formas de pagamento aceitas?",
      answer: "Aceitamos os principais cartões de crédito. O pagamento é processado de forma segura através do Stripe."
    },
    {
      question: "O BotFood se integra com outros sistemas?",
      answer: "Atualmente, o BotFood é um sistema completo para gestão de restaurantes. Estamos sempre trabalhando em novas funcionalidades e integrações futuras serão comunicadas aos nossos clientes."
    }
  ];

  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="mt-12 py-8">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Perguntas Frequentes</h2>
      <div className="max-w-2xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-gray-800 rounded-lg shadow-md">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center p-5 text-left text-white font-medium focus:outline-none"
            >
              <span>{faq.question}</span>
              <span>{openFAQ === index ? '-' : '+'}</span>
            </button>
            {openFAQ === index && (
              <div className="p-5 border-t border-gray-700">
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Adicionar validação PropTypes para o CheckoutForm
CheckoutForm.propTypes = {
  clientSecret: PropTypes.string.isRequired,
  onComplete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default Checkout;

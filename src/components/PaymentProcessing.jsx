// src/components/PaymentProcessing.jsx
import React, { useState } from 'react';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaCreditCard, FaLock } from 'react-icons/fa';

const PaymentProcessing = ({ 
  customerData, 
  subscriptionData, 
  onSuccess, 
  onError,
  onBack 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const processSubscription = async () => {
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
        // Sucesso - loja criada com período de teste
        onSuccess(data);
      } else {
        setError(data.message || 'Erro ao criar loja e assinatura');
        if (onError) onError(new Error(data.message));
      }
    } catch (err) {
      console.error('Erro ao processar assinatura:', err);
      setError('Falha na conexão com o servidor. Verifique sua internet.');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Finalizar Assinatura
          </h2>
          <p className="text-gray-400">
            Confirme os dados para criar sua loja
          </p>
        </div>

        {/* Resumo da assinatura */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
          <h3 className="text-white font-medium mb-3 flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            Resumo da Assinatura
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Loja:</span>
              <span className="text-white">{customerData.nomeLoja}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Email:</span>
              <span className="text-white">{customerData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">WhatsApp:</span>
              <span className="text-white">{customerData.whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Plano:</span>
              <span className="text-white">{subscriptionData?.planName || 'BotFood Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Valor:</span>
              <span className="text-white">{subscriptionData?.price || 'R$ 199,00'}/mês</span>
            </div>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Teste grátis:</span>
                <span className="text-green-400 font-bold">15 dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Cobrança hoje:</span>
                <span className="text-green-400 font-bold">R$ 0,00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informações sobre pagamento */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
          <h4 className="text-blue-400 font-medium mb-2 flex items-center">
            <FaCreditCard className="mr-2" />
            Sobre o Pagamento
          </h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• 15 dias de teste gratuito</li>
            <li>• Nenhuma cobrança será feita hoje</li>
            <li>• Após o teste, cobrança de R$ 199,00/mês</li>
            <li>• Você pode cancelar a qualquer momento</li>
            <li>• Configuração de método de pagamento opcional</li>
          </ul>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 flex items-start">
            <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Erro ao processar</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          <button
            onClick={processSubscription}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center ${
              loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Criando sua loja...
              </>
            ) : (
              <>
                <FaLock className="mr-2" />
                Criar Loja e Iniciar Teste
              </>
            )}
          </button>

          <button
            onClick={onBack}
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
          >
            ← Voltar para editar dados
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center">
            <FaLock className="mr-1" />
            Seus dados estão seguros e protegidos
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;

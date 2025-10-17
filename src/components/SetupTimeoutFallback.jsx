import { useState } from 'react';
import { FaExclamationTriangle, FaRedo, FaHeadset, FaArrowLeft } from 'react-icons/fa';
import logo from '../assets/logo_chatgpt.png';

const SetupTimeoutFallback = ({ storeName, onRetry, onBackToLogin }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-auto border border-yellow-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="BotFood Logo" className="h-16 w-16 mb-4" />
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-white text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Configuração Demorou Mais Que o Esperado
          </h2>
        </div>

        {/* Mensagem Principal */}
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-300 text-sm leading-relaxed">
            A configuração inicial da loja <strong>{storeName}</strong> está 
            demorando mais que o normal. Isso pode acontecer devido a:
          </p>
          <ul className="text-yellow-300 text-sm mt-3 space-y-1 pl-4">
            <li>• Configuração complexa do sistema</li>
            <li>• Conexão lenta com serviços externos</li>
            <li>• Alto volume de requisições no momento</li>
          </ul>
        </div>

        {/* Opções */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onRetry}
            className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center transition-colors"
          >
            <FaRedo className="mr-2" />
            Tentar Novamente
          </button>

          <button
            onClick={onBackToLogin}
            className="w-full p-3 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-medium flex items-center justify-center transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar ao Login
          </button>
        </div>

        {/* Detalhes Técnicos */}
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showDetails ? 'Ocultar' : 'Mostrar'} detalhes técnicos
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-900 rounded border text-xs text-gray-400 font-mono">
              <p>Status: Setup Timeout</p>
              <p>Loja: {storeName}</p>
              <p>Timestamp: {new Date().toLocaleString()}</p>
              <p>Timeout: 45 segundos</p>
            </div>
          )}
        </div>

        {/* Suporte */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm mb-3">
            Precisa de ajuda?
          </p>
          <a 
            href="mailto:suporte@botfood.com.br"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            <FaHeadset className="mr-2" />
            Contatar Suporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default SetupTimeoutFallback;
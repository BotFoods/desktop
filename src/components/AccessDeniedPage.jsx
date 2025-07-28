import React from 'react';
import { FaLock, FaShieldAlt, FaUserTie, FaEnvelope } from 'react-icons/fa';

/**
 * Componente exibido quando o usuário não tem permissão para acessar uma página
 * Padrão para sistemas SaaS
 */
const AccessDeniedPage = ({ 
  requiredPermission = null, 
  isOwnerOnly = false, 
  pageName = "esta página",
  customMessage = null 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 text-center">
        {/* Ícone Principal */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <FaLock className="text-yellow-500 text-3xl" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Acesso Restrito
        </h1>

        {/* Mensagem Principal */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          {customMessage || `Você não possui as permissões necessárias para acessar ${pageName}.`}
        </p>

        {/* Detalhes da Permissão */}
        {(requiredPermission || isOwnerOnly) && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
            <h3 className="text-white font-semibold mb-3 flex items-center justify-center">
              <FaShieldAlt className="mr-2 text-yellow-400" />
              Detalhes do Acesso
            </h3>
            
            {requiredPermission && (
              <div className="mb-3">
                <span className="text-gray-300 text-sm block mb-1">Permissão necessária:</span>
                <code className="bg-gray-800 text-yellow-300 px-3 py-1 rounded text-sm block">
                  {requiredPermission}
                </code>
              </div>
            )}
            
            {isOwnerOnly && (
              <div className="flex items-center justify-center text-sm text-orange-300">
                <FaUserTie className="mr-2" />
                <span>Acesso exclusivo para proprietários</span>
              </div>
            )}
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-6">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center justify-center">
            <FaEnvelope className="mr-2" />
            O que fazer?
          </h4>
          <p className="text-blue-200 text-sm leading-relaxed">
            Entre em contato com o administrador do sistema ou proprietário da loja para solicitar as permissões necessárias.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Voltar
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Ir para Página Inicial
          </button>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-700">
          <p className="text-gray-500 text-xs">
            Sistema BotFood - Gestão de Restaurantes
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;

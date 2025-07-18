import React from 'react';
import usePermissions from '../hooks/usePermissions';
import { FaLock, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Componente para proteger rotas/conteúdo baseado em permissões
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermission,
  requiredPermissions = [],
  permissionOperator = 'AND',
  ownerOnly = false,
  fallback = null,
  showError = true 
}) => {
  const { hasPermission, hasPermissions, isOwner, loading, error } = usePermissions();

  // Debug logs
  console.log('🔍 ProtectedRoute - Props:', { requiredPermission, requiredPermissions, ownerOnly });
  console.log('🔍 ProtectedRoute - isOwner():', isOwner());
  console.log('🔍 ProtectedRoute - loading:', loading, 'error:', error);

  // Mostrar loading enquanto carrega permissões
  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mr-3" />
        <span className="text-gray-300">Verificando permissões...</span>
      </div>
    );
  }

  // Mostrar erro se houver problema ao carregar permissões
  if (error) {
    return fallback || (
      <div className="flex items-center justify-center p-8 text-red-400">
        <FaExclamationTriangle className="text-2xl mr-3" />
        <span>Erro ao verificar permissões: {error}</span>
      </div>
    );
  }

  // Verificar se é necessário ser owner
  if (ownerOnly && !isOwner()) {
    return fallback || (showError ? (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700">
        <FaLock className="text-yellow-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acesso Restrito</h3>
        <p className="text-gray-300 text-center">
          Esta funcionalidade é exclusiva para proprietários da loja.
        </p>
      </div>
    ) : null);
  }

  // Verificar permissão única
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (showError ? (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700">
        <FaLock className="text-red-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acesso Negado</h3>
        <p className="text-gray-300 text-center">
          Você não tem permissão para acessar esta funcionalidade.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Permissão necessária: <code className="bg-gray-700 px-2 py-1 rounded">{requiredPermission}</code>
        </p>
      </div>
    ) : null);
  }

  // Verificar múltiplas permissões
  if (requiredPermissions.length > 0 && !hasPermissions(requiredPermissions, permissionOperator)) {
    return fallback || (showError ? (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg border border-gray-700">
        <FaLock className="text-red-500 text-4xl mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Acesso Negado</h3>
        <p className="text-gray-300 text-center">
          Você não tem as permissões necessárias para acessar esta funcionalidade.
        </p>
        <div className="text-sm text-gray-400 mt-2">
          <p>Permissões necessárias ({permissionOperator}):</p>
          <ul className="list-disc list-inside mt-1">
            {requiredPermissions.map((perm, index) => (
              <li key={index}>
                <code className="bg-gray-700 px-2 py-1 rounded">{perm}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ) : null);
  }

  // Se chegou até aqui, o usuário tem permissão
  return children;
};

/**
 * Hook para usar verificação de permissão em componentes funcionais
 */
export const useProtectedAction = () => {
  const { hasPermission, hasPermissions, isOwner } = usePermissions();

  const canExecute = (requiredPermission, ownerOnly = false) => {
    if (ownerOnly && !isOwner()) {
      return false;
    }
    return hasPermission(requiredPermission);
  };

  const canExecuteMultiple = (requiredPermissions, operator = 'AND', ownerOnly = false) => {
    if (ownerOnly && !isOwner()) {
      return false;
    }
    return hasPermissions(requiredPermissions, operator);
  };

  return { canExecute, canExecuteMultiple, isOwner };
};

/**
 * HOC para proteger componentes
 */
export const withPermissions = (WrappedComponent, permissionConfig) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...permissionConfig}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

export default ProtectedRoute;

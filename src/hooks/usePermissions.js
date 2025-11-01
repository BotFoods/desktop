import { useCallback } from 'react';
import { useAuth } from '../services/AuthContext';

/**
 * Hook personalizado para gerenciar permissões do usuário
 * Utiliza o AuthContext para evitar requisições desnecessárias
 * As permissões são carregadas no login e armazenadas em localStorage
 */
const usePermissions = () => {
  const { permissoes, user, isValidating } = useAuth();

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param {string} activityName - Nome da atividade
   * @returns {boolean} - Se tem permissão ou não
   */
  const hasPermission = useCallback((activityName) => {
    // Owner sempre tem acesso total
    const isOwnerCheck = user?.is_owner === 1 || user?.is_owner === true || user?.is_owner === "1" || user?.is_owner === "true";
    
    if (isOwnerCheck) {
      return true;
    }

    // Verificar na lista simples de permissões (formato novo)
    if (permissoes?.lista) {
      return Boolean(permissoes.lista[activityName]);
    }

    // Fallback: verificar no formato antigo (se existir)
    if (permissoes && typeof permissoes === 'object') {
      for (const module of Object.values(permissoes)) {
        if (Array.isArray(module)) {
          const activity = module.find(act => act.nome === activityName);
          if (activity) {
            return activity.permitido === 1 || activity.permitido === true;
          }
        }
      }
    }

    return false;
  }, [permissoes, user?.is_owner]);

  /**
   * Verifica se o usuário tem permissão para qualquer atividade de um módulo
   * @param {string} moduleName - Nome do módulo
   * @returns {boolean} - Se tem acesso ao módulo
   */
  const hasModuleAccess = useCallback((moduleName) => {
    // Owner sempre tem acesso total
    const isOwnerCheck = user?.is_owner === 1 || user?.is_owner === true || user?.is_owner === "1" || user?.is_owner === "true";
    
    if (isOwnerCheck) {
      return true;
    }

    // Verificar no formato novo
    if (permissoes?.porModulo && permissoes.porModulo[moduleName]) {
      return permissoes.porModulo[moduleName].length > 0;
    }

    // Fallback: formato antigo
    if (permissoes?.[moduleName]) {
      const modulePermissions = permissoes[moduleName];
      if (Array.isArray(modulePermissions)) {
        return modulePermissions.some(activity => activity.permitido === 1 || activity.permitido === true);
      }
    }

    return false;
  }, [permissoes, user?.is_owner]);

  /**
   * Verifica se o usuário é owner
   * @returns {boolean} - Se é owner
   */
  const isOwner = useCallback(() => {
    const result = user?.is_owner === 1 || user?.is_owner === true || user?.is_owner === "1" || user?.is_owner === "true";
    return result;
  }, [user?.is_owner]);

  /**
   * Obter todas as permissões de um módulo específico
   * @param {string} moduleName - Nome do módulo
   * @returns {Array} - Lista de permissões do módulo
   */
  const getModulePermissions = useCallback((moduleName) => {
    // Formato novo
    if (permissoes?.porModulo) {
      return permissoes.porModulo[moduleName] || [];
    }

    // Fallback: formato antigo
    return permissoes?.[moduleName] || [];
  }, [permissoes]);

  /**
   * Verificar múltiplas permissões ao mesmo tempo
   * @param {Array<string>} activityNames - Lista de nomes de atividades
   * @param {string} operator - 'AND' ou 'OR' (padrão: 'AND')
   * @returns {boolean} - Resultado da verificação
   */
  const hasPermissions = useCallback((activityNames, operator = 'AND') => {
    if (!Array.isArray(activityNames)) {
      return false;
    }

    if (operator === 'OR') {
      return activityNames.some(activityName => hasPermission(activityName));
    } else {
      return activityNames.every(activityName => hasPermission(activityName));
    }
  }, [hasPermission]);

  /**
   * Verifica se pode acessar funcionalidade exclusiva de owner
   * @param {string} activityName - Nome da atividade
   * @returns {boolean}
   */
  const canAccessOwnerOnly = useCallback((activityName) => {
    // Owner sempre pode
    if (isOwner()) return true;

    // Verificar se a atividade é owner-only
    const activity = permissoes?.detalhes?.find(p => p.nome === activityName);
    if (!activity) return false;

    // Se não for owner-only, verificar permissão normal
    return !activity.is_owner_only && hasPermission(activityName);
  }, [permissoes, isOwner, hasPermission]);

  /**
   * Retorna lista de todos os nomes de permissões ativas
   * @returns {string[]}
   */
  const getAllPermissionNames = useCallback(() => {
    if (permissoes?.lista) {
      return Object.keys(permissoes.lista).filter(key => permissoes.lista[key]);
    }
    return [];
  }, [permissoes]);

  /**
   * Retorna lista de módulos disponíveis
   * @returns {string[]}
   */
  const getAvailableModules = useCallback(() => {
    if (permissoes?.porModulo) {
      return Object.keys(permissoes.porModulo);
    }
    
    // Fallback: formato antigo
    if (permissoes && typeof permissoes === 'object') {
      return Object.keys(permissoes).filter(key => Array.isArray(permissoes[key]));
    }
    
    return [];
  }, [permissoes]);

  return {
    // Dados
    permissions: permissoes, // Alias para compatibilidade
    permissoes,
    userInfo: user, // Alias para compatibilidade
    user,
    loading: isValidating,
    error: null, // Não há erro no AuthContext
    
    // Verificações básicas
    hasPermission,
    hasModuleAccess,
    isOwner,
    
    // Obter permissões
    getModulePermissions,
    
    // Verificações múltiplas
    hasPermissions,
    
    // Owner checks
    canAccessOwnerOnly,
    
    // Utilidades
    getAllPermissionNames,
    getAvailableModules,
    
    // Não precisa mais de refresh, o AuthContext gerencia
    refreshPermissions: () => console.log('Permissões são gerenciadas pelo AuthContext')
  };
};

export default usePermissions;

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para gerenciar permissões do usuário
 */
const usePermissions = () => {
  const [permissions, setPermissions] = useState({});
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // Buscar permissões do usuário logado
  const fetchPermissions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Token não disponível');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/permissoes/minhas`, {
        headers: {
          authorization: token
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissoes || {});
        setUserInfo(data.usuario || {});
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar permissões');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar permissões');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param {string} activityName - Nome da atividade
   * @returns {boolean} - Se tem permissão ou não
   */
  const hasPermission = useCallback((activityName) => {
    // Owner sempre tem acesso total (verificar valores 1, true, "1", "true")
    const isOwnerCheck = userInfo.is_owner === 1 || userInfo.is_owner === true || userInfo.is_owner === "1" || userInfo.is_owner === "true";
    
    if (isOwnerCheck) {
      return true;
    }

    // Buscar a atividade em todos os módulos
    for (const module of Object.values(permissions)) {
      const activity = module.find(act => act.nome === activityName);
      if (activity) {
        return activity.permitido === 1 || activity.permitido === true;
      }
    }

    return false;
  }, [permissions, userInfo.is_owner]);

  /**
   * Verifica se o usuário tem permissão para qualquer atividade de um módulo
   * @param {string} moduleName - Nome do módulo
   * @returns {boolean} - Se tem acesso ao módulo
   */
  const hasModuleAccess = useCallback((moduleName) => {
    // Owner sempre tem acesso total (verificar valores 1, true, "1", "true")
    if (userInfo.is_owner === 1 || userInfo.is_owner === true || userInfo.is_owner === "1" || userInfo.is_owner === "true") {
      return true;
    }

    const modulePermissions = permissions[moduleName];
    if (!modulePermissions) {
      return false;
    }

    // Verificar se tem pelo menos uma permissão no módulo
    return modulePermissions.some(activity => activity.permitido === 1 || activity.permitido === true);
  }, [permissions, userInfo.is_owner]);

  /**
   * Verifica se o usuário é owner
   * @returns {boolean} - Se é owner
   */
  const isOwner = useCallback(() => {
    const result = userInfo.is_owner === 1 || userInfo.is_owner === true || userInfo.is_owner === "1" || userInfo.is_owner === "true";
    return result;
  }, [userInfo.is_owner]);

  /**
   * Obter todas as permissões de um módulo específico
   * @param {string} moduleName - Nome do módulo
   * @returns {Array} - Lista de permissões do módulo
   */
  const getModulePermissions = useCallback((moduleName) => {
    return permissions[moduleName] || [];
  }, [permissions]);

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
   * Recarregar permissões
   */
  const refreshPermissions = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    userInfo,
    loading,
    error,
    hasPermission,
    hasModuleAccess,
    isOwner,
    getModulePermissions,
    hasPermissions,
    refreshPermissions
  };
};

export default usePermissions;

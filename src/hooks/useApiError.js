import { useState, useCallback } from 'react';

/**
 * Hook para tratamento padronizado de erros de API
 * Identifica especificamente erros de permissão e formata as mensagens adequadamente
 */
export const useApiError = () => {
  const [errorInfo, setErrorInfo] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
    requiredPermission: null,
    isOwnerOnly: false
  });

  const [accessDenied, setAccessDenied] = useState({
    isBlocked: false,
    requiredPermission: null,
    isOwnerOnly: false,
    pageName: null,
    originalError: null
  });

  /**
   * Processa uma resposta de erro da API e extrai informações relevantes
   * @param {Response|Object} responseOrError - Resposta da API ou objeto de erro
   * @param {string} defaultMessage - Mensagem padrão se não houver mensagem específica
   * @param {Object} options - Opções de configuração
   * @param {boolean} options.blockPage - Se true, bloqueia a página inteira em caso de erro de permissão
   * @param {string} options.pageName - Nome da página para exibição no bloqueio
   */
  const handleApiError = useCallback(async (responseOrError, defaultMessage = 'Ocorreu um erro', options = {}) => {
    const { blockPage = false, pageName = 'esta página' } = options;
    try {
      let errorData = null;
      
      // Se é uma Response do fetch
      if (responseOrError instanceof Response) {
        if (responseOrError.status === 403) {
          try {
            errorData = await responseOrError.json();
          } catch {
            // Se não conseguir fazer parse do JSON, usar dados padrão para 403
            errorData = {
              success: false,
              message: 'Acesso negado. Você não tem permissão para executar esta ação.',
              required_permission: null,
              is_owner_only: 0
            };
          }
        } else {
          try {
            errorData = await responseOrError.json();
          } catch {
            errorData = {
              success: false,
              message: `Erro ${responseOrError.status}: ${responseOrError.statusText}`
            };
          }
        }
      } 
      // Se já é um objeto de erro
      else if (typeof responseOrError === 'object' && responseOrError !== null) {
        errorData = responseOrError;
      }
      // Se é uma string ou outro tipo
      else {
        errorData = {
          success: false,
          message: String(responseOrError) || defaultMessage
        };
      }

      // Determinar se é erro de permissão
      const isPermissionError = errorData.required_permission || errorData.is_owner_only;
      
      // Se for erro de permissão e blockPage for true, bloqueia a página
      if (isPermissionError && blockPage) {
        setAccessDenied({
          isBlocked: true,
          requiredPermission: errorData.required_permission,
          isOwnerOnly: Boolean(errorData.is_owner_only),
          pageName,
          originalError: errorData
        });
        return errorData;
      }

      // Determinar o título e tipo do erro
      let title = 'Erro';
      let type = 'error';
      
      if (isPermissionError) {
        title = 'Acesso Negado';
        type = 'warning';
      }

      // Construir mensagem detalhada para erros de permissão
      let message = errorData.message || defaultMessage;
      
      if (errorData.required_permission) {
        message += `\n\nPermissão necessária: ${errorData.required_permission}`;
      }
      
      if (errorData.is_owner_only) {
        message += '\n\nEsta ação é exclusiva para proprietários da loja.';
      }

      setErrorInfo({
        isOpen: true,
        title,
        message,
        type,
        requiredPermission: errorData.required_permission || null,
        isOwnerOnly: Boolean(errorData.is_owner_only)
      });

      return errorData;
    } catch (error) {
      setErrorInfo({
        isOpen: true,
        title: 'Erro',
        message: defaultMessage,
        type: 'error',
        requiredPermission: null,
        isOwnerOnly: false
      });
      return { success: false, message: defaultMessage };
    }
  }, []);

  /**
   * Exibe um erro customizado
   * @param {string} message - Mensagem do erro
   * @param {string} title - Título do erro
   * @param {string} type - Tipo do erro (error, warning, info)
   */
  const showError = useCallback((message, title = 'Erro', type = 'error') => {
    setErrorInfo({
      isOpen: true,
      title,
      message,
      type,
      requiredPermission: null,
      isOwnerOnly: false
    });
  }, []);

  /**
   * Fecha o modal de erro
   */
  const closeError = useCallback(() => {
    setErrorInfo(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  /**
   * Limpa o estado de bloqueio de acesso
   */
  const clearAccessDenied = useCallback(() => {
    setAccessDenied({
      isBlocked: false,
      requiredPermission: null,
      isOwnerOnly: false,
      pageName: '',
      originalError: null
    });
  }, []);

  return {
    errorInfo,
    accessDenied,
    handleApiError,
    showError,
    closeError,
    clearAccessDenied
  };
};

export default useApiError;

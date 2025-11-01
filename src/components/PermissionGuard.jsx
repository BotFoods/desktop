import PropTypes from 'prop-types';
import usePermissions from '../hooks/usePermissions';

/**
 * Componente para renderizar conteúdo baseado em permissões
 * 
 * @example
 * // Verificar uma permissão
 * <PermissionGuard permission="produtos">
 *   <ProdutosComponent />
 * </PermissionGuard>
 * 
 * @example
 * // Verificar múltiplas permissões (todas necessárias)
 * <PermissionGuard permissions={['produtos', 'categorias']} requireAll>
 *   <ProdutosCategorias />
 * </PermissionGuard>
 * 
 * @example
 * // Verificar múltiplas permissões (qualquer uma)
 * <PermissionGuard permissions={['produtos', 'categorias']}>
 *   <CatalogoComponent />
 * </PermissionGuard>
 * 
 * @example
 * // Verificar acesso ao módulo
 * <PermissionGuard module="caixa">
 *   <CaixaComponent />
 * </PermissionGuard>
 * 
 * @example
 * // Apenas para owners
 * <PermissionGuard ownerOnly>
 *   <ConfiguracoesAvancadas />
 * </PermissionGuard>
 * 
 * @example
 * // Com fallback customizado
 * <PermissionGuard permission="produtos" fallback={<SemPermissao />}>
 *   <ProdutosComponent />
 * </PermissionGuard>
 */
const PermissionGuard = ({ 
  permission,
  permissions,
  module,
  ownerOnly = false,
  requireAll = false,
  fallback = null,
  children 
}) => {
  const { 
    hasPermission, 
    hasPermissions, 
    hasModuleAccess, 
    isOwner 
  } = usePermissions();

  // Verificar owner-only
  if (ownerOnly && !isOwner()) {
    return fallback;
  }

  // Verificar módulo
  if (module && !hasModuleAccess(module)) {
    return fallback;
  }

  // Verificar permissão única
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Verificar múltiplas permissões
  if (permissions && Array.isArray(permissions)) {
    const operator = requireAll ? 'AND' : 'OR';
    if (!hasPermissions(permissions, operator)) {
      return fallback;
    }
  }

  return children;
};

PermissionGuard.propTypes = {
  permission: PropTypes.string,
  permissions: PropTypes.arrayOf(PropTypes.string),
  module: PropTypes.string,
  ownerOnly: PropTypes.bool,
  requireAll: PropTypes.bool,
  fallback: PropTypes.node,
  children: PropTypes.node.isRequired
};

export default PermissionGuard;

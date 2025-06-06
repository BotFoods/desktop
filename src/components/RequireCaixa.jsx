import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { verificarCaixaAberto } from '../services/CaixaService';
import LoadingSpinner from '../components/LoadingSpinner';

const RequireCaixa = ({ children }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  
  useEffect(() => {
    const validarCaixa = async () => {
      if (!user || !token || !user.loja_id) {
        setIsValidating(false);
        return;
      }

      try {
        const data = await verificarCaixaAberto(user.id, token, user.loja_id);
        if (!data.success || data.caixas.length === 0 || data.caixas[0].data_fechamento !== null) {
          // Nenhum caixa aberto encontrado, redirecionar para a página de caixa
          navigate('/caixa');
          return;
        }
        
        // Caixa aberto encontrado, permitir acesso
        setIsValidating(false);
      } catch (error) {
        console.error('Erro ao verificar caixa:', error);
        navigate('/caixa');
      }
    };

    validarCaixa();
  }, [user, token, navigate]);

  if (isValidating) {
    return (
      <div className="bg-gray-900 text-white flex flex-col min-h-screen">
        <LoadingSpinner 
          fullScreen={true}
          size="xl"
          message="Verificando caixa aberto..."
        />
      </div>
    );
  }

  return children;
};

export default RequireCaixa;

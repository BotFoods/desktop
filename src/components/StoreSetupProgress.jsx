import { useState, useEffect } from 'react';
import { FaStore, FaCog, FaServer, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import logo from '../assets/logo_chatgpt.png';

const StoreSetupProgress = ({ storeName, onTimeout, onComplete, credentials }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const setupSteps = [
    {
      id: 1,
      title: 'Verificando configurações da loja',
      description: 'Validando dados da loja no sistema',
      icon: FaStore,
      estimatedTime: 3000
    },
    {
      id: 2,
      title: 'Configurando sistema de pedidos online',
      description: 'Criando fila de notificações para delivery',
      icon: FaCog,
      estimatedTime: 5000
    },
    {
      id: 3,
      title: 'Sincronizando com serviços externos',
      description: 'Configurando integração com Google Cloud',
      icon: FaServer,
      estimatedTime: 4000
    },
    {
      id: 4,
      title: 'Finalizando configuração inicial',
      description: 'Preparando ambiente para uso',
      icon: FaCheckCircle,
      estimatedTime: 2000
    }
  ];

  // Timeout de segurança (45 segundos total)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
    }, 45000);

    return () => clearTimeout(timeout);
  }, [onTimeout]);

  // Quando completar todas as etapas, fazer login real
  useEffect(() => {
    if (progress === 100 && onComplete && credentials) {
      
      // Esperar 2 segundos para mostrar que completou, depois fazer login
      setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            credentials: 'include',
          });

          const data = await response.json();
          
          if (data.auth) {
            onComplete(data);
          } else {
            // Se login falhar, chamar timeout
            if (onTimeout) onTimeout();
          }
        } catch (error) {
          console.error('🔧 Erro no login real:', error);
          if (onTimeout) onTimeout();
        }
      }, 2000);
    }
  }, [progress, onComplete, credentials, onTimeout]);

  // Simular progresso das etapas
  useEffect(() => {
    if (currentStep < setupSteps.length) {
      const currentStepData = setupSteps[currentStep];
      const timer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentStepData.id]);
        setCurrentStep(prev => prev + 1);
        setProgress(((currentStep + 1) / setupSteps.length) * 100);
      }, currentStepData.estimatedTime);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return 'completed';
    } else if (stepId === setupSteps[currentStep]?.id) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto border border-gray-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="BotFood Logo" className="h-16 w-16 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Configuração Inicial
          </h2>
          <p className="text-gray-400 text-center">
            Configurando <span className="text-blue-400 font-medium">{storeName}</span> pela primeira vez
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Progresso da configuração</span>
            <span className="text-sm text-blue-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-4 mb-8">
          {setupSteps.map((step, index) => {
            const status = getStepStatus(step.id);
            const IconComponent = step.icon;

            return (
              <div 
                key={step.id}
                className={`flex items-start p-4 rounded-lg border transition-all duration-300 ${
                  status === 'completed' 
                    ? 'bg-green-900/20 border-green-700 opacity-75' 
                    : status === 'current'
                    ? 'bg-blue-900/30 border-blue-600 animate-pulse'
                    : 'bg-gray-700/30 border-gray-600 opacity-50'
                }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-lg mr-4 ${
                  status === 'completed'
                    ? 'bg-green-600'
                    : status === 'current'
                    ? 'bg-blue-600'
                    : 'bg-gray-600'
                }`}>
                  {status === 'completed' ? (
                    <FaCheckCircle className="text-white text-lg" />
                  ) : status === 'current' ? (
                    <FaSpinner className="text-white text-lg animate-spin" />
                  ) : (
                    <IconComponent className="text-white text-lg" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-medium mb-1 ${
                    status === 'completed' 
                      ? 'text-green-400'
                      : status === 'current'
                      ? 'text-blue-400'
                      : 'text-gray-400'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${
                    status === 'current' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>

                {status === 'current' && (
                  <div className="flex-shrink-0 ml-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-blue-400 font-medium mb-1">
                Por que isso está acontecendo?
              </h4>
              <p className="text-blue-300 text-sm leading-relaxed">
                Esta é a primeira vez que <strong>{storeName}</strong> acessa o sistema. 
                Estamos configurando automaticamente todos os serviços necessários para 
                receber pedidos online e gerenciar seu restaurante.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com estimativa */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Tempo estimado: 15-30 segundos • Não feche esta janela
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoreSetupProgress;
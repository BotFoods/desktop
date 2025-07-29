import React from 'react';
import DownloadButton from '../components/DownloadButton';
import { FiShield, FiZap, FiHeadphones, FiStar } from 'react-icons/fi';

const DownloadPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              BotFoods Desktop
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              A solução completa para gestão do seu estabelecimento de alimentos
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-blue-800 px-4 py-2 rounded-full flex items-center">
                <FiShield className="w-4 h-4 mr-2" />
                100% Seguro
              </span>
              <span className="bg-blue-800 px-4 py-2 rounded-full flex items-center">
                <FiZap className="w-4 h-4 mr-2" />
                Download Rápido
              </span>
              <span className="bg-blue-800 px-4 py-2 rounded-full flex items-center">
                <FiHeadphones className="w-4 h-4 mr-2" />
                Suporte Incluso
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="container mx-auto px-4 py-16">
        <DownloadButton />
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Por que escolher o BotFoods Desktop?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nossa solução desktop oferece recursos avançados para otimizar a gestão do seu negócio
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiZap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Performance Superior</h3>
            <p className="text-gray-600">
              Interface rápida e responsiva, otimizada para uso intensivo em estabelecimentos movimentados.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiShield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Segurança Avançada</h3>
            <p className="text-gray-600">
              Seus dados protegidos com criptografia de ponta e backup automático na nuvem.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiStar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Funcionalidades Premium</h3>
            <p className="text-gray-600">
              Relatórios avançados, integração com equipamentos fiscais e muito mais.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiHeadphones className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Suporte Especializado</h3>
            <p className="text-gray-600">
              Equipe técnica especializada pronta para ajudar sempre que precisar.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiZap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Atualizações Automáticas</h3>
            <p className="text-gray-600">
              Sempre atualizado com as últimas funcionalidades e correções de segurança.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FiStar className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Fácil de Usar</h3>
            <p className="text-gray-600">
              Interface intuitiva que reduz o tempo de treinamento da sua equipe.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                Qual a diferença entre versão portável e instalador?
              </h3>
              <p className="text-gray-600">
                A versão portável não requer instalação - basta baixar e executar. 
                O instalador integra o aplicativo ao Windows, criando atalhos e 
                associações de arquivo.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                O aplicativo funciona offline?
              </h3>
              <p className="text-gray-600">
                Sim! Muitas funcionalidades funcionam offline. Os dados são 
                sincronizados automaticamente quando a conexão é restaurada.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                Como obter suporte técnico?
              </h3>
              <p className="text-gray-600">
                Nosso suporte está disponível através do sistema integrado no 
                aplicativo ou pelo site oficial. Oferecemos suporte via chat, 
                email e telefone.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                As atualizações são gratuitas?
              </h3>
              <p className="text-gray-600">
                Sim! Todas as atualizações de funcionalidades e segurança são 
                gratuitas e aplicadas automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 BotFoods. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;

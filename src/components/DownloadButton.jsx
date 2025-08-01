import React, { useState, useEffect } from 'react';
import { FiDownload, FiMonitor, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

const DownloadButton = ({ simplified = false, className = '', buttonText }) => {
  // Verifica se está no ambiente Electron
  const isElectron = window && window.electronAPI !== undefined;
  
  // Não renderiza o componente se estiver no Electron
  if (isElectron) {
    return null;
  }
  
  // Se for simplified=true, mostra apenas o botão de download direto
  if (simplified) {
    // URL direta para o download do aplicativo
    const downloadUrl = 'https://storage.botfoods.com.br/downloads/BotFoods-Desktop-Setup.exe';
    
    return (
      <a 
        href={downloadUrl} 
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ${className}`}
        target="_blank" 
        rel="noopener noreferrer"
      >
        <FiMonitor className="mr-1" />
        <FiDownload className="mr-1" />
        {buttonText || 'Baixar aplicativo desktop'}
      </a>
    );
  }
  
  // Versão completa do componente com info da versão
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLatestRelease();
  }, []);

  const fetchLatestRelease = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        'https://api.github.com/repos/BotFoods/botfoods-desktop/releases/latest'
      );
      
      if (!response.ok) {
        throw new Error('Não foi possível buscar a versão mais recente');
      }
      
      const release = await response.json();
      
      // Filtrar assets para pegar apenas os arquivos relevantes
      const assets = release.assets.filter(asset => 
        asset.name.endsWith('.exe') || asset.name.endsWith('.zip')
      );
      
      const portableAsset = assets.find(asset => 
        asset.name.includes('Portable') && asset.name.endsWith('.exe')
      );
      
      const installerAsset = assets.find(asset => 
        asset.name.includes('Setup') && asset.name.endsWith('.exe')
      );
      
      setDownloadInfo({
        version: release.tag_name,
        publishedAt: release.published_at,
        description: release.body,
        downloadCount: assets.reduce((sum, asset) => sum + asset.download_count, 0),
        portable: portableAsset,
        installer: installerAsset,
        allAssets: assets
      });
    } catch (error) {
      console.error('Erro ao buscar release:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (asset, type) => {
    setDownloading(true);
    
    try {
      // Registrar download para analytics (opcional)
      await registerDownload(downloadInfo.version, type);
      
      // Abrir link de download
      window.open(asset.browser_download_url, '_blank');
      
    } catch (error) {
      console.error('Erro no download:', error);
    } finally {
      setDownloading(false);
    }
  };

  const registerDownload = async (version, type) => {
    try {
      // Implementar analytics se necessário
      console.log(`Download registrado: ${version} - ${type}`);
    } catch (error) {
      console.error('Erro ao registrar download:', error);
    }
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FiRefreshCw className="animate-spin w-6 h-6 mr-2" />
        <span>Buscando versão mais recente...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar download</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchLatestRelease}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!downloadInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-yellow-800 font-semibold mb-2">Nenhuma versão disponível</h3>
        <p className="text-yellow-600">
          Ainda não há versões disponíveis para download.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center mb-2">
          <FiMonitor className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">BotFoods Desktop</h2>
            <p className="text-blue-100">Sistema completo para gestão de estabelecimentos</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <span className="bg-blue-800 px-3 py-1 rounded-full">
            Versão {downloadInfo.version}
          </span>
          <span className="flex items-center">
            <FiCheckCircle className="w-4 h-4 mr-1" />
            Windows 10/11
          </span>
        </div>
      </div>

      {/* Download Options */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          
          {/* Portable Version */}
          {downloadInfo.portable && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center mb-3">
                <div className="bg-green-600 text-white p-2 rounded-lg mr-3">
                  <FiDownload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Versão Portável</h3>
                  <p className="text-sm text-green-600">Recomendado - Não requer instalação</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Tamanho: {formatFileSize(downloadInfo.portable.size)}</p>
                <p>Execute diretamente sem instalar</p>
              </div>
              
              <button 
                onClick={() => handleDownload(downloadInfo.portable, 'portable')}
                disabled={downloading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {downloading ? (
                  <FiRefreshCw className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <FiDownload className="w-4 h-4 mr-2" />
                )}
                Download Portável
              </button>
            </div>
          )}

          {/* Installer Version */}
          {downloadInfo.installer && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center mb-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                  <FiDownload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Instalador</h3>
                  <p className="text-sm text-blue-600">Instalação completa no sistema</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p>Tamanho: {formatFileSize(downloadInfo.installer.size)}</p>
                <p>Cria atalhos e integração com Windows</p>
              </div>
              
              <button 
                onClick={() => handleDownload(downloadInfo.installer, 'installer')}
                disabled={downloading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {downloading ? (
                  <FiRefreshCw className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <FiDownload className="w-4 h-4 mr-2" />
                )}
                Download Instalador
              </button>
            </div>
          )}
        </div>

        {/* Release Info */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Lançado em: {formatDate(downloadInfo.publishedAt)}</span>
            <span>{downloadInfo.downloadCount} downloads</span>
          </div>
          
          {/* System Requirements */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-2">Requisitos do Sistema</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Windows 10 ou superior (64-bit)</li>
              <li>• 4GB RAM mínimo (8GB recomendado)</li>
              <li>• 500MB espaço livre em disco</li>
              <li>• Conexão com internet para sincronização</li>
            </ul>
          </div>

          {/* Features */}
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-blue-800 mb-2">Principais Recursos</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Gestão completa de pedidos e vendas</li>
              <li>• Integração com impressoras térmicas</li>
              <li>• Suporte a múltiplas formas de pagamento</li>
              <li>• Relatórios detalhados e dashboard</li>
              <li>• Sincronização em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

import PropTypes from 'prop-types';

DownloadButton.propTypes = {
  simplified: PropTypes.bool,
  className: PropTypes.string,
  buttonText: PropTypes.string
};

export default DownloadButton;

import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const PrinterConfigCard = ({ 
    type, 
    config, 
    printerTypes, 
    onEdit, 
    onRemove, 
    onTest, 
    isTestingPrinter, 
    getConnectionIcon, 
    getPrinterTypeColor 
}) => {
    const [expanded, setExpanded] = useState(false);
      const printerInfo = printerTypes[type] || { name: type, description: 'Tipo desconhecido' };
    
    // Formatação da data do último teste
    const formatLastTested = (dateString) => {
        if (!dateString) return 'Nunca testado';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    };

    // Status do último teste
    const getTestStatus = () => {
        if (!config.lastTested) {
            return { color: 'text-gray-400', text: 'Não testado' };
        }
        
        if (config.lastStatus === 'success') {
            return { color: 'text-green-400', text: 'Funcionando' };
        } else {
            return { color: 'text-red-400', text: 'Com problemas' };
        }
    };

    const testStatus = getTestStatus();

    return (
        <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Badge do tipo de impressora */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPrinterTypeColor(type)}`}>
                        {printerInfo.name}
                    </div>
                    
                    {/* Ícone de conexão */}
                    <div className="flex items-center space-x-2">
                        {getConnectionIcon(config.connectionType)}
                        <span className="text-gray-300 text-sm capitalize">
                            {config.connectionType}
                        </span>
                    </div>
                    
                    {/* Status do teste */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                            config.lastStatus === 'success' ? 'bg-green-500' : 
                            config.lastStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className={`text-sm ${testStatus.color}`}>
                            {testStatus.text}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {/* Botão expandir/recolher */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title={expanded ? 'Recolher' : 'Expandir'}
                    >
                        {expanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    
                    {/* Botão testar */}
                    <button
                        onClick={onTest}
                        disabled={isTestingPrinter}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center transition duration-150"
                        title="Testar impressora"
                    >
                        {isTestingPrinter ? (
                            <>
                                <FaSpinner className="animate-spin mr-1" />
                                Testando...
                            </>
                        ) : (
                            <>
                                <FaCheck className="mr-1" />
                                Testar
                            </>
                        )}
                    </button>
                    
                    {/* Botão editar */}
                    <button
                        onClick={onEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded text-sm transition duration-150"
                        title="Editar configuração"
                    >
                        <FaEdit />
                    </button>
                    
                    {/* Botão remover */}
                    <button
                        onClick={onRemove}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm transition duration-150"
                        title="Remover impressora"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
            
            {/* Detalhes expandidos */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h4 className="font-medium text-white mb-2">Configuração de Conexão</h4>
                            {config.connectionType === 'network' && (
                                <>
                                    <p className="text-gray-300">IP: <span className="text-white">{config.ip}</span></p>
                                    <p className="text-gray-300">Porta: <span className="text-white">{config.port}</span></p>
                                </>
                            )}
                            {config.connectionType === 'usb' && (
                                <>
                                    <p className="text-gray-300">Vendor ID: <span className="text-white">{config.vendorId}</span></p>
                                    <p className="text-gray-300">Product ID: <span className="text-white">{config.productId}</span></p>
                                </>
                            )}
                            {config.connectionType === 'serial' && (
                                <>
                                    <p className="text-gray-300">Porta COM: <span className="text-white">{config.comPort}</span></p>
                                    <p className="text-gray-300">Baud Rate: <span className="text-white">{config.baudRate || '9600'}</span></p>
                                </>
                            )}
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-white mb-2">Informações</h4>
                            <p className="text-gray-300">Nome: <span className="text-white">{config.name || printerInfo.name}</span></p>
                            <p className="text-gray-300">Descrição: <span className="text-white">{printerInfo.description}</span></p>
                            <p className="text-gray-300">Configurado em: <span className="text-white">
                                {config.createdAt ? new Date(config.createdAt).toLocaleString('pt-BR') : 'N/A'}
                            </span></p>
                            <p className="text-gray-300">Último teste: <span className="text-white">
                                {formatLastTested(config.lastTested)}
                            </span></p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrinterConfigCard;

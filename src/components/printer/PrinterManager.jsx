import React, { useState, useEffect } from 'react';
import { FaPlus, FaPrint, FaCheck, FaExclamationTriangle, FaTrash, FaEdit, FaCog, FaTimes, FaUsb, FaWifi, FaPlug } from 'react-icons/fa';
import PrinterConfigCard from './PrinterConfigCard';
import PrinterConfigModal from './PrinterConfigModal';
import { printerService } from '../../services/printerService';

const PrinterManager = () => {
    const [printers, setPrinters] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState(null);
    const [testingPrinter, setTestingPrinter] = useState(null);
    const [message, setMessage] = useState(null);    useEffect(() => {
        loadPrinters();
    }, []);

    const loadPrinters = async () => {
        try {
            const allPrinters = await printerService.loadPrinters();
            setPrinters(allPrinters);
        } catch (error) {
            console.error('Erro ao carregar impressoras:', error);
            showMessage('Erro ao carregar impressoras', 'error');
        }
    };

    // Abrir modal para nova impressora
    const handleAddPrinter = () => {
        setEditingPrinter(null);
        setIsModalOpen(true);
    };    // Abrir modal para editar impressora
    const handleEditPrinter = (type, config) => {
        setEditingPrinter(type);
        setIsModalOpen(true);
    };    // Salvar configuração da impressora
    const handleSavePrinter = async (type, config) => {
        try {
            await printerService.configurePrinter(type, config);
            await loadPrinters();
            setIsModalOpen(false);
            setEditingPrinter(null);
            showMessage('Impressora configurada com sucesso!', 'success');
        } catch (error) {
            showMessage(`Erro ao configurar impressora: ${error.message}`, 'error');
        }
    };    // Remover impressora
    const handleRemovePrinter = async (type) => {
        if (window.confirm('Tem certeza que deseja remover esta impressora?')) {
            try {
                await printerService.removePrinter(type);
                await loadPrinters();
                showMessage('Impressora removida com sucesso!', 'success');
            } catch (error) {
                showMessage(`Erro ao remover impressora: ${error.message}`, 'error');
            }
        }
    };    // Testar impressora
    const handleTestPrinter = async (type) => {
        setTestingPrinter(type);
        try {
            const result = await printerService.testPrint(type);
            showMessage(result, 'success');
            await loadPrinters(); // Recarregar para atualizar status
        } catch (error) {
            showMessage(`Erro no teste: ${error.message}`, 'error');
        } finally {
            setTestingPrinter(null);
        }
    };

    // Mostrar mensagem temporária
    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    // Obter ícone do tipo de conexão
    const getConnectionIcon = (type) => {
        switch (type) {
            case 'usb': return <FaUsb className="text-blue-500" />;
            case 'network': return <FaWifi className="text-green-500" />;
            case 'serial': return <FaPlug className="text-orange-500" />;
            default: return <FaCog className="text-gray-500" />;
        }
    };

    // Obter cor do tipo de impressora
    const getPrinterTypeColor = (type) => {
        const colors = {
            'balcao': 'bg-blue-500',
            'caixa': 'bg-green-500',
            'cozinha': 'bg-orange-500',
            'delivery': 'bg-purple-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    const printerTypes = printerService.getPrinterTypes();

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <FaPrint className="mr-3 text-blue-500" />
                    Gerenciamento de Impressoras
                </h1>
                <button
                    onClick={handleAddPrinter}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center transition duration-150"
                >
                    <FaPlus className="mr-2" />
                    Nova Impressora
                </button>
            </div>

            {/* Mensagem de status */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                    message.type === 'success' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                    {message.type === 'success' ? (
                        <FaCheck className="mr-2" />
                    ) : (
                        <FaTimes className="mr-2" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Lista de impressoras configuradas */}
            <div className="space-y-4 mb-6">
                {Object.entries(printers).map(([type, config]) => (
                    <PrinterConfigCard
                        key={type}
                        type={type}
                        config={config}
                        printerTypes={printerTypes}
                        onEdit={() => handleEditPrinter(type, config)}
                        onRemove={() => handleRemovePrinter(type)}
                        onTest={() => handleTestPrinter(type)}
                        isTestingPrinter={testingPrinter === type}
                        getConnectionIcon={getConnectionIcon}
                        getPrinterTypeColor={getPrinterTypeColor}
                    />
                ))}
            </div>

            {/* Impressoras disponíveis para configurar */}
            {Object.keys(printers).length < Object.keys(printerTypes).length && (
                <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Tipos de Impressora Disponíveis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(printerTypes)
                            .filter(([type]) => !printers[type])
                            .map(([type, info]) => (
                                <div
                                    key={type}
                                    className="bg-gray-600 p-4 rounded-lg border-l-4 border-gray-400"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-white">{info.name}</h4>
                                            <p className="text-sm text-gray-400">{info.description}</p>
                                        </div>                                        <button
                                            onClick={() => {
                                                setEditingPrinter(type);
                                                setIsModalOpen(true);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-150"
                                        >
                                            Configurar
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Informações de ajuda */}
            <div className="mt-8 bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                    💡 Dicas de Configuração
                </h3>
                <div className="space-y-3 text-gray-300">
                    <div className="flex items-start space-x-3">
                        <FaUsb className="text-blue-500 mt-1" />
                        <div>
                            <strong>USB:</strong> Conecte a impressora diretamente ao computador via cabo USB.
                            O sistema detectará automaticamente as impressoras disponíveis.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <FaWifi className="text-green-500 mt-1" />
                        <div>
                            <strong>Rede:</strong> Configure o IP e porta da impressora de rede.
                            Certifique-se de que a impressora está conectada à mesma rede.
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <FaPlug className="text-orange-500 mt-1" />
                        <div>
                            <strong>Serial:</strong> Use para impressoras com conexão serial (COM).
                            Verifique a porta COM no Gerenciador de Dispositivos do Windows.
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de configuração */}
            {isModalOpen && (
                <PrinterConfigModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingPrinter(null);
                    }}
                    onSave={handleSavePrinter}
                    editingPrinter={editingPrinter}
                    printerTypes={printerTypes}
                    existingPrinters={Object.keys(printers)}
                />
            )}
        </div>
    );
};

export default PrinterManager;

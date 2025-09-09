import React, { useState, useEffect } from 'react';
import printerService from '../../services/printerService';
import PrinterConfigModal from './PrinterConfigModal';
import PrinterConfigCard from './PrinterConfigCard';

const PrinterManager = ({ showMessage }) => {
    const [printers, setPrinters] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState(null);
    const [testingPrinter, setTestingPrinter] = useState(null);

    useEffect(() => {
        loadPrinters();
    }, []);

    const loadPrinters = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await printerService.loadPrinters();
            setPrinters(result || {});
        } catch (error) {
            setError('Erro ao carregar configurações');
            setPrinters({});
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrinter = () => {
        setEditingPrinter(null);
        setIsModalOpen(true);
    };

    const handleEditPrinter = (type) => {
        setEditingPrinter(type);
        setIsModalOpen(true);
    };

    const handleSavePrinter = async (type, config) => {
        try {
            await printerService.configurePrinter(type, config);
            await loadPrinters();
            setIsModalOpen(false);
            setEditingPrinter(null);
            showMessage?.('Impressora configurada com sucesso!', 'success');
        } catch (error) {
            showMessage?.(`Erro ao configurar impressora: ${error.message}`, 'error');
        }
    };

    const handleRemovePrinter = async (type) => {
        if (window.confirm('Tem certeza que deseja remover esta impressora?')) {
            try {
                await printerService.removePrinter(type);
                await loadPrinters();
                showMessage?.('Impressora removida com sucesso!', 'success');
            } catch (error) {
                showMessage?.(`Erro ao remover impressora: ${error.message}`, 'error');
            }
        }
    };

    const handleTestPrinter = async (type) => {
        setTestingPrinter(type);
        try {
            await printerService.testPrint(type);
            showMessage?.('Teste de impressão enviado!', 'success');
        } catch (error) {
            showMessage?.(`Erro no teste: ${error.message}`, 'error');
        } finally {
            setTestingPrinter(null);
        }
    };

    const printerTypes = [
        { id: 'receipt', name: 'Recibo/Cupom', description: 'Para cupons fiscais e recibos' },
        { id: 'kitchen', name: 'Cozinha', description: 'Para pedidos da cozinha' },
        { id: 'delivery', name: 'Delivery', description: 'Para pedidos de entrega' },
        { id: 'table', name: 'Mesa', description: 'Para comandas de mesa' }
    ];

    if (loading && !Object.keys(printers).length) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Carregando configurações...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <div className="text-red-600 mb-4">{error}</div>
                <button 
                    onClick={loadPrinters}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Configuração de Impressoras</h2>
                <div className="space-x-2">
                    <button
                        onClick={loadPrinters}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        disabled={loading}
                    >
                        {loading ? 'Carregando...' : 'Atualizar'}
                    </button>
                    <button
                        onClick={handleAddPrinter}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + Nova Impressora
                    </button>
                </div>
            </div>

            {/* Lista de impressoras */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {printerTypes.map(type => {
                    const config = printers[type.id];
                    return (
                        <PrinterConfigCard
                            key={type.id}
                            type={type.id}
                            name={type.name}
                            description={type.description}
                            config={config}
                            isConfigured={!!config}
                            isTesting={testingPrinter === type.id}
                            onEdit={() => handleEditPrinter(type.id)}
                            onRemove={() => handleRemovePrinter(type.id)}
                            onTest={() => handleTestPrinter(type.id)}
                        />
                    );
                })}
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
                    editingType={editingPrinter}
                    currentConfig={editingPrinter ? printers[editingPrinter] : null}
                    availablePrinters={[]} // Simplificado
                />
            )}
        </div>
    );
};

export default PrinterManager;

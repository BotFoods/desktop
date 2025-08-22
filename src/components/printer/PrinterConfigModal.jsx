import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaSearch, FaUsb, FaWifi, FaPhone, FaPrint, FaSync } from 'react-icons/fa';
import { printerService } from '../../services/printerService';

const PrinterConfigModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    editingPrinter = null,
    existingPrinters = [],
    serviceStatus: parentServiceStatus = null,
    availablePrinters: parentAvailablePrinters = []
}) => {
    const [formData, setFormData] = useState({
        type: '',
        connectionType: 'system', // Padrão para serviço externo
        printerName: '', // Nome da impressora selecionada
        ip: '',
        port: '9100',
        vendorId: '',
        productId: '',
        serialPort: '',
        baudRate: '9600',
        encoding: 'UTF8',
        width: '48',
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [usbDevices, setUsbDevices] = useState([]);
    const [availablePrinters, setAvailablePrinters] = useState([]);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [errors, setErrors] = useState({});    useEffect(() => {
        if (isOpen) {
            // Usar dados do parent se disponíveis, senão buscar
            if (parentServiceStatus && parentAvailablePrinters.length > 0) {
                setServiceStatus(parentServiceStatus);
                setAvailablePrinters(parentAvailablePrinters);
                setLoadingPrinters(false);
            } else {
                checkServiceAndLoadPrinters();
            }
        }
    }, [isOpen, parentServiceStatus, parentAvailablePrinters]);

    useEffect(() => {
        if (editingPrinter && printerService) {
            const config = printerService.getPrinterConfig(editingPrinter);
            if (config) {
                setFormData({
                    type: editingPrinter,
                    connectionType: config.connectionType || 'system',
                    printerName: config.printerName || config.name || '',
                    ip: config.ip || '',
                    port: config.port || '9100',
                    vendorId: config.vendorId || '',
                    productId: config.productId || '',
                    serialPort: config.serialPort || '',
                    baudRate: config.baudRate || '9600',
                    encoding: config.encoding || 'UTF8',
                    width: config.width || '48',
                    description: config.description || ''
                });
            } else {
                // If no config exists, just set the type for new configuration
                setFormData(prev => ({ ...prev, type: editingPrinter }));
            }
        } else {
            setFormData({
                type: '',
                connectionType: 'system',
                printerName: '',
                ip: '',
                port: '9100',
                vendorId: '',
                productId: '',
                serialPort: '',
                baudRate: '9600',
                encoding: 'UTF8',
                width: '48',
                description: ''
            });
        }
    }, [editingPrinter]);

    const checkServiceAndLoadPrinters = async () => {
        setLoadingPrinters(true);
        try {
            // Verificar status do serviço
            const status = await printerService.checkPrinterServiceStatus();
            setServiceStatus(status);

            if (status.available) {
                // Carregar impressoras disponíveis
                const printers = await printerService.loadAvailablePrinters();
                setAvailablePrinters(printers);
            }
        } catch (error) {
            console.error('Erro ao verificar serviço de impressão:', error);
            setServiceStatus({ available: false, error: error.message });
        } finally {
            setLoadingPrinters(false);
        }
    };

    const refreshPrinters = async () => {
        await checkServiceAndLoadPrinters();
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };    const scanUSBDevices = async () => {
        setLoading(true);
        try {
            const devices = await printerService.scanUSBPrinters();
            setUsbDevices(devices);
        } catch (error) {
            console.error('Erro ao escanear dispositivos USB:', error);
        }
        setLoading(false);
    };    const validateForm = () => {
        const newErrors = {};

        if (!formData.type) {
            newErrors.type = 'Tipo de impressora é obrigatório';
        } else if (!editingPrinter && existingPrinters.includes(formData.type)) {
            newErrors.type = 'Este tipo de impressora já está configurado';
        }

        if (formData.connectionType === 'system') {
            if (!formData.printerName) {
                newErrors.printerName = 'Impressora é obrigatória';
            }
        }

        if (formData.connectionType === 'network') {
            if (!formData.ip) {
                newErrors.ip = 'IP é obrigatório';
            } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ip)) {
                newErrors.ip = 'IP inválido';
            }
            
            if (!formData.port) {
                newErrors.port = 'Porta é obrigatória';
            } else if (isNaN(formData.port) || formData.port < 1 || formData.port > 65535) {
                newErrors.port = 'Porta inválida (1-65535)';
            }
        }

        if (formData.connectionType === 'usb') {
            if (!formData.vendorId) {
                newErrors.vendorId = 'Vendor ID é obrigatório';
            }
            if (!formData.productId) {
                newErrors.productId = 'Product ID é obrigatório';
            }
        }

        if (formData.connectionType === 'serial') {
            if (!formData.serialPort) {
                newErrors.serialPort = 'Porta serial é obrigatória';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Extract type from formData and pass separately
        const { type, ...config } = formData;
        onSave(type, config);
    };

    const availableTypes = printerService ? 
        Object.keys(printerService.getPrinterTypes()).filter(type => 
            editingPrinter === type || !existingPrinters.includes(type)
        ) : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {editingPrinter ? 'Editar' : 'Adicionar'} Impressora
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Impressora */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tipo de Impressora *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                errors.type ? 'border border-red-500' : ''
                            }`}
                            disabled={!!editingPrinter}
                        >
                            <option value="">Selecione o tipo</option>
                            {availableTypes.map(type => (
                                <option key={type} value={type}>
                                    {printerService ? printerService.getPrinterTypeName(type) : type}
                                </option>
                            ))}
                        </select>
                        {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
                    </div>

                    {/* Tipo de Conexão */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tipo de Conexão *
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { value: 'system', label: 'Sistema', icon: FaPrint },
                                { value: 'network', label: 'Rede', icon: FaWifi },
                                { value: 'usb', label: 'USB', icon: FaUsb },
                                { value: 'serial', label: 'Serial', icon: FaPhone }
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleInputChange('connectionType', value)}
                                    className={`p-3 rounded border-2 transition-colors flex flex-col items-center space-y-2 ${
                                        formData.connectionType === value
                                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                                    }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-sm font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status do Serviço de Impressão */}
                    {formData.connectionType === 'system' && (
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-300">
                                    Status do Serviço de Impressão
                                </h3>
                                <button
                                    type="button"
                                    onClick={refreshPrinters}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                    disabled={loadingPrinters}
                                >
                                    <FaSync className={loadingPrinters ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            
                            {serviceStatus ? (
                                <div className={`text-sm ${serviceStatus.available ? 'text-green-400' : 'text-red-400'}`}>
                                    {serviceStatus.available ? (
                                        <>
                                            <div className="flex items-center mb-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                ✅ Serviço Online - Versão {serviceStatus.version} (Porta {serviceStatus.port})
                                            </div>
                                            {!loadingPrinters && (
                                                <div className="text-gray-300 text-xs">
                                                    {availablePrinters.length > 0 
                                                        ? `${availablePrinters.length} impressora(s) disponível(is)`
                                                        : 'Nenhuma impressora encontrada'
                                                    }
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                            ❌ Serviço Offline - {serviceStatus.error}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-sm flex items-center">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                                    Verificando status do serviço...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Seleção de Impressora do Sistema */}
                    {formData.connectionType === 'system' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Impressora *
                            </label>
                            
                            {loadingPrinters ? (
                                <div className="p-3 rounded bg-gray-600 text-white w-full flex items-center justify-center">
                                    <FaSync className="animate-spin mr-2" />
                                    Carregando impressoras...
                                </div>
                            ) : (
                                <select
                                    value={formData.printerName}
                                    onChange={(e) => handleInputChange('printerName', e.target.value)}
                                    className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                        errors.printerName ? 'border border-red-500' : ''
                                    }`}
                                    disabled={!serviceStatus?.available}
                                >
                                    <option value="">
                                        {serviceStatus?.available 
                                            ? availablePrinters.length > 0 
                                                ? 'Selecione uma impressora' 
                                                : 'Nenhuma impressora encontrada'
                                            : 'Serviço indisponível'
                                        }
                                    </option>
                                    {Array.isArray(availablePrinters) && availablePrinters.map((printer, index) => {
                                        // Garantir que printer seja uma string válida
                                        let printerName = '';
                                        
                                        if (typeof printer === 'string') {
                                            printerName = printer;
                                        } else if (printer && typeof printer === 'object') {
                                            printerName = printer.displayName || printer.name || `Impressora ${index + 1}`;
                                        } else {
                                            printerName = `Impressora ${index + 1}`;
                                        }
                                        
                                        // Verificar se o nome é válido
                                        if (!printerName || printerName.trim() === '') {
                                            return null;
                                        }
                                        
                                        return (
                                            <option key={`printer-${index}-${printerName}`} value={printerName}>
                                                {printerName}
                                            </option>
                                        );
                                    }).filter(Boolean)}
                                </select>
                            )}
                            
                            {errors.printerName && <p className="text-red-400 text-sm mt-1">{errors.printerName}</p>}
                            
                            {!serviceStatus?.available && !loadingPrinters && (
                                <p className="text-yellow-400 text-sm mt-2">
                                    ⚠️ Certifique-se de que o serviço de impressão está rodando na porta 8000
                                </p>
                            )}
                            
                            {serviceStatus?.available && availablePrinters.length === 0 && !loadingPrinters && (
                                <p className="text-yellow-400 text-sm mt-2">
                                    ⚠️ Nenhuma impressora encontrada no sistema
                                </p>
                            )}
                        </div>
                    )}

                    {/* Configurações de Rede */}
                    {formData.connectionType === 'network' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Endereço IP *
                                </label>
                                <input
                                    type="text"
                                    value={formData.ip}
                                    onChange={(e) => handleInputChange('ip', e.target.value)}
                                    placeholder="192.168.1.100"
                                    className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                        errors.ip ? 'border border-red-500' : ''
                                    }`}
                                />
                                {errors.ip && <p className="text-red-400 text-sm mt-1">{errors.ip}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Porta *
                                </label>
                                <input
                                    type="number"
                                    value={formData.port}
                                    onChange={(e) => handleInputChange('port', e.target.value)}
                                    placeholder="9100"
                                    min="1"
                                    max="65535"
                                    className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                        errors.port ? 'border border-red-500' : ''
                                    }`}
                                />
                                {errors.port && <p className="text-red-400 text-sm mt-1">{errors.port}</p>}
                            </div>
                        </div>
                    )}

                    {/* Configurações USB */}
                    {formData.connectionType === 'usb' && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-300">
                                    Dispositivos USB
                                </label>
                                <button
                                    type="button"
                                    onClick={scanUSBDevices}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Escaneando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <FaSearch className="mr-1" />
                                            Escanear
                                        </span>
                                    )}
                                </button>
                            </div>

                            {usbDevices.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <p className="text-sm text-gray-400">Dispositivos encontrados:</p>
                                    {usbDevices.map((device, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => {
                                                handleInputChange('vendorId', device.vendorId);
                                                handleInputChange('productId', device.productId);
                                            }}
                                            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition-colors"
                                        >
                                            <div className="text-sm text-white">
                                                {device.manufacturer} {device.product}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                VID: {device.vendorId} | PID: {device.productId}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Vendor ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vendorId}
                                        onChange={(e) => handleInputChange('vendorId', e.target.value)}
                                        placeholder="04b8"
                                        className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                            errors.vendorId ? 'border border-red-500' : ''
                                        }`}
                                    />
                                    {errors.vendorId && <p className="text-red-400 text-sm mt-1">{errors.vendorId}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Product ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.productId}
                                        onChange={(e) => handleInputChange('productId', e.target.value)}
                                        placeholder="0202"
                                        className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                            errors.productId ? 'border border-red-500' : ''
                                        }`}
                                    />
                                    {errors.productId && <p className="text-red-400 text-sm mt-1">{errors.productId}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configurações Serial */}
                    {formData.connectionType === 'serial' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Porta Serial *
                                </label>
                                <input
                                    type="text"
                                    value={formData.serialPort}
                                    onChange={(e) => handleInputChange('serialPort', e.target.value)}
                                    placeholder="COM1 ou /dev/ttyUSB0"
                                    className={`p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none ${
                                        errors.serialPort ? 'border border-red-500' : ''
                                    }`}
                                />
                                {errors.serialPort && <p className="text-red-400 text-sm mt-1">{errors.serialPort}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Baud Rate
                                </label>
                                <select
                                    value={formData.baudRate}
                                    onChange={(e) => handleInputChange('baudRate', e.target.value)}
                                    className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="9600">9600</option>
                                    <option value="19200">19200</option>
                                    <option value="38400">38400</option>
                                    <option value="57600">57600</option>
                                    <option value="115200">115200</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Configurações Avançadas */}
                    <div className="border-t border-gray-600 pt-4">
                        <h3 className="text-lg font-medium text-white mb-4">Configurações Avançadas</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Codificação
                                </label>
                                <select
                                    value={formData.encoding}
                                    onChange={(e) => handleInputChange('encoding', e.target.value)}
                                    className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="UTF8">UTF-8</option>
                                    <option value="ASCII">ASCII</option>
                                    <option value="ISO-8859-1">ISO-8859-1</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Largura (caracteres)
                                </label>
                                <input
                                    type="number"
                                    value={formData.width}
                                    onChange={(e) => handleInputChange('width', e.target.value)}
                                    min="20"
                                    max="80"
                                    className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Descrição (opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Ex: Impressora do balcão principal"
                                className="p-3 rounded bg-gray-600 text-white w-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition duration-150 ease-in-out flex items-center justify-center"
                        >
                            <FaSave className="mr-2" />
                            {editingPrinter ? 'Atualizar' : 'Salvar'} Configuração
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded transition duration-150 ease-in-out"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrinterConfigModal;

// PrinterService for Electron Renderer Process
// This service communicates with the API and main process via IPC
// Note: We don't import node-thermal-printer directly in the renderer process
// as it depends on Node.js core modules not available in the browser environment

export class PrinterService {
    static PRINTER_TYPES = {
        BALCAO: 'balcao',
        CAIXA: 'caixa', 
        COZINHA: 'cozinha',
        DELIVERY: 'delivery'
    };

    constructor() {
        this.electronAPI = window.electronAPI;
        this.API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        this.PRINTER_SERVICE_URL = 'http://localhost:8000'; // Serviço externo de impressão
        this.printers = {};
        this.availablePrinters = []; // Lista de impressoras disponíveis do serviço
        this.init();
    }    // Inicializar serviço
    async init() {
        try {
            // Carregar impressoras configuradas da API/localStorage
            this.printers = await this.loadPrinters();
            
            // Carregar impressoras disponíveis do serviço externo
            await this.loadAvailablePrinters();
        } catch (error) {
            console.warn('Falha ao carregar impressoras da API, usando localStorage:', error);
            this.printers = this.loadPrintersFromLocalStorage();
            
            // Tentar carregar impressoras disponíveis mesmo se a API falhar
            try {
                await this.loadAvailablePrinters();
            } catch (printerServiceError) {
                console.warn('Serviço de impressão não disponível:', printerServiceError);
                this.availablePrinters = [];
            }
        }
    }

    // Carregar impressoras disponíveis do serviço externo
    async loadAvailablePrinters() {
        try {
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/printers`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Serviço de impressão não disponível`);
            }

            const data = await response.json();
            
            // Tratar diferentes formatos de resposta
            let printers = [];
            if (data.printers && Array.isArray(data.printers)) {
                // Se vier no formato { printers: [...] }
                printers = data.printers;
            } else if (Array.isArray(data)) {
                // Se vier diretamente como array
                printers = data;
            }

            // Converter objetos para strings se necessário
            this.availablePrinters = printers.map(printer => {
                if (typeof printer === 'string') {
                    return printer;
                } else if (printer && typeof printer === 'object') {
                    // Usar displayName ou name, o que estiver disponível
                    return printer.displayName || printer.name || printer.toString();
                }
                return printer.toString();
            }).filter(name => name && name.trim() !== '');

            console.log('Impressoras disponíveis processadas:', this.availablePrinters);
            return this.availablePrinters;
        } catch (error) {
            console.error('Erro ao carregar impressoras do serviço:', error);
            this.availablePrinters = [];
            throw error;
        }
    }

    // Obter impressoras disponíveis do serviço
    getAvailablePrinters() {
        return this.availablePrinters;
    }

    // Verificar se o serviço está disponível
    async checkPrinterServiceStatus() {
        try {
            const response = await fetch(`${this.PRINTER_SERVICE_URL}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return { available: false, error: `HTTP ${response.status}` };
            }

            const data = await response.json();
            return { 
                available: true, 
                status: data.status,
                version: data.version,
                port: data.port 
            };
        } catch (error) {
            return { 
                available: false, 
                error: error.message 
            };
        }
    }

    // Obter dados do usuário armazenados
    getStoredUserData() {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    // Obter token de autenticação
    getAuthToken() {
        const userData = this.getStoredUserData();
        return userData?.token || localStorage.getItem('token');
    }    // Headers para requisições à API
    getApiHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        };
    }// Carregar impressoras da API
    async loadPrinters() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn('Sem token de autenticação, usando localStorage');
                this.printers = this.loadPrintersFromLocalStorage();
                return this.printers;
            }            const response = await fetch(`${this.API_BASE_URL}/api/impressoras`, {
                headers: this.getApiHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                // Converter para formato compatível com localStorage (backup)
                const printersMap = {};
                result.data.forEach(printer => {
                    printersMap[printer.tipo_impressora] = {
                        id: printer.id,
                        connectionType: printer.tipo_conexao,
                        ip: printer.ip,
                        port: printer.porta,
                        vendorId: printer.vendor_id,
                        productId: printer.product_id,
                        serialPort: printer.porta_serial,
                        baudRate: printer.baud_rate,
                        encoding: printer.encoding,
                        width: printer.largura,
                        description: printer.descricao,
                        isActive: printer.ativo,
                        lastTested: printer.ultimo_teste,
                        lastStatus: printer.status_ultimo_teste,
                        createdAt: printer.criado_em,
                        name: printer.nome
                    };
                });
                // Atualizar cache interno e salvar backup no localStorage
                this.printers = printersMap;
                localStorage.setItem('printer_configurations', JSON.stringify(printersMap));
                return printersMap;
            }

            throw new Error(result.message || 'Erro ao carregar impressoras');
        } catch (error) {
            console.error('Erro ao carregar impressoras da API:', error);
            // Fallback para localStorage
            this.printers = this.loadPrintersFromLocalStorage();
            return this.printers;
        }
    }    // Fallback para localStorage
    loadPrintersFromLocalStorage() {
        try {
            const saved = localStorage.getItem('printer_configurations');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Erro ao carregar configurações do localStorage:', error);
            return {};
        }
    }

    // Salvar impressoras no localStorage (fallback)
    savePrinters() {
        try {
            localStorage.setItem('printer_configurations', JSON.stringify(this.printers));
        } catch (error) {
            console.error('Erro ao salvar configurações no localStorage:', error);
        }
    }    // Configurar nova impressora
    async configurePrinter(type, config) {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn('Sem token de autenticação, salvando apenas no localStorage');
                // Fallback direto para localStorage
                this.printers[type] = {
                    ...config,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    lastTested: null,
                    isActive: true,
                    printerName: config.printerName || config.name // Garantir nome da impressora
                };
                this.savePrinters();
                return this.printers[type];
            }

            // Mapear tipos de conexão para valores aceitos pela API
            const connectionTypeMap = {
                'system': 'usb', // Impressora do sistema é tratada como USB
                'network': 'network',
                'usb': 'usb', 
                'serial': 'serial'
            };

            const mappedConnectionType = connectionTypeMap[config.connectionType] || 'usb';

            // Para impressoras do sistema, usar valores padrão para USB
            let vendor_id = config.vendorId;
            let product_id = config.productId;
            
            if (config.connectionType === 'system') {
                // Valores padrão para impressoras do sistema
                vendor_id = vendor_id || '0000';
                product_id = product_id || '0000';
            }

            const apiConfig = {
                tipo_impressora: type,
                nome: config.name || config.printerName || `Impressora ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                descricao: config.description || '',
                tipo_conexao: mappedConnectionType,
                ip: config.ip || null,
                porta: config.port || null,
                vendor_id: vendor_id || null,
                product_id: product_id || null,
                porta_serial: config.serialPort || null,
                baud_rate: config.baudRate || 9600,
                encoding: config.encoding || 'UTF8',
                largura: config.width || 48,
                nome_impressora: config.printerName || config.name // Nome da impressora do sistema
            };

            const response = await fetch(`${this.API_BASE_URL}/api/impressoras`, {
                method: 'POST',
                headers: this.getApiHeaders(),
                credentials: 'include',
                body: JSON.stringify(apiConfig)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Atualizar cache local
                this.printers[type] = {
                    ...config,
                    id: result.data.id,
                    createdAt: result.data.criado_em,
                    lastTested: null,
                    isActive: true,
                    printerName: config.printerName || config.name,
                    name: config.name || config.printerName
                };

                // Salvar backup no localStorage
                localStorage.setItem('printer_configurations', JSON.stringify(this.printers));
                return this.printers[type];
            }

            throw new Error(result.message || 'Erro ao configurar impressora');
        } catch (error) {
            console.error('Erro ao configurar impressora via API:', error);

            // Fallback para localStorage
            this.printers[type] = {
                ...config,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastTested: null,
                isActive: true,
                printerName: config.printerName || config.name,
                name: config.name || config.printerName
            };
            this.savePrinters();
            return this.printers[type];
        }
    }

    // Obter todas as impressoras
    getAllPrinters() {
        return this.printers;
    }    // Obter impressora por tipo
    getPrinter(type) {
        return this.printers[type] || null;
    }

    // Alias para compatibilidade
    getPrinterConfig(type) {
        return this.getPrinter(type);
    }

    // Obter nome do tipo de impressora
    getPrinterTypeName(type) {
        const types = this.getPrinterTypes();
        return types[type]?.name || type;
    }

    // Listar impressoras USB - alias para compatibilidade
    async listUSBPrinters() {
        return this.scanUSBPrinters();
    }    // Remover impressora por tipo
    async removePrinter(type) {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn('Sem token de autenticação, removendo apenas do localStorage');
                // Fallback direto para localStorage
                if (this.printers[type]) {
                    delete this.printers[type];
                    this.savePrinters();
                    return true;
                }
                return false;
            }            const response = await fetch(`${this.API_BASE_URL}/api/impressoras/tipo/${type}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: this.getApiHeaders()
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Remover do cache local
                if (this.printers[type]) {
                    delete this.printers[type];
                    localStorage.setItem('printer_configurations', JSON.stringify(this.printers));
                }
                return true;
            }

            throw new Error(result.message || 'Erro ao remover impressora');
        } catch (error) {
            console.error('Erro ao remover impressora via API:', error);

            // Fallback para localStorage
            if (this.printers[type]) {
                delete this.printers[type];
                this.savePrinters();
                return true;
            }
            return false;
        }
    }

    // Limpar todas as configurações (para desenvolvimento/testes)
    clearAllPrinters() {
        this.printers = {};
        this.savePrinters();
    }

    // Atualizar status da impressora
    updatePrinterStatus(type, status) {
        if (this.printers[type]) {
            this.printers[type].lastTested = new Date().toISOString();
            this.printers[type].lastStatus = status;
            this.savePrinters();
        }
    }    // Testar impressão
    async testPrint(type) {
        const printerConfig = this.getPrinter(type);
        if (!printerConfig) {
            throw new Error('Impressora não configurada');
        }

        try {
            // Verifica se o serviço externo está disponível
            const serviceStatus = await this.checkPrinterServiceStatus();
            if (!serviceStatus.available) {
                throw new Error(`Serviço de impressão não disponível: ${serviceStatus.error}`);
            }

            // Monta dados de teste
            const testData = {
                printerName: printerConfig.name || printerConfig.printerName,
                content: [
                    {
                        value: "=== TESTE DE IMPRESSÃO ===",
                        style: {
                            textAlign: "center",
                            fontSize: "24px",
                            fontWeight: "700"
                        }
                    },
                    {
                        value: "BotFood Desktop",
                        style: {
                            textAlign: "center",
                            fontSize: "18px"
                        }
                    },
                    {
                        value: "",
                        style: {}
                    },
                    {
                        value: `Tipo: ${this.getPrinterTypeName(type)}`,
                        style: {
                            textAlign: "left",
                            fontSize: "16px"
                        }
                    },
                    {
                        value: `Data: ${new Date().toLocaleDateString('pt-BR')}`,
                        style: {
                            textAlign: "left",
                            fontSize: "16px"
                        }
                    },
                    {
                        value: `Hora: ${new Date().toLocaleTimeString('pt-BR')}`,
                        style: {
                            textAlign: "left",
                            fontSize: "16px"
                        }
                    },
                    {
                        value: "",
                        style: {}
                    },
                    {
                        value: "Teste realizado com sucesso!",
                        style: {
                            textAlign: "center",
                            fontSize: "18px",
                            fontWeight: "700"
                        }
                    }
                ]
            };

            // Envia para o serviço externo
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ${response.status} no serviço de impressão`);
            }

            const result = await response.json();

            // Registrar teste bem-sucedido na API e atualizar status local
            await this.logPrintTest(type, 'success', null);
            this.updatePrinterStatus(type, 'success');
            
            return result.message || 'Teste de impressão realizado com sucesso';

        } catch (error) {
            // Registrar erro na API e atualizar status local
            await this.logPrintTest(type, 'error', error.message);
            this.updatePrinterStatus(type, 'error');
            throw error;
        }
    }    // Registrar teste de impressão na API
    async logPrintTest(type, status, errorMessage = null) {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.warn('Token não encontrado para registrar log de teste');
                return;
            }            const response = await fetch(`${this.API_BASE_URL}/api/impressoras/tipo/${type}/test`, {
                method: 'POST',
                headers: this.getApiHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    status,
                    erro: errorMessage
                })
            });

            if (!response.ok) {
                console.warn('Falha ao registrar log de teste na API');
            }
        } catch (error) {
            console.warn('Erro ao registrar log de teste na API:', error);
        }
    }

    // Imprimir cupom/comanda
    async printReceipt(type, data) {
        const printerConfig = this.getPrinter(type);
        if (!printerConfig) {
            throw new Error('Impressora não configurada');
        }

        try {
            // Verifica se o serviço externo está disponível
            const serviceStatus = await this.checkPrinterServiceStatus();
            if (!serviceStatus.available) {
                throw new Error(`Serviço de impressão não disponível: ${serviceStatus.error}`);
            }

            // Converte dados do recibo para formato do serviço externo
            const printData = {
                printerName: printerConfig.name || printerConfig.printerName,
                content: this.convertReceiptDataToContent(data)
            };

            // Envia para o serviço externo
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ${response.status} no serviço de impressão`);
            }

            const result = await response.json();
            return result.message || 'Impressão realizada com sucesso';

        } catch (error) {
            throw error;
        }
    }

    // Converte dados do recibo para o formato aceito pelo serviço externo
    convertReceiptDataToContent(data) {
        const content = [];

        // Título
        if (data.title) {
            content.push({
                value: data.title,
                style: {
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "700"
                }
            });
            content.push({ value: "", style: {} }); // Linha em branco
        }

        // Informações do cabeçalho
        if (data.header) {
            Object.entries(data.header).forEach(([key, value]) => {
                content.push({
                    value: `${key}: ${value}`,
                    style: {
                        textAlign: "left",
                        fontSize: "16px"
                    }
                });
            });
            content.push({ value: "", style: {} }); // Linha em branco
        }

        // Itens
        if (data.items && data.items.length > 0) {
            content.push({
                value: "=== ITENS ===",
                style: {
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "700"
                }
            });

            data.items.forEach(item => {
                content.push({
                    value: `${item.quantity || 1}x ${item.name}`,
                    style: {
                        textAlign: "left",
                        fontSize: "16px"
                    }
                });
                
                if (item.price) {
                    content.push({
                        value: `   R$ ${item.price.toFixed(2)}`,
                        style: {
                            textAlign: "right",
                            fontSize: "16px"
                        }
                    });
                }
            });
            content.push({ value: "", style: {} }); // Linha em branco
        }

        // Total
        if (data.total) {
            content.push({
                value: `TOTAL: R$ ${data.total.toFixed(2)}`,
                style: {
                    textAlign: "right",
                    fontSize: "20px",
                    fontWeight: "700"
                }
            });
            content.push({ value: "", style: {} }); // Linha em branco
        }

        // Rodapé
        if (data.footer) {
            if (Array.isArray(data.footer)) {
                data.footer.forEach(line => {
                    content.push({
                        value: line,
                        style: {
                            textAlign: "center",
                            fontSize: "14px"
                        }
                    });
                });
            } else {
                content.push({
                    value: data.footer,
                    style: {
                        textAlign: "center",
                        fontSize: "14px"
                    }
                });
            }
        }

        // Data e hora
        content.push({
            value: `Data: ${new Date().toLocaleString('pt-BR')}`,
            style: {
                textAlign: "center",
                fontSize: "14px"
            }
        });

        return content;
    }

    // Buscar impressoras USB disponíveis
    async scanUSBPrinters() {
        try {
            // Tentar buscar do serviço externo primeiro
            await this.loadAvailablePrinters();
            
            // Retornar impressoras encontradas pelo serviço
            return this.availablePrinters.map(printerName => ({
                name: printerName,
                manufacturer: 'Sistema',
                product: printerName,
                connectionType: 'system'
            }));

        } catch (error) {
            console.error('Erro ao buscar impressoras do serviço:', error);
            
            // Fallback para impressoras simuladas
            console.warn('Serviço de impressão não disponível - retornando dados simulados');
            return [
                {
                    name: 'Impressora Padrão (Simulada)',
                    manufacturer: 'Sistema',
                    product: 'Impressora Padrão do Sistema',
                    connectionType: 'system'
                }
            ];
        }
    }

    // Tipos de impressora disponíveis
    getPrinterTypes() {
        return {
            'balcao': {
                name: 'Balcão',
                description: 'Impressora para cupons no balcão de atendimento',
                color: 'blue'
            },
            'caixa': {
                name: 'Caixa',
                description: 'Impressora para cupons fiscais e recibos',
                color: 'green'
            },
            'cozinha': {
                name: 'Cozinha',
                description: 'Impressora para comandas da cozinha',
                color: 'orange'
            },
            'delivery': {
                name: 'Delivery',
                description: 'Impressora para cupons de entrega',
                color: 'purple'
            }
        };
    }

    // Verificar se está executando no Electron
    isElectronEnvironment() {
        return !!(window.electronAPI?.printer);
    }

    // Método para desenvolvimento - simula operações de impressão
    async simulatePrinterOperation(operation, type, data = null) {
        const printerConfig = this.getPrinter(type);
        if (!printerConfig) {
            throw new Error('Impressora não configurada');
        }

        // Simula delay de operação
        await new Promise(resolve => setTimeout(resolve, 1000));

        switch (operation) {
            case 'test':
                this.updatePrinterStatus(type, 'success');
                return 'Teste simulado com sucesso (modo desenvolvimento)';
            case 'print':
                return 'Impressão simulada com sucesso (modo desenvolvimento)';
            default:
                throw new Error('Operação não suportada');
        }
    }

    /**
     * Método para impressão direta usando o serviço externo
     * @param {string} text - Texto a ser impresso
     * @param {string} printerType - Tipo da impressora (balcao, caixa, cozinha, delivery)
     * @param {function} onSuccess - Callback chamado em caso de sucesso
     * @param {function} onError - Callback chamado em caso de erro
     */
    async printDirectly(text, printerType, onSuccess = null, onError = null) {
        try {
            const printerConfig = this.getPrinter(printerType);
            if (!printerConfig) {
                throw new Error(`Impressora ${printerType} não configurada`);
            }

            // Usar o serviço externo como padrão
            try {
                const result = await this._printViaExternalService(text, printerConfig, onSuccess, onError);
                return result;
            } catch (error) {
                console.error(`Erro ao imprimir via serviço externo: ${error.message}`);
                
                // Fallback para outros métodos se disponíveis
                if (this.isElectronEnvironment()) {
                    console.log("Tentando fallback para processo principal...");
                    return await this._printDirectImplementation(text, printerConfig, onSuccess, onError);
                } else {
                    console.log("Tentando fallback para servidor legado...");
                    return await this._printViaLegacyServer(text, printerConfig, onSuccess, onError);
                }
            }
        } catch (error) {
            console.error(`Erro geral de impressão: ${error.message}`);
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Impressão via serviço externo (porta 8000)
     */
    async _printViaExternalService(text, printerConfig, onSuccess, onError) {
        try {
            // Verificar se o serviço está disponível
            const serviceStatus = await this.checkPrinterServiceStatus();
            if (!serviceStatus.available) {
                throw new Error(`Serviço de impressão não disponível: ${serviceStatus.error}`);
            }

            // Converter texto para formato do serviço
            const printData = {
                printerName: printerConfig.printerName || printerConfig.name,
                content: [
                    {
                        value: text,
                        style: {
                            textAlign: "left",
                            fontSize: "16px"
                        }
                    }
                ]
            };

            // Enviar para o serviço externo
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ${response.status} no serviço de impressão`);
            }

            const result = await response.json();
            
            // Registra no log e atualiza status
            this.updatePrinterStatus(printerConfig.type, 'success');
            await this.logPrintTest(printerConfig.type, 'success', null);
            
            // Callback de sucesso
            const printResult = { success: true, message: result.message || 'Impressão realizada com sucesso' };
            if (onSuccess) onSuccess(printResult);
            return printResult;
            
        } catch (error) {
            // Registra erro no log e atualiza status
            this.updatePrinterStatus(printerConfig.type, 'error');
            await this.logPrintTest(printerConfig.type, 'error', error.message);
            
            // Callback de erro
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Implementação interna para impressão direta - agora delegada ao processo principal
     */
    async _printDirectImplementation(text, printerConfig, onSuccess, onError) {
        try {
            // Verificar se está em ambiente Electron
            if (!this.isElectronEnvironment()) {
                throw new Error('Impressão direta só é possível no ambiente Electron');
            }
              // Enviar para o processo principal via IPC
            const printResult = await this.electronAPI.printer.print({
                text,
                printerConfig
            });
            
            // Registra no log e atualiza status
            this.updatePrinterStatus(printerConfig.type, 'success');
            await this.logPrintTest(printerConfig.type, 'success', null);
            
            // Callback de sucesso
            const result = printResult || { success: true, message: 'Impressão realizada com sucesso' };
            if (onSuccess) onSuccess(result);
            return result;
        } catch (error) {
            // Registra erro no log e atualiza status
            this.updatePrinterStatus(printerConfig.type, 'error');
            await this.logPrintTest(printerConfig.type, 'error', error.message);
            
            // Callback de erro
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Método de fallback para impressão via servidor local (legado)
     */
    async _printViaLegacyServer(text, printerConfig, onSuccess, onError) {
        try {
            const response = await fetch('http://localhost:5000/imprimir', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    printer_ip: printerConfig.ip || "192.168.1.100",
                    printer_port: printerConfig.port || 9100
                }),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro desconhecido no servidor de impressão');
            }
            
            // Callback de sucesso
            if (onSuccess) onSuccess(result);
            return result;
        } catch (error) {
            // Callback de erro
            if (onError) onError(error);
            throw error;
        }
    }

    // ==========================================
    // MÉTODOS ABSTRATOS PARA IMPRESSÃO
    // ==========================================

    /**
     * Imprimir pedido para a cozinha
     * @param {Object} orderData - Dados do pedido
     * @param {string} orderData.orderId - ID do pedido  
     * @param {string} orderData.orderType - Tipo: BALCÃO, MESA, DELIVERY
     * @param {Array} orderData.items - Lista de itens do pedido
     * @param {Object} orderData.customer - Dados do cliente (opcional)
     * @param {string} orderData.notes - Observações do pedido
     * @param {string} orderData.mesa - Número da mesa (opcional)
     */
    async printKitchenOrder(orderData) {
        try {
            const receiptData = {
                title: "PEDIDO PARA PREPARO",
                header: {
                    "PEDIDO": orderData.orderId || `#${Date.now()}`,
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR'),
                    "Tipo": orderData.orderType || "BALCÃO"
                },
                items: orderData.items.map(item => ({
                    name: item.nome || item.name,
                    quantity: item.quantidade || item.quantity || 1,
                    observations: item.observacoes || item.observations
                })),
                footer: [
                    "----------------------------------------",
                    `Observações: ${orderData.notes || 'Nenhuma'}`,
                    "----------------------------------------"
                ]
            };

            // Adicionar dados do cliente se for delivery
            if (orderData.orderType === 'DELIVERY' && orderData.customer) {
                receiptData.header["Cliente"] = orderData.customer.nome || orderData.customer.name || 'N/A';
                receiptData.header["Telefone"] = orderData.customer.telefone || orderData.customer.phone || 'N/A';
                receiptData.header["Endereço"] = orderData.customer.endereco || orderData.customer.address || 'N/A';
            }

            // Adicionar número da mesa se aplicável
            if (orderData.mesa) {
                receiptData.header["Mesa"] = `#${orderData.mesa}`;
            }

            return await this.printReceipt('cozinha', receiptData);
        } catch (error) {
            console.error('Erro ao imprimir pedido da cozinha:', error);
            throw error;
        }
    }

    /**
     * Imprimir cupom fiscal do balcão/caixa
     * @param {Object} saleData - Dados da venda
     * @param {Array} saleData.items - Itens vendidos
     * @param {number} saleData.total - Valor total
     * @param {Object} saleData.payment - Informações de pagamento
     * @param {Object} saleData.customer - Dados do cliente (opcional)
     */
    async printSaleReceipt(saleData) {
        try {
            const receiptData = {
                title: "CUPOM FISCAL",
                header: {
                    "VENDA": saleData.saleId || `#${Date.now()}`,
                    "Vendedor": saleData.seller || "Sistema",
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR')
                },
                items: saleData.items.map(item => ({
                    name: item.nome || item.name,
                    quantity: item.quantidade || item.quantity || 1,
                    price: item.preco || item.price || 0
                })),
                total: saleData.total,
                footer: [
                    "----------------------------------------",
                    `Pagamento: ${saleData.payment?.method || 'N/A'}`,
                    saleData.payment?.change ? `Troco: R$ ${saleData.payment.change.toFixed(2)}` : "",
                    "----------------------------------------",
                    "Obrigado pela preferência!",
                    "Volte sempre!"
                ].filter(line => line) // Remove linhas vazias
            };

            // Adicionar dados do cliente se fornecidos
            if (saleData.customer) {
                receiptData.header["Cliente"] = saleData.customer.nome || saleData.customer.name || 'Consumidor';
            }

            return await this.printReceipt('caixa', receiptData);
        } catch (error) {
            console.error('Erro ao imprimir cupom fiscal:', error);
            throw error;
        }
    }

    /**
     * Imprimir comanda de delivery
     * @param {Object} deliveryData - Dados do delivery
     * @param {Array} deliveryData.items - Itens do pedido
     * @param {Object} deliveryData.customer - Dados do cliente
     * @param {Object} deliveryData.delivery - Informações de entrega
     * @param {number} deliveryData.total - Valor total
     */
    async printDeliveryOrder(deliveryData) {
        try {
            const receiptData = {
                title: "PEDIDO DELIVERY",
                header: {
                    "PEDIDO": deliveryData.orderId || `#${Date.now()}`,
                    "Cliente": deliveryData.customer?.nome || deliveryData.customer?.name || 'N/A',
                    "Telefone": deliveryData.customer?.telefone || deliveryData.customer?.phone || 'N/A',
                    "Endereço": deliveryData.customer?.endereco || deliveryData.customer?.address || 'N/A',
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR')
                },
                items: deliveryData.items.map(item => ({
                    name: item.nome || item.name,
                    quantity: item.quantidade || item.quantity || 1,
                    price: item.preco || item.price || 0
                })),
                total: deliveryData.total,
                footer: [
                    "----------------------------------------",
                    `Taxa de Entrega: R$ ${deliveryData.delivery?.fee?.toFixed(2) || '0.00'}`,
                    `Tempo Estimado: ${deliveryData.delivery?.estimatedTime || '30-45 min'}`,
                    `Pagamento: ${deliveryData.payment?.method || 'N/A'}`,
                    deliveryData.payment?.change ? `Troco para: R$ ${deliveryData.payment.change.toFixed(2)}` : "",
                    "----------------------------------------",
                    "Aguarde nosso entregador!",
                    "Acompanhe pelo WhatsApp"
                ].filter(line => line) // Remove linhas vazias
            };

            return await this.printReceipt('delivery', receiptData);
        } catch (error) {
            console.error('Erro ao imprimir pedido delivery:', error);
            throw error;
        }
    }

    /**
     * Imprimir comanda de mesa
     * @param {Object} tableData - Dados da mesa
     * @param {string} tableData.tableNumber - Número da mesa
     * @param {Array} tableData.items - Itens pedidos
     * @param {Object} tableData.customer - Dados do cliente (opcional)
     */
    async printTableOrder(tableData) {
        try {
            const receiptData = {
                title: "COMANDA DE MESA",
                header: {
                    "MESA": `#${tableData.tableNumber}`,
                    "PEDIDO": tableData.orderId || `#${Date.now()}`,
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR')
                },
                items: tableData.items.map(item => ({
                    name: item.nome || item.name,
                    quantity: item.quantidade || item.quantity || 1,
                    price: item.preco || item.price || 0
                })),
                total: tableData.total,
                footer: [
                    "----------------------------------------",
                    `Observações: ${tableData.notes || 'Nenhuma'}`,
                    "----------------------------------------",
                    "Aguarde no balcão para retirada",
                    "ou aguarde na mesa"
                ]
            };

            // Adicionar dados do cliente se fornecidos
            if (tableData.customer) {
                receiptData.header["Cliente"] = tableData.customer.nome || tableData.customer.name || 'Mesa';
            }

            return await this.printReceipt('balcao', receiptData);
        } catch (error) {
            console.error('Erro ao imprimir comanda de mesa:', error);
            throw error;
        }
    }

    /**
     * Método genérico para impressão rápida de texto simples
     * @param {string} text - Texto a ser impresso
     * @param {string} printerType - Tipo da impressora (cozinha, caixa, balcao, delivery)
     * @param {Object} options - Opções adicionais
     */
    async printSimpleText(text, printerType = 'caixa', options = {}) {
        try {
            const receiptData = {
                title: options.title || "",
                header: options.header || {},
                items: [],
                footer: [text],
                customContent: text
            };

            // Se é apenas texto simples, usar o método direto
            if (!options.useStructured) {
                return await this.printDirectly(text, printerType);
            }

            return await this.printReceipt(printerType, receiptData);
        } catch (error) {
            console.error('Erro ao imprimir texto simples:', error);
            throw error;
        }
    }
}

// Instância singleton
const printerService = new PrinterService();
export { printerService };
export default printerService;

// PrinterService for Electron Renderer Process
// This service communicates with the API and main process via IPC

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
        this.printers = {};
        this.init();
    }    // Inicializar serviço
    async init() {
        try {
            this.printers = await this.loadPrinters();
        } catch (error) {
            console.warn('Falha ao carregar impressoras da API, usando localStorage:', error);
            this.printers = this.loadPrintersFromLocalStorage();
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
                    isActive: true
                };
                this.savePrinters();
                return this.printers[type];
            }

            const apiConfig = {
                tipo_impressora: type,
                nome: config.name || `Impressora ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                descricao: config.description || '',
                tipo_conexao: config.connectionType,
                ip: config.ip || null,
                porta: config.port || null,
                vendor_id: config.vendorId || null,
                product_id: config.productId || null,
                porta_serial: config.serialPort || null,
                baud_rate: config.baudRate || 9600,
                encoding: config.encoding || 'UTF8',
                largura: config.width || 48
            };            const response = await fetch(`${this.API_BASE_URL}/api/impressoras`, {
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
                    isActive: true
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
                isActive: true
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
            // Check if running in Electron
            if (!this.isElectronEnvironment()) {
                console.warn('Executando em modo desenvolvimento - simulando impressão');
                const result = await this.simulatePrinterOperation('test', type);
                await this.logPrintTest(type, 'success', null);
                return result;
            }

            const testConfig = {
                connectionType: printerConfig.connectionType,
                ip: printerConfig.ip,
                port: printerConfig.port,
                vendorId: printerConfig.vendorId,
                productId: printerConfig.productId,
                serialPort: printerConfig.serialPort,
                baudRate: printerConfig.baudRate,
                type: this.getPrinterTypeName(type)
            };

            console.log('=== SENDING TO ELECTRON ===');
            console.log('Test config:', JSON.stringify(testConfig, null, 2));
            console.log('Connection type:', testConfig.connectionType);
            console.log('============================');

            const result = await this.electronAPI.printer.testPrint(testConfig);

            // Registrar teste bem-sucedido na API e atualizar status local
            await this.logPrintTest(type, 'success', null);
            this.updatePrinterStatus(type, 'success');
            return result;

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
            // Check if running in Electron
            if (!this.isElectronEnvironment()) {
                console.warn('Executando em modo desenvolvimento - simulando impressão');
                return await this.simulatePrinterOperation('print', type, data);
            }

            return await this.electronAPI.printer.printReceipt(printerConfig, data);

        } catch (error) {
            throw error;
        }
    }

    // Buscar impressoras USB disponíveis
    async scanUSBPrinters() {
        try {
            // Check if running in Electron
            if (!this.isElectronEnvironment()) {
                console.warn('Executando em modo desenvolvimento - retornando dados simulados');
                return [
                    {
                        vendorId: '04b8',
                        productId: '0202',
                        manufacturer: 'Epson',
                        product: 'TM-T20II (Simulado)'
                    },
                    {
                        vendorId: '0416',
                        productId: '5011',
                        manufacturer: 'Bematech',
                        product: 'MP-4200 TH (Simulado)'
                    }
                ];
            }

            return await this.electronAPI.printer.scanUSB();
        } catch (error) {
            console.error('Erro ao buscar impressoras USB:', error);
            return [];
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
}

// Instância singleton
const printerService = new PrinterService();
export { printerService };
export default printerService;

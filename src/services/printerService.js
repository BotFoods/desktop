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
        this.PRINTER_SERVICE_URL = 'http://localhost:3000'; // Serviço de impressão do /service
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
            this.printers = this.loadPrintersFromLocalStorage();
            
            // Tentar carregar impressoras disponíveis mesmo se a API falhar
            try {
                await this.loadAvailablePrinters();
            } catch (printerServiceError) {
                this.availablePrinters = [];
            }
        }
    }

    // Carregar impressoras disponíveis do serviço externo
    async loadAvailablePrinters() {
        try {
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
            
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/api/printers`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Serviço de impressão não disponível`);
            }

            const data = await response.json();
            
            // Tratar diferentes formatos de resposta
            let printers = [];
            if (data.success && data.printers) {
                // Formato do service: { success: true, printers: { system: [...], usb: [...] } }
                if (data.printers.system) {
                    printers = data.printers.system.map(printer => printer.name || printer);
                }
                if (data.printers.usb) {
                    printers = [...printers, ...data.printers.usb.map(printer => printer.name || printer)];
                }
            } else if (data.printers && Array.isArray(data.printers)) {
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

            return this.availablePrinters;
        } catch (error) {
            if (error.name === 'AbortError') {
                this.availablePrinters = [];
                throw new Error('Timeout - Service não responde ao listar impressoras');
            }
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
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
            
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return { available: false, error: `HTTP ${response.status}` };
            }

            const data = await response.json();
            return { 
                available: true, 
                status: data.status,
                timestamp: data.timestamp
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { available: false, error: 'Timeout - Service não responde' };
            }
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
    }

    // Carregar impressoras disponíveis da API do service
    async getServicePrinters() {
        
        try {
            // Simples verificação de service
            const response = await this.makeRequest('/api/printers', {
                method: 'GET',
                timeout: 3000 // Timeout curto
            });
            
            if (!response.success) {
                return null;
            }
            
            return response.data || {};
            
        } catch (error) {
            return null;
        }
    }

    // Carregar impressoras configuradas do localStorage
    async loadPrinters() {
        
        // Primeiro tenta do service
        const servicePrinters = await this.getServicePrinters();
        if (servicePrinters) {
            this.printers = servicePrinters;
            return this.printers;
        }
        
        // Fallback para localStorage
        try {
            this.printers = this.loadPrintersFromLocalStorage();
            return this.printers;
        } catch (error) {
            this.printers = {};
            return this.printers;
        }
    }

    // Fallback para localStorage
    loadPrintersFromLocalStorage() {
        try {
            const saved = localStorage.getItem('printer_configurations');
            const result = saved ? JSON.parse(saved) : {};
            return result;
        } catch (error) {
            return {};
        }
    }

    // Salvar impressoras no localStorage (fallback)
    savePrinters() {
        try {
            localStorage.setItem('printer_configurations', JSON.stringify(this.printers));
        } catch (error) {
        }
    }    // Configurar nova impressora
    async configurePrinter(type, config) {
        try {

            // Para configurações de impressora, vamos apenas mapear localmente
            // qual impressora do sistema será usada para cada tipo
            const printerConfig = {
                ...config,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastTested: null,
                isActive: true,
                printerName: config.printerName || config.name,
                name: config.name || config.printerName
            };

            // Salvar no cache local
            this.printers[type] = printerConfig;
            
            // Salvar no localStorage como backup
            this.savePrinters();
            
            return this.printers[type];

        } catch (error) {
            throw error;
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

            // Remover do cache local
            if (this.printers[type]) {
                delete this.printers[type];
                this.savePrinters();
                return true;
            }
            
            return false;
        } catch (error) {
            throw error;
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

            // Envia para o serviço externo usando o endpoint de teste correto
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/api/printers/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    printerConfig: {
                        name: printerConfig.name || printerConfig.printerName,
                        type: printerConfig.connectionType || 'system'
                    }
                })
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
    }

    // Registrar teste de impressão localmente
    async logPrintTest(type, status, errorMessage = null) {
        try {
            
            // Apenas registrar localmente no status da impressora
            if (this.printers[type]) {
                this.printers[type].lastTested = new Date().toISOString();
                this.printers[type].lastStatus = status;
                this.printers[type].lastError = errorMessage;
                this.savePrinters();
            }
        } catch (error) {
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
            const convertedReceiptData = this.convertToServiceFormat(data);
            
            const printData = {
                printerConfig: {
                    name: printerConfig.name || printerConfig.printerName,
                    type: printerConfig.connectionType || 'system'
                },
                receiptData: convertedReceiptData
            };


            // Envia para o serviço externo usando o endpoint correto
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/api/printers/receipt`, {
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

    // Converte formato do desktop para formato esperado pelo service
    convertToServiceFormat(data) {
        const converted = {
            header: data.title || 'RECIBO',
            items: [],
            total: 0,
            footer: 'Obrigado pela preferência!'
        };

        // Converter itens - MANTER preços originais
        if (data.items && Array.isArray(data.items)) {
            converted.items = data.items.map((item) => ({
                name: item.name || item.nome || 'Item',
                qty: item.quantity || item.quantidade || 1,
                price: parseFloat(item.price || item.preco_unitario || item.valor || 0)
            }));

            // Calcular total baseado nos itens (quantidade × preço)
            converted.total = converted.items.reduce((sum, item) => {
                return sum + (item.qty * item.price);
            }, 0);
        }

        // Se total explícito foi fornecido E é diferente do calculado, 
        // usar o total explícito mas manter os preços individuais
        if (data.total !== undefined && data.total !== null) {
            const totalExplicito = parseFloat(data.total);
            
            if (Math.abs(totalExplicito - converted.total) > 0.01) {
                // Usar o total explícito se houver divergência significativa
                converted.total = totalExplicito;
            }
        }

        // Converter footer
        if (data.footer && Array.isArray(data.footer)) {
            converted.footer = data.footer.join('\n');
        } else if (typeof data.footer === 'string') {
            converted.footer = data.footer;
        }

        return converted;
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
            
            // Fallback para impressoras simuladas
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
                
                // Fallback para outros métodos se disponíveis
                if (this.isElectronEnvironment()) {
                    return await this._printDirectImplementation(text, printerConfig, onSuccess, onError);
                } else {
                    return await this._printViaLegacyServer(text, printerConfig, onSuccess, onError);
                }
            }
        } catch (error) {
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

            // Enviar para o serviço externo usando endpoint system/print
            const response = await fetch(`${this.PRINTER_SERVICE_URL}/api/printers/system/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    printerName: printerConfig.printerName || printerConfig.name,
                    content: text,
                    options: {}
                })
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
            const response = await fetch('http://localhost:3000/api/printers/system/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    printerName: printerConfig.name || printerConfig.ip || "Default Printer",
                    content: text,
                    options: {
                        port: printerConfig.port || 9100
                    }
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
                    "PEDIDO": orderData.orderId || orderData.id || orderData.vendaId || `#${Date.now()}`,
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR'),
                    "Tipo": orderData.orderType || orderData.tipo || "BALCÃO"
                },
                items: (orderData.items || orderData.produtos || orderData.itens || []).map(item => ({
                    name: item.nome || item.name || item.produto_nome || `Produto ID ${item.produto_id || item.id}`,
                    quantity: item.quantidade || item.quantity || 1,
                    price: parseFloat(item.preco_unitario || item.price || item.preco || 0),
                    observations: item.observacoes || item.observations || item.observacao || ''
                })),
                // Calcular total baseado nos itens (quantidade × preço unitário)
                total: (orderData.items || orderData.produtos || orderData.itens || []).reduce((sum, item) => {
                    return sum + ((item.quantidade || item.quantity || 1) * parseFloat(item.preco_unitario || item.price || item.preco || 0));
                }, 0),
                footer: [
                    "----------------------------------------",
                    `Observações: ${orderData.notes || orderData.observacoes || 'Nenhuma'}`,
                    "----------------------------------------"
                ]
            };

            // Adicionar dados do cliente se for delivery
            if ((orderData.orderType === 'DELIVERY' || orderData.tipo === 'DELIVERY') && 
                (orderData.customer || orderData.cliente)) {
                const customer = orderData.customer || orderData.cliente;
                receiptData.header["Cliente"] = customer.nome || customer.name || 'N/A';
                receiptData.header["Telefone"] = customer.telefone || customer.phone || 'N/A';
                receiptData.header["Endereço"] = customer.endereco || customer.address || 'N/A';
            }

            // Adicionar número da mesa se aplicável
            if (orderData.mesa) {
                receiptData.header["Mesa"] = `#${orderData.mesa}`;
            }

            const result = await this.printReceipt('cozinha', receiptData);
            
            return result;
        } catch (error) {
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
                items: (saleData.itens || saleData.items || saleData.produtos || []).map((item) => ({
                    name: item.produto_nome || item.nome || item.name || `Produto ID ${item.produto_id || item.id}`,
                    quantity: item.quantidade || item.quantity || 1,
                    price: parseFloat(item.preco_unitario || item.price || item.preco || 0)
                })),
                // Calcular total baseado nos itens (quantidade × preço unitário)
                total: (saleData.itens || saleData.items || saleData.produtos || []).reduce((sum, item) => {
                    return sum + ((item.quantidade || item.quantity || 1) * parseFloat(item.preco_unitario || item.price || item.preco || 0));
                }, 0),
                footer: [
                    "----------------------------------------",
                    // Mapear métodos de pagamento - compatível com diferentes formatos
                    ...(saleData.pagamentos || []).map(pagamento => {
                        const metodosMap = {
                            1: 'Dinheiro',
                            2: 'Débito', 
                            3: 'Crédito',
                            4: 'Pix'
                        };
                        const metodo = metodosMap[pagamento.metodo_pagamento_id] || 'Outros';
                        return `Pagamento: ${metodo} - R$ ${parseFloat(pagamento.valor_pago || 0).toFixed(2)}`;
                    }),
                    // Mostrar troco se houver
                    ...(saleData.pagamentos || [])
                        .filter(p => (p.valor_troco || 0) > 0)
                        .map(p => `Troco: R$ ${parseFloat(p.valor_troco || 0).toFixed(2)}`),
                    // Fallback para formato simples de pagamento
                    ...((!saleData.pagamentos || saleData.pagamentos.length === 0) && saleData.forma_pagamento ? 
                        [`Pagamento: ${saleData.forma_pagamento}`] : []),
                    "----------------------------------------",
                    "Obrigado pela preferência!",
                    "Volte sempre!"
                ].filter(line => line) // Remove linhas vazias
            };

            // Adicionar dados do cliente se fornecidos (CPF/CNPJ)
            if (saleData.cpfCnpjCliente) {
                receiptData.header["Cliente"] = saleData.cpfCnpjCliente;
            } else if (saleData.clienteId) {
                receiptData.header["Cliente"] = `Cliente ID: ${saleData.clienteId}`;
            }


            const result = await this.printReceipt('caixa', receiptData);
            
            return result;
        } catch (error) {
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
            const customer = deliveryData.customer || deliveryData.cliente || {};
            const delivery = deliveryData.delivery || {};
            const payment = deliveryData.payment || {};
            
            const receiptData = {
                title: "PEDIDO DELIVERY",
                header: {
                    "PEDIDO": deliveryData.orderId || deliveryData.id || deliveryData.vendaId || `#${Date.now()}`,
                    "Cliente": customer.nome || customer.name || 'N/A',
                    "Telefone": customer.telefone || customer.phone || 'N/A',
                    "Endereço": customer.endereco || customer.address || 'N/A',
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR')
                },
                items: (deliveryData.items || deliveryData.produtos || deliveryData.itens || []).map(item => ({
                    name: item.nome || item.name || item.produto_nome || `Produto ID ${item.produto_id || item.id}`,
                    quantity: item.quantidade || item.quantity || 1,
                    price: parseFloat(item.preco_unitario || item.price || item.preco || 0)
                })),
                // Calcular total baseado nos itens (quantidade × preço unitário)
                total: (deliveryData.items || deliveryData.produtos || deliveryData.itens || []).reduce((sum, item) => {
                    return sum + ((item.quantidade || item.quantity || 1) * parseFloat(item.preco_unitario || item.price || item.preco || 0));
                }, 0),
                footer: [
                    "----------------------------------------",
                    `Taxa de Entrega: R$ ${parseFloat(delivery.fee || delivery.taxa || 0).toFixed(2)}`,
                    `Tempo Estimado: ${delivery.estimatedTime || delivery.tempo_estimado || '30-45 min'}`,
                    `Pagamento: ${payment.method || deliveryData.forma_pagamento || 'N/A'}`,
                    (payment.change || deliveryData.troco) ? `Troco para: R$ ${parseFloat(payment.change || deliveryData.troco || 0).toFixed(2)}` : "",
                    "----------------------------------------",
                    "Aguarde nosso entregador!",
                    "Acompanhe pelo WhatsApp"
                ].filter(line => line) // Remove linhas vazias
            };

            const result = await this.printReceipt('delivery', receiptData);
            
            return result;
        } catch (error) {
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
            const customer = tableData.customer || tableData.cliente || {};
            
            const receiptData = {
                title: "COMANDA DE MESA",
                header: {
                    "MESA": `#${tableData.tableNumber || tableData.mesa || tableData.numeroMesa || 'S/N'}`,
                    "PEDIDO": tableData.orderId || tableData.id || tableData.vendaId || `#${Date.now()}`,
                    "Data": new Date().toLocaleDateString('pt-BR'),
                    "Hora": new Date().toLocaleTimeString('pt-BR')
                },
                items: (tableData.items || tableData.produtos || tableData.itens || []).map(item => ({
                    name: item.nome || item.name || item.produto_nome || `Produto ID ${item.produto_id || item.id}`,
                    quantity: item.quantidade || item.quantity || 1,
                    price: parseFloat(item.preco_unitario || item.price || item.preco || 0)
                })),
                // Calcular total baseado nos itens (quantidade × preço unitário)
                total: (tableData.items || tableData.produtos || tableData.itens || []).reduce((sum, item) => {
                    return sum + ((item.quantidade || item.quantity || 1) * parseFloat(item.preco_unitario || item.price || item.preco || 0));
                }, 0),
                footer: [
                    "----------------------------------------",
                    `Observações: ${tableData.notes || tableData.observacoes || 'Nenhuma'}`,
                    "----------------------------------------",
                    "Aguarde no balcão para retirada",
                    "ou aguarde na mesa"
                ]
            };

            // Adicionar dados do cliente se fornecidos
            if (customer.nome || customer.name) {
                receiptData.header["Cliente"] = customer.nome || customer.name || 'Mesa';
            }

            const result = await this.printReceipt('balcao', receiptData);
            
            return result;
        } catch (error) {
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
            throw error;
        }
    }
}

// Instância singleton
const printerService = new PrinterService();
export { printerService };
export default printerService;

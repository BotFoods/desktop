/**
 * Serviço abstrato para impressão em diferentes contextos
 * Este serviço oferece métodos específicos para cada tipo de impressão
 * sem expor a complexidade interna do printerService
 */

import { printerService } from './printerService';

class PrintManager {
    constructor() {
        this.printerService = printerService;
    }

    /**
     * Imprimir pedido para preparo na cozinha
     * Usado em: PrepararButton, AguardarButton
     */
    async printForKitchen(orderData) {
        try {
            
            // Passar dados originais para o printerService fazer a normalização
            return await this.printerService.printKitchenOrder(orderData);
        } catch (error) {
            throw new Error(`Falha na impressão da cozinha: ${error.message}`);
        }
    }

    /**
     * Imprimir cupom fiscal do caixa/balcão
     * Usado em: Caixa, Checkout, PdvMesa
     */
    async printSaleReceipt(saleData) {
        try {
            
            const normalizedData = {
                saleId: saleData.vendaId || saleData.saleId || saleData.id || `#${Date.now()}`,
                items: this._normalizeItems(saleData.produtos || saleData.items || []),
                total: saleData.total || saleData.valor_total || 0,
                payment: {
                    method: saleData.forma_pagamento || saleData.payment?.method || 'Dinheiro',
                    change: saleData.troco || saleData.payment?.change || 0
                },
                customer: saleData.cliente || saleData.customer,
                seller: saleData.vendedor || saleData.seller || 'Sistema'
            };

            
            // Passar os dados originais para o printerService, ele fará a normalização
            const result = await this.printerService.printSaleReceipt(saleData);
            
            return result;
        } catch (error) {
            throw new Error(`Falha na impressão do cupom: ${error.message}`);
        }
    }

    /**
     * Imprimir pedido de delivery
     * Usado em: Delivery
     */
    async printDeliveryOrder(deliveryData) {
        try {
            
            // Passar dados originais para o printerService fazer a normalização
            return await this.printerService.printDeliveryOrder(deliveryData);
        } catch (error) {
            throw new Error(`Falha na impressão do delivery: ${error.message}`);
        }
    }

    /**
     * Imprimir comanda de mesa
     * Usado em: Mesas, PdvMesa
     */
    async printTableOrder(tableData) {
        try {
            
            // Passar dados originais para o printerService fazer a normalização
            return await this.printerService.printTableOrder(tableData);
        } catch (error) {
            throw new Error(`Falha na impressão da mesa: ${error.message}`);
        }
    }

    /**
     * Método para impressão de texto simples (compatibilidade)
     * Usado quando componentes precisam imprimir texto direto
     */
    async printSimpleText(text, printerType = 'caixa') {
        try {
            return await this.printerService.printSimpleText(text, printerType, { useStructured: false });
        } catch (error) {
            throw new Error(`Falha na impressão: ${error.message}`);
        }
    }

    /**
     * Verificar status das impressoras
     */
    async checkPrintersStatus() {
        try {
            return await this.printerService.checkPrinterServiceStatus();
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    // ==========================================
    // MÉTODOS AUXILIARES PRIVADOS
    // ==========================================

    /**
     * Determinar tipo do pedido baseado nos dados
     */
    _determineOrderType(orderData) {
        if (orderData.tipo === 'delivery' || orderData.orderType === 'delivery') {
            return 'DELIVERY';
        }
        if (orderData.mesa || orderData.tableNumber) {
            return `MESA #${orderData.mesa || orderData.tableNumber}`;
        }
        return 'BALCÃO';
    }

    /**
     * Normalizar array de itens para formato padrão
     */
    _normalizeItems(items) {
        if (!Array.isArray(items)) return [];
        
        return items.map(item => ({
            name: item.nome || item.name || 'Item',
            quantity: item.quantidade || item.quantity || 1,
            price: item.preco || item.price || item.valor || 0,
            observations: item.observacoes || item.observations || item.obs || ''
        }));
    }

    /**
     * Criar timeout personalizado para impressão
     */
    _createPrintTimeout(duration = 5000) {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na impressão')), duration)
        );
    }

    /**
     * Executar impressão com timeout e fallback
     */
    async _printWithFallback(printFunction, timeoutMs = 5000) {
        try {
            return await Promise.race([
                printFunction(),
                this._createPrintTimeout(timeoutMs)
            ]);
        } catch (error) {
            throw error; // Deixar que o caller decida como tratar
        }
    }
}

// Instância singleton
const printManager = new PrintManager();
export { printManager };
export default printManager;

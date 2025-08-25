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
            // Normalizar dados do pedido independente da fonte
            const normalizedData = {
                orderId: orderData.pedidoId || orderData.orderId || orderData.id || `#${Date.now()}`,
                orderType: this._determineOrderType(orderData),
                items: this._normalizeItems(orderData.produtos || orderData.items || []),
                customer: orderData.dados_cliente || orderData.customer,
                notes: orderData.observacoes || orderData.notes || 'Nenhuma',
                mesa: orderData.mesa || orderData.tableNumber
            };

            console.log('🍳 Imprimindo pedido para cozinha:', normalizedData.orderId);
            return await this.printerService.printKitchenOrder(normalizedData);
        } catch (error) {
            console.error('Erro ao imprimir para cozinha:', error);
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

            console.log('🧾 Imprimindo cupom fiscal:', normalizedData.saleId);
            return await this.printerService.printSaleReceipt(normalizedData);
        } catch (error) {
            console.error('Erro ao imprimir cupom fiscal:', error);
            throw new Error(`Falha na impressão do cupom: ${error.message}`);
        }
    }

    /**
     * Imprimir pedido de delivery
     * Usado em: Delivery
     */
    async printDeliveryOrder(deliveryData) {
        try {
            const normalizedData = {
                orderId: deliveryData.pedidoId || deliveryData.orderId || deliveryData.id || `#${Date.now()}`,
                items: this._normalizeItems(deliveryData.produtos || deliveryData.items || []),
                total: deliveryData.total || deliveryData.valor_total || 0,
                customer: deliveryData.cliente || deliveryData.customer,
                delivery: {
                    fee: deliveryData.taxa_entrega || deliveryData.delivery?.fee || 0,
                    estimatedTime: deliveryData.tempo_estimado || deliveryData.delivery?.estimatedTime || '30-45 min'
                },
                payment: {
                    method: deliveryData.forma_pagamento || deliveryData.payment?.method || 'Dinheiro',
                    change: deliveryData.troco || deliveryData.payment?.change || 0
                }
            };

            console.log('🚚 Imprimindo pedido delivery:', normalizedData.orderId);
            return await this.printerService.printDeliveryOrder(normalizedData);
        } catch (error) {
            console.error('Erro ao imprimir delivery:', error);
            throw new Error(`Falha na impressão do delivery: ${error.message}`);
        }
    }

    /**
     * Imprimir comanda de mesa
     * Usado em: Mesas, PdvMesa
     */
    async printTableOrder(tableData) {
        try {
            const normalizedData = {
                tableNumber: tableData.mesa || tableData.tableNumber || '?',
                orderId: tableData.pedidoId || tableData.orderId || tableData.id || `#${Date.now()}`,
                items: this._normalizeItems(tableData.produtos || tableData.items || []),
                total: tableData.total || tableData.valor_total || 0,
                customer: tableData.cliente || tableData.customer,
                notes: tableData.observacoes || tableData.notes || 'Nenhuma'
            };

            console.log('🪑 Imprimindo comanda mesa:', normalizedData.tableNumber);
            return await this.printerService.printTableOrder(normalizedData);
        } catch (error) {
            console.error('Erro ao imprimir comanda de mesa:', error);
            throw new Error(`Falha na impressão da mesa: ${error.message}`);
        }
    }

    /**
     * Método para impressão de texto simples (compatibilidade)
     * Usado quando componentes precisam imprimir texto direto
     */
    async printSimpleText(text, printerType = 'caixa') {
        try {
            console.log(`📝 Imprimindo texto simples (${printerType}):`, text.substring(0, 50) + '...');
            return await this.printerService.printSimpleText(text, printerType, { useStructured: false });
        } catch (error) {
            console.error('Erro ao imprimir texto simples:', error);
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
            console.error('Erro ao verificar status das impressoras:', error);
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
            console.warn('Impressão falhou, tentando fallback:', error.message);
            throw error; // Deixar que o caller decida como tratar
        }
    }
}

// Instância singleton
const printManager = new PrintManager();
export { printManager };
export default printManager;

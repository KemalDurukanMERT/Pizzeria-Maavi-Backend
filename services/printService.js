import prisma from '../utils/db.js';

class PrintService {
    /**
     * Creates a new PrintJob in the database for the given order.
     * @param {Object} order - Full order object with items and user details
     * @returns {Promise<Object>} Created PrintJob
     */
    async printOrder(order) {
        try {
            // Create the content structure that the agent expects
            const printContent = this.generatePrintContent(order);

            const printJob = await prisma.printJob.create({
                data: {
                    orderId: order.id,
                    storeId: 'main', // Default store ID, can be dynamic later
                    status: 'PENDING',
                    content: printContent,
                    printerName: null // Pending assignment
                }
            });

            console.log(`PrintJob created for Order #${order.orderNumber}: ${printJob.id}`);
            return printJob;
        } catch (error) {
            console.error('Failed to create PrintJob:', error);
            throw error;
        }
    }

    /**
     * Generates a structural representation of the receipt.
     * The agent will convert this to ESC/POS commands.
     */
    generatePrintContent(order) {
        const dukkanAdi = "PIZZERIA MAVI";
        const dukkanAdres = "Mavikatu 12, Helsinki";
        const dukkanTel = "+358 10 123 4567";
        const now = new Date().toLocaleString('fi-FI');

        const deliveryTypeFi = order.deliveryType === 'DELIVERY' ? 'KULJETUS' : 'NOUTO';

        const paymentMap = {
            'CARD': 'KORTTI',
            'CASH': 'KÄTEINEN',
            'VERKKOMAKSU': 'VERKKOMAKSU',
            'LOUNASSETELI': 'LOUNASSETELI',
            'EPASSI': 'EPASSI'
        };
        const paymentMethodFi = paymentMap[order.paymentMethod] || order.paymentMethod;

        // Simplify items for the agent
        const items = order.items.map(item => ({
            quantity: item.quantity,
            name: item.productName || item.product?.name || 'Tuote',
            price: item.totalPrice,
            customizations: (item.customizations || []).map(c => ({
                name: c.name || c.ingredient?.name || '',
                price: c.priceModifier
            }))
        }));

        return {
            header: {
                title: dukkanAdi,
                address: dukkanAdres,
                phone: dukkanTel
            },
            meta: {
                orderNumber: order.orderNumber,
                date: now,
                deliveryType: deliveryTypeFi,
                paymentMethod: paymentMethodFi
            },
            items: items,
            totals: {
                total: order.total,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee
            },
            customer: {
                name: order.user ? `${order.user.firstName} ${order.user.lastName}` : (order.deliveryAddress?.customerName || 'Vieras'),
                phone: order.user?.phone || order.deliveryAddress?.phoneNumber || '',
                address: order.deliveryAddress ?
                    `${order.deliveryAddress.street}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}` :
                    null,
                notes: order.customerNotes
            }
        };
    }

    // [NEW] Generate text preview for Admin UI
    generatePreviewText(order) {
        const content = this.generatePrintContent(order);

        let txt = '';
        txt += `            ${content.header.title}\n`;
        txt += `           ${content.header.address}\n`;
        txt += `             ${content.header.phone}\n\n`;
        txt += `Tilaus: #${content.meta.orderNumber}\n`;
        txt += `Pvm:    ${content.meta.date}\n`;
        txt += `Tyyppi: ${content.meta.deliveryType}\n`;
        txt += `Maksu:  ${content.meta.paymentMethod}\n`;
        txt += '-'.repeat(32) + '\n';

        content.items.forEach(item => {
            txt += `${item.quantity}x ${item.name.padEnd(20)} ${item.price.toFixed(2)}\n`;
            if (item.customizations) {
                item.customizations.forEach(c => {
                    txt += `   + ${c.name} (${c.price}e)\n`;
                });
            }
        });

        txt += '-'.repeat(32) + '\n';
        txt += `Yhteensa:             ${content.totals.total.toFixed(2)} EUR\n`;
        txt += '-'.repeat(32) + '\n';
        txt += 'Asiakas:\n';
        txt += `${content.customer.name}\n`;
        if (content.customer.phone) txt += `${content.customer.phone}\n`;
        if (content.customer.address) txt += `${content.customer.address}\n`;
        if (content.customer.notes) txt += `\nHUOM:\n${content.customer.notes}\n`;
        txt += '\n       Kiitos tilauksesta!\n';

        return txt;
    }
}

export default new PrintService();

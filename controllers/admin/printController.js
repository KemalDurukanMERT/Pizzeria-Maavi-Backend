import printService from '../../services/printService.js';

export const getPrinters = async (req, res, next) => {
    try {
        const printers = await printService.getAvailablePrinters();
        res.json({ success: true, data: printers });
    } catch (error) {
        next(error);
    }
};

export const setPrinter = async (req, res, next) => {
    try {
        const { name } = req.body;
        printService.printerName = name;
        // Optionally save to disk/config/env
        res.json({ success: true, message: `Printer set to ${name}` });
    } catch (error) {
        next(error);
    }
};

export const testPrint = async (req, res, next) => {
    try {
        const testOrder = {
            orderNumber: 'TEST-001',
            createdAt: new Date(),
            deliveryType: 'DELIVERY',
            total: 0.00,
            paymentMethod: 'TEST',
            items: [
                { quantity: 1, productName: 'Test Pizza', totalPrice: 0.00, customizations: [] }
            ],
            deliveryAddress: {
                street: 'Test Street 1',
                city: 'Test City',
                postalCode: '12345',
                customerName: 'Test Customer'
            }
        };
        await printService.printOrder(testOrder);
        res.json({ success: true, message: 'Test print sent' });
    } catch (error) {
        next(error);
    }
};

export const getPreview = async (req, res, next) => {
    try {
        const testOrder = {
            orderNumber: 'PREVIEW-001',
            createdAt: new Date(),
            deliveryType: 'DELIVERY',
            total: 24.50,
            paymentMethod: 'CARD',
            items: [
                { quantity: 2, productName: 'Margherita Pizza', totalPrice: 18.00, customizations: [{ name: 'Extra Cheese', priceModifier: 1.50 }] },
                { quantity: 1, productName: 'Cola 0.5L', totalPrice: 3.50, customizations: [] }
            ],
            deliveryAddress: {
                street: 'Mavikatu 5',
                city: 'Helsinki',
                postalCode: '00100',
                customerName: 'Matti Meikäläinen'
            }
        };
        const receiptText = await printService.generateReceiptFile(testOrder, true); // Added returnOnly flag
        res.json({ success: true, data: receiptText });
    } catch (error) {
        next(error);
    }
};

import printService from '../../services/printService.js';

export const getPrinters = async (req, res, next) => {
    try {
        const activePrinters = req.app.locals.activePrinters || {};
        const printerList = activePrinters['main'] || [];

        const names = printerList.map(p => p.name || p);

        res.json({ success: true, data: names });
    } catch (error) {
        next(error);
    }
};

export const setPrinter = async (req, res, next) => {
    try {
        const { name } = req.body;

        const io = req.app.get('io');
        io.to('printer:main').emit('printer:config:update', { printerName: name });

        res.json({ success: true, message: `Printer preference sent to agent: ${name}` });
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
        const printJob = await printService.printOrder(testOrder);

        // Emit socket event to printer agent
        const io = req.app.get('io');
        io.to('printer:main').emit('print:job:created', printJob);

        res.json({ success: true, message: 'Test print sent', jobId: printJob.id });
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
            subtotal: 20.00, // Added subtotal
            deliveryFee: 4.50, // Added deliveryFee
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
        const receiptText = printService.generatePreviewText(testOrder);
        res.json({ success: true, data: receiptText });
    } catch (error) {
        next(error);
    }
};

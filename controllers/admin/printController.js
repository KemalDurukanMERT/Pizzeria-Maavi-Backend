import printService from '../../services/printService.js';

export const getPrinters = async (req, res, next) => {
    try {
        // Fetch printers from in-memory store (populated by Agent)
        const activePrinters = req.app.locals.activePrinters || {};
        const printerList = activePrinters['main'] || []; // Default to 'main' store

        // Ensure it's a flat list of names
        const names = printerList.map(p => p.name || p);

        res.json({ success: true, data: names });
    } catch (error) {
        next(error);
    }
};

export const setPrinter = async (req, res, next) => {
    try {
        // In the new agent architecture, the agent controls the printer.
        // But we can store a preference if needed, or just acknowledge.
        // For testing, the user might want to persist this selection to be sent to Agent?
        // Actually, the agent reads its OWN local config. The Admin UI 'Select Printer' 
        // is mostly for the 'Test Print' button in this context, OR we need to send a config update to Agent.

        // For now, let's just return success, assuming the user configures the Agent physically
        // OR we could emit an event to the agent to switch printers if it supports it.
        const { name } = req.body;

        // Optional: Emit config update to agent
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

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

class PrintService {
    constructor() {
        this.printerName = process.env.THERMAL_PRINTER_NAME || 'Star TSP100';
    }

    async getAvailablePrinters() {
        try {
            const { stdout } = await execAsync('powershell -Command "Get-Printer | Select-Object Name | ConvertTo-Json"');
            const data = JSON.parse(stdout);
            return Array.isArray(data) ? data.map(p => p.Name) : [data.Name];
        } catch (error) {
            console.error('Error fetching printers:', error);
            return [];
        }
    }

    async printOrder(order) {
        try {
            const receiptPath = await this.generateReceiptFile(order);

            // Format the PowerShell command to print to the specific printer
            // We use the 'futurePRNT' driver capabilities if possible, 
            // but for simplicity, we send a formatted text/HTML print job.

            // Command to print to a specific printer in Windows
            const command = `powershell -Command "Start-Process -FilePath '${receiptPath}' -Verb PrintTo -ArgumentList '${this.printerName}'"`;

            console.log(`Sending print job to ${this.printerName}...`);
            await execAsync(command);

            // Clean up after a delay to ensure it's printed
            setTimeout(() => {
                if (fs.existsSync(receiptPath)) {
                    fs.unlinkSync(receiptPath);
                    const htmlPath = receiptPath.replace('.txt', '.html');
                    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
                }
            }, 60000);

            return { success: true };
        } catch (error) {
            console.error('Printing failed:', error);
            throw error;
        }
    }

    async generateReceiptFile(order, returnOnly = false) {
        const dukkanAdi = "PIZZERIA MAVI";
        const dukkanAdres = "Mavikatu 12, Helsinki";
        const dukkanTel = "+358 10 123 4567";

        const now = new Date().toLocaleString('fi-FI');

        const deliveryTypeFi = order.deliveryType === 'DELIVERY' ? 'KULJETUS' : 'NOUTO';
        const paymentMethodFi = {
            'CARD': 'KORTTI',
            'CASH': 'KÄTEINEN',
            'VERKKOMAKSU': 'VERKKOMAKSU',
            'LOUNASSETELI': 'LOUNASSETELI',
            'EPASSI': 'EPASSI'
        }[order.paymentMethod] || order.paymentMethod;

        let receiptText = `
--------------------------------
        ${dukkanAdi}
--------------------------------
${dukkanAdres}
Puh: ${dukkanTel}

Tilausnro: #${order.orderNumber}
Päivämäärä: ${now}
Tyyppi: ${deliveryTypeFi}
--------------------------------
TUOTTEET:
`;

        order.items.forEach(item => {
            receiptText += `${item.quantity}x ${item.productName.padEnd(20)} €${item.totalPrice.toFixed(2)}\n`;
            if (item.customizations && item.customizations.length > 0) {
                item.customizations.forEach(c => {
                    receiptText += `  - ${c.name || (c.ingredient?.name)} (+€${c.priceModifier})\n`;
                });
            }
        });

        receiptText += `
--------------------------------
YHTEENSÄ:             €${order.total.toFixed(2)}
--------------------------------
MAKSUTAPA: ${paymentMethodFi}
--------------------------------
ASIAKASTIEDOT:
${order.user ? `${order.user.firstName} ${order.user.lastName}` : (order.deliveryAddress?.customerName || 'Vieras')}
Puh: ${order.user?.phone || 'N/A'}
Osoite:
${order.deliveryAddress ?
                `${order.deliveryAddress.street}\n${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}` :
                'NOUTO'}

--------------------------------
     Hyvää ruokahalua!
--------------------------------
\n\n\n\n\n`; // Add some space for the cutter

        if (returnOnly) return receiptText;

        const filename = `receipt_${order.id || 'test'}.txt`;
        const tempPath = path.join(process.cwd(), 'temp', filename);

        if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
            fs.mkdirSync(path.join(process.cwd(), 'temp'));
        }

        fs.writeFileSync(tempPath, receiptText, 'utf8');
        return tempPath;
    }
}

export default new PrintService();

import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3000;

// Types
interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  name: string;
  address: string;
  email: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Example invoice data
const invoiceData: InvoiceData = {
  invoiceNumber: 'INV-2025-001',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  customer: {
    name: 'Acme Corporation',
    address: '456 Business Ave, Suite 100\nSan Francisco, CA 94107',
    email: 'billing@acme.com'
  },
  items: [
    { description: 'Website Design', quantity: 1, price: 2500.00, total: 2500.00 },
    { description: 'Development Hours', quantity: 40, price: 120.00, total: 4800.00 },
    { description: 'Premium Hosting (12 months)', quantity: 1, price: 599.00, total: 599.00 },
  ],
  subtotal: 7899.00,
  tax: 710.91, // 9% tax
  total: 8609.91
};

// HTML Template (with nice styling)
const generateInvoiceHTML = (data: InvoiceData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f9f9f9;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
    .invoice-info h1 { margin: 0; color: #1f2937; }
    .invoice-meta { text-align: right; }
    .section { margin: 30px 0; }
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin: 30px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    th {
      background: #f8fafc;
      text-align: left;
      padding: 15px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    .text-right { text-align: right; }
    .total-row {
      font-weight: bold;
      font-size: 1.1em;
    }
    .grand-total {
      background: #2563eb;
      color: white;
      font-size: 1.4em;
    }
    .grand-total td {
      padding: 20px 15px;
    }
    footer {
      margin-top: 60px;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">YourCompany</div>
      <div class="invoice-meta">
        <h1>INVOICE</h1>
        <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
        <p><strong>Date:</strong> ${data.date}</p>
      </div>
    </div>

    <div class="two-column">
      <div>
        <h3>From:</h3>
        <strong>YourCompany Inc.</strong><br>
        123 Tech Street<br>
        San Francisco, CA 94105<br>
        support@yourcompany.com
      </div>
      <div>
        <h3>Bill To:</h3>
        <strong>${data.customer.name}</strong><br>
        ${data.customer.address.replace(/\n/g, '<br>')}<br>
        ${data.customer.email}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            <td><strong>${item.description}</strong></td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">$${item.price.toFixed(2)}</td>
            <td class="text-right">$${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-right">Subtotal</td>
          <td class="text-right">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" class="text-right">Tax (9%)</td>
          <td class="text-right">$${data.tax.toFixed(2)}</td>
        </tr>
        <tr class="grand-total total-row">
          <td colspan="3" class="text-right">Total Amount Due</td>
          <td class="text-right">$${data.total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="section">
      <h3>Thank you for your business!</h3>
      <p>Payment is due within 30 days. Please contact us if you have any questions.</p>
    </div>

    <footer>
      YourCompany Inc. • www.yourcompany.com • +1 (555) 123-4567
    </footer>
  </div>
</body>
</html>
  `;
};

// Route to generate and download PDF
app.get('/invoice-pdf', async (req: Request, res: Response) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const htmlContent = generateInvoiceHTML(invoiceData);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    // Set headers to download PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).send('Error generating PDF');
  }
});

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>Invoice PDF Generator</h1>
    <p><a href="/invoice-pdf">Download Sample Invoice PDF</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Generate PDF → http://localhost:${PORT}/invoice-pdf`);
});
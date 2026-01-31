const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptPDFGenerator {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../public/Uploads/receipts');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateReceiptPDF(receiptData) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `Receipt_${receiptData.receipt_number.replace(/\//g, '-')}.pdf`;
        const filePath = path.join(this.uploadsDir, fileName);
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);
        
        // Add content to PDF
        this.addHeader(doc, receiptData);
        this.addSenderRecipientInfo(doc, receiptData);
        this.addTransactionDetails(doc, receiptData);
        this.addAmountBreakdown(doc, receiptData);
        this.addSecurityInfo(doc, receiptData);
        this.addFooter(doc, receiptData);
        
        doc.end();
        
        stream.on('finish', () => {
          resolve(`/Uploads/receipts/${fileName}`);
        });
        
        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, receipt) {
    // Header background
    doc.rect(0, 0, doc.page.width, 120)
       .fill('#667eea');
    
    // Company logo/name
    doc.fillColor('#ffffff')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('ZenoPay', 50, 40);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Digital Payment Solutions', 50, 75);
    
    // Receipt title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', 350, 40, { align: 'right' });
    
    // Receipt number
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica')
       .text(`Receipt #: ${receipt.receipt_number}`, 350, 75, { align: 'right' });
    
    // Status badge
    const statusColor = receipt.status === 'success' ? '#10b981' : 
                       receipt.status === 'pending' ? '#f59e0b' : '#ef4444';
    doc.rect(450, 90, 95, 20)
       .fill(statusColor);
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(receipt.status.toUpperCase(), 450, 95, { width: 95, align: 'center' });
    
    doc.fillColor('#000000'); // Reset color
  }

  addSenderRecipientInfo(doc, receipt) {
    let yPos = 160;
    
    // From section
    doc.rect(50, yPos, 230, 100)
       .strokeColor('#e5e7eb')
       .stroke();
    
    doc.fillColor('#6b7280')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('FROM', 60, yPos + 10);
    
    doc.fillColor('#000000')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(receipt.sender_name, 60, yPos + 30);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`ID: ${receipt.sender_id}`, 60, yPos + 50);
    
    // To section
    doc.rect(315, yPos, 230, 100)
       .strokeColor('#e5e7eb')
       .stroke();
    
    doc.fillColor('#6b7280')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('TO', 325, yPos + 10);
    
    doc.fillColor('#000000')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(receipt.recipient_name, 325, yPos + 30);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`ID: ${receipt.recipient_id}`, 325, yPos + 50);
    
    if (receipt.recipient_email) {
      doc.text(receipt.recipient_email, 325, yPos + 70);
    }
  }

  addTransactionDetails(doc, receipt) {
    let yPos = 290;
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Transaction Details', 50, yPos);
    
    yPos += 30;
    
    // Transaction details table
    const details = [
      ['Transaction ID:', receipt.transaction_hash || 'N/A'],
      ['Transaction Type:', receipt.transaction_type === 'sent' ? 'Money Sent' : 'Money Received'],
      ['Payment Method:', receipt.payment_method],
      ['Date & Time:', new Date(receipt.transaction_date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })],
      ['Status:', receipt.verification_status || 'Verified']
    ];
    
    details.forEach(([label, value]) => {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#6b7280')
         .text(label, 50, yPos, { width: 150 });
      
      doc.font('Helvetica')
         .fillColor('#000000')
         .text(value, 220, yPos, { width: 325 });
      
      yPos += 25;
    });
    
    // Description if exists
    if (receipt.description) {
      yPos += 10;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#6b7280')
         .text('Description:', 50, yPos);
      
      doc.font('Helvetica')
         .fillColor('#000000')
         .text(receipt.description, 50, yPos + 20, { width: 495 });
    }
  }

  addAmountBreakdown(doc, receipt) {
    let yPos = 520;
    
    // Amount breakdown box
    doc.rect(320, yPos, 225, 120)
       .fillAndStroke('#f9fafb', '#e5e7eb');
    
    yPos += 15;
    
    // Amount
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Amount:', 335, yPos);
    
    doc.text(`$${receipt.amount.toFixed(2)}`, 450, yPos, { align: 'right' });
    
    yPos += 25;
    
    // Fee
    if (receipt.fee > 0) {
      doc.text('Transaction Fee:', 335, yPos);
      doc.text(`$${receipt.fee.toFixed(2)}`, 450, yPos, { align: 'right' });
      yPos += 25;
      
      // Divider
      doc.moveTo(335, yPos)
         .lineTo(530, yPos)
         .strokeColor('#d1d5db')
         .stroke();
      
      yPos += 15;
    }
    
    // Total
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Total Amount:', 335, yPos);
    
    const totalColor = receipt.transaction_type === 'sent' ? '#ef4444' : '#10b981';
    doc.fillColor(totalColor)
       .text(`$${receipt.total_amount.toFixed(2)}`, 450, yPos, { align: 'right' });
  }

  addSecurityInfo(doc, receipt) {
    let yPos = 670;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Security & Verification', 50, yPos);
    
    yPos += 25;
    
    // Security info
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('✓ Transaction verified and secured with SSL encryption', 50, yPos);
    
    yPos += 15;
    doc.text('✓ This receipt is digitally generated and legally valid', 50, yPos);
    
    yPos += 15;
    doc.text(`✓ Generated on: ${new Date(receipt.generated_at).toLocaleString()}`, 50, yPos);
  }

  addFooter(doc, receipt) {
    const footerY = doc.page.height - 80;
    
    // Footer separator
    doc.moveTo(50, footerY)
       .lineTo(doc.page.width - 50, footerY)
       .strokeColor('#e5e7eb')
       .stroke();
    
    // Footer content
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('ZenoPay - Secure Digital Payments', 50, footerY + 15, { align: 'center' });
    
    doc.text('Email: support@zenopay.com | Phone: +91 1800-ZENOPAY', 50, footerY + 30, { align: 'center' });
    
    doc.fontSize(8)
       .text('This is a computer-generated receipt and does not require a signature', 50, footerY + 45, { align: 'center' });
  }
}

module.exports = new ReceiptPDFGenerator();

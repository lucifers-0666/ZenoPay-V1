const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.colors = {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      text: '#1f2937',
      lightText: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      danger: '#ef4444',
    };
  }

  async generateStatementPDF(statement, user, transactions) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF directory if it doesn't exist
        const pdfDir = path.join(__dirname, '../public/Uploads/statements');
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generate filename
        const filename = `statement_${user.ZenoPayID}_${statement.month}_${statement.year}.pdf`;
        const filepath = path.join(pdfDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ 
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Pipe to file
        const writeStream = fs.createWriteStream(filepath);
        doc.pipe(writeStream);

        // PDF Metadata
        doc.info.Title = `ZenoPay Statement - ${statement.statement_month}`;
        doc.info.Author = 'ZenoPay';
        doc.info.Subject = 'Account Statement';
        doc.info.Keywords = 'statement, transactions, zenopay';

        // Header
        this.addHeader(doc, statement);

        // User Information
        this.addUserInfo(doc, user, statement);

        // Account Summary
        this.addAccountSummary(doc, statement);

        // Transactions Table
        this.addTransactionsTable(doc, transactions);

        // Fee Breakdown
        if (statement.fee_breakdown && statement.fee_breakdown.length > 0) {
          this.addFeeBreakdown(doc, statement);
        }

        // Footer
        this.addFooter(doc);

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
          resolve({
            filename,
            filepath,
            url: `/Uploads/statements/${filename}`
          });
        });

        writeStream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, statement) {
    // Logo and Title
    doc.fontSize(24)
       .fillColor(this.colors.primary)
       .text('ZenoPay', 50, 50, { bold: true });

    doc.fontSize(20)
       .fillColor(this.colors.text)
       .text('Account Statement', 50, 85);

    // Statement Period
    doc.fontSize(12)
       .fillColor(this.colors.lightText)
       .text(`Statement Period: ${statement.statement_month}`, 50, 115);

    doc.text(`Generated: ${new Date(statement.generated_at).toLocaleDateString()}`, 50, 130);

    // Horizontal line
    doc.moveTo(50, 155)
       .lineTo(562, 155)
       .strokeColor(this.colors.border)
       .stroke();

    doc.moveDown(2);
  }

  addUserInfo(doc, user, statement) {
    const y = 175;
    
    doc.fontSize(14)
       .fillColor(this.colors.text)
       .text('Account Information', 50, y, { underline: true });

    doc.fontSize(10)
       .fillColor(this.colors.lightText);

    doc.text(`Name: ${user.FullName}`, 50, y + 25);
    doc.text(`ZenoPay ID: ${user.ZenoPayID}`, 50, y + 40);
    doc.text(`Email: ${user.Email}`, 50, y + 55);
    doc.text(`Statement ID: ${statement._id}`, 50, y + 70);

    doc.moveDown(2);
  }

  addAccountSummary(doc, statement) {
    const y = doc.y + 20;

    doc.fontSize(14)
       .fillColor(this.colors.text)
       .text('Account Summary', 50, y, { underline: true });

    // Create summary box
    const boxY = y + 25;
    doc.roundedRect(50, boxY, 512, 140, 5)
       .fillAndStroke('#f9fafb', this.colors.border);

    doc.fontSize(10)
       .fillColor(this.colors.text);

    const leftCol = 70;
    const rightCol = 320;
    let lineY = boxY + 20;

    // Opening Balance
    doc.text('Opening Balance:', leftCol, lineY);
    doc.text(`$${parseFloat(statement.opening_balance.toString()).toFixed(2)}`, rightCol, lineY, { align: 'right', width: 220 });

    lineY += 20;
    doc.text('Total Transactions:', leftCol, lineY);
    doc.text(statement.total_transactions.toString(), rightCol, lineY, { align: 'right', width: 220 });

    lineY += 20;
    doc.text('Total Credits (+):', leftCol, lineY);
    doc.fillColor(this.colors.success)
       .text(`$${parseFloat(statement.total_amount_received.toString()).toFixed(2)}`, rightCol, lineY, { align: 'right', width: 220 });

    lineY += 20;
    doc.fillColor(this.colors.text)
       .text('Total Debits (-):', leftCol, lineY);
    doc.fillColor(this.colors.danger)
       .text(`-$${parseFloat(statement.total_amount_sent.toString()).toFixed(2)}`, rightCol, lineY, { align: 'right', width: 220 });

    lineY += 20;
    doc.fillColor(this.colors.text)
       .text('Fees Charged:', leftCol, lineY);
    doc.text(`$${parseFloat(statement.fees_charged.toString()).toFixed(2)}`, rightCol, lineY, { align: 'right', width: 220 });

    // Divider line
    lineY += 15;
    doc.moveTo(70, lineY)
       .lineTo(540, lineY)
       .strokeColor(this.colors.border)
       .stroke();

    lineY += 15;
    doc.fontSize(11)
       .fillColor(this.colors.text)
       .text('Closing Balance:', leftCol, lineY, { bold: true });
    
    const netAmount = statement.net_amount;
    doc.fontSize(12)
       .fillColor(netAmount >= 0 ? this.colors.success : this.colors.danger)
       .text(`$${parseFloat(statement.closing_balance.toString()).toFixed(2)}`, rightCol, lineY, { align: 'right', width: 220, bold: true });

    doc.moveDown(3);
  }

  addTransactionsTable(doc, transactions) {
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    const y = doc.y + 20;

    doc.fontSize(14)
       .fillColor(this.colors.text)
       .text('Transaction Details', 50, y, { underline: true });

    // Table headers
    const tableTop = y + 30;
    const colWidths = {
      date: 80,
      description: 220,
      debit: 70,
      credit: 70,
      balance: 72
    };

    let currentY = tableTop;

    // Header row
    doc.fontSize(9)
       .fillColor('#fff');

    doc.rect(50, currentY, 512, 20)
       .fill(this.colors.primary);

    doc.fillColor('#fff')
       .text('Date', 55, currentY + 6, { width: colWidths.date });
    doc.text('Description', 135, currentY + 6, { width: colWidths.description });
    doc.text('Debit', 355, currentY + 6, { width: colWidths.debit, align: 'right' });
    doc.text('Credit', 425, currentY + 6, { width: colWidths.credit, align: 'right' });
    doc.text('Balance', 495, currentY + 6, { width: colWidths.balance, align: 'right' });

    currentY += 20;

    // Transaction rows
    doc.fontSize(8)
       .fillColor(this.colors.text);

    const maxTransactionsPerPage = 20;
    let rowCount = 0;

    transactions.forEach((txn, index) => {
      // Check if we need a new page
      if (rowCount >= maxTransactionsPerPage) {
        doc.addPage();
        currentY = 50;
        rowCount = 0;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, currentY, 512, 18)
           .fill('#f9fafb');
      }

      doc.fillColor(this.colors.text);

      const date = new Date(txn.TransactionTime);
      doc.text(date.toLocaleDateString(), 55, currentY + 5, { width: colWidths.date });
      
      const description = this.getTransactionDescription(txn);
      doc.text(description, 135, currentY + 5, { width: colWidths.description });

      // Determine if debit or credit
      const isSent = txn.SenderAccountNumber === txn.userAccountNumber;
      const amount = parseFloat(txn.Amount.toString());

      if (isSent) {
        doc.fillColor(this.colors.danger)
           .text(`-$${amount.toFixed(2)}`, 355, currentY + 5, { width: colWidths.debit, align: 'right' });
        doc.fillColor(this.colors.text)
           .text('-', 425, currentY + 5, { width: colWidths.credit, align: 'right' });
      } else {
        doc.fillColor(this.colors.text)
           .text('-', 355, currentY + 5, { width: colWidths.debit, align: 'right' });
        doc.fillColor(this.colors.success)
           .text(`$${amount.toFixed(2)}`, 425, currentY + 5, { width: colWidths.credit, align: 'right' });
      }

      // Balance
      const balance = isSent 
        ? parseFloat(txn.SenderBalanceAfter.toString())
        : parseFloat(txn.ReceiverBalanceAfter.toString());

      doc.fillColor(this.colors.text)
         .text(`$${balance.toFixed(2)}`, 495, currentY + 5, { width: colWidths.balance, align: 'right' });

      currentY += 18;
      rowCount++;
    });

    doc.moveDown(2);
  }

  addFeeBreakdown(doc, statement) {
    if (doc.y > 650) {
      doc.addPage();
    }

    const y = doc.y + 20;

    doc.fontSize(14)
       .fillColor(this.colors.text)
       .text('Fee Breakdown', 50, y, { underline: true });

    let currentY = y + 30;

    statement.fee_breakdown.forEach((fee, index) => {
      if (index % 2 === 0) {
        doc.rect(50, currentY, 512, 18)
           .fill('#f9fafb');
      }

      doc.fontSize(8)
         .fillColor(this.colors.text)
         .text(fee.fee_type, 55, currentY + 5, { width: 200 });
      
      doc.text(new Date(fee.date).toLocaleDateString(), 260, currentY + 5, { width: 100 });
      
      doc.text(`$${parseFloat(fee.amount.toString()).toFixed(2)}`, 370, currentY + 5, { width: 100, align: 'right' });

      currentY += 18;
    });

    doc.moveDown(2);
  }

  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc.moveTo(50, 742)
         .lineTo(562, 742)
         .strokeColor(this.colors.border)
         .stroke();

      // Footer text
      doc.fontSize(8)
         .fillColor(this.colors.lightText)
         .text('ZenoPay - Your Trusted Payment Partner', 50, 750, { align: 'center', width: 512 });

      doc.text('Support: support@zenopay.com | +1-800-ZENOPAY', 50, 762, { align: 'center', width: 512 });

      // Legal disclaimer
      doc.fontSize(7)
         .text('This statement is computer-generated and does not require a signature.', 50, 775, { align: 'center', width: 512 });

      // Page number
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, 785, { align: 'right', width: 512 });
    }
  }

  getTransactionDescription(txn) {
    const maxLength = 35;
    let description = '';

    if (txn.SenderHolderName && txn.ReceiverHolderName) {
      description = `To: ${txn.ReceiverHolderName}`;
    }

    if (txn.Description) {
      description = txn.Description;
    }

    if (description.length > maxLength) {
      description = description.substring(0, maxLength - 3) + '...';
    }

    return description || 'Transfer';
  }
}

module.exports = new PDFGenerator();

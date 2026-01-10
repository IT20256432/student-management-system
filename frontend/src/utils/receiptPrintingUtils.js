// receiptPrintingUtils.js
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR'
    }).format(amount || 0);
};

// Unified print receipt function
export const handlePrintReceipt = (receiptData, printerType = 'REGULAR') => {
    if (!receiptData) return null;
    
    const totalAmount = parseFloat(receiptData.amount);
    const totalFee = receiptData.feeBreakdown?.totalFee || totalAmount;
    const isFullPayment = totalAmount >= totalFee;
    const remainingBalance = totalFee - totalAmount;
    
    // Generate fee breakdown only for fees that are > 0
    const fees = [
        { name: 'Monthly Fee', amount: receiptData.feeBreakdown?.monthlyFee || 0 },
        { name: 'Admission Fee', amount: receiptData.feeBreakdown?.admissionFee || 0 },
        { name: 'Exam Fee', amount: receiptData.feeBreakdown?.examFee || 0 },
        { name: 'Sports Fee', amount: receiptData.feeBreakdown?.sportsFee || 0 },
        { name: 'Library Fee', amount: receiptData.feeBreakdown?.libraryFee || 0 },
        { name: 'Lab Fee', amount: receiptData.feeBreakdown?.labFee || 0 },
        { name: 'Other Fees', amount: receiptData.feeBreakdown?.otherFee || 0 }
    ];
    
    // Filter only fees with amount > 0
    const activeFees = fees.filter(fee => fee.amount > 0);
    
    // Choose template based on printer type
    const receiptHTML = printerType === 'THERMAL' || printerType === 'DOT_MATRIX' 
        ? createThermalReceiptHTML(totalAmount, totalFee, isFullPayment, remainingBalance, activeFees, receiptData)
        : createRegularReceiptHTML(totalAmount, totalFee, isFullPayment, remainingBalance, activeFees, receiptData);
    
    return receiptHTML;
};

// Helper function for regular printer receipt
const createRegularReceiptHTML = (totalAmount, totalFee, isFullPayment, remainingBalance, activeFees, receiptData) => {
    // Generate fee breakdown table for regular receipt
    let feeBreakdownTable = '';
    activeFees.forEach((fee, index) => {
        feeBreakdownTable += `
            <tr>
                <td style="padding: 4px 0; ${index === activeFees.length - 1 ? 'border-bottom: none' : 'border-bottom: 1px solid #eee'}">
                    ${fee.name}
                </td>
                <td style="padding: 4px 0; text-align: right; ${index === activeFees.length - 1 ? 'border-bottom: none' : 'border-bottom: 1px solid #eee'}">
                    ${formatCurrency(fee.amount)}
                </td>
            </tr>
        `;
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fee Payment Receipt</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    body {
                        font-size: 11px !important;
                        line-height: 1.2 !important;
                        padding: 5px !important;
                    }
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    line-height: 1.3;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 10px;
                    color: #333;
                    background: white;
                }
                
                .receipt-container {
                    width: 100%;
                    border: 1px solid #ddd;
                    padding: 15px;
                    box-sizing: border-box;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #3498db;
                }
                
                .header h1 {
                    margin: 0;
                    font-size: 22px;
                    color: #2c3e50;
                    font-weight: 600;
                }
                
                .header .subtitle {
                    font-size: 13px;
                    color: #7f8c8d;
                    margin: 5px 0;
                }
                
                .header .receipt-id {
                    font-size: 11px;
                    color: #666;
                    background: #f8f9fa;
                    padding: 4px 8px;
                    border-radius: 3px;
                    display: inline-block;
                    margin-top: 5px;
                }
                
                .info-section {
                    margin: 15px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #eee;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .info-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 3px 0;
                }
                
                .info-item .label {
                    font-weight: 600;
                    color: #555;
                    min-width: 120px;
                }
                
                .info-item .value {
                    color: #333;
                    text-align: right;
                    flex: 1;
                }
                
                .section-title {
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 15px 0 8px 0;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 13px;
                }
                
                .fee-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 11px;
                }
                
                .fee-table td {
                    padding: 4px 0;
                    vertical-align: top;
                }
                
                .total-row {
                    font-weight: 600;
                    color: #2c3e50;
                    border-top: 2px solid #3498db;
                    padding-top: 6px !important;
                }
                
                .payment-summary {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border: 1px solid #e0e0e0;
                }
                
                .payment-summary .summary-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                }
                
                .payment-summary .summary-item:last-child {
                    border-top: 1px solid #ddd;
                    margin-top: 6px;
                    padding-top: 8px;
                    font-weight: 600;
                    color: ${remainingBalance > 0 ? '#e67e22' : '#27ae60'};
                }
                
                .amount-highlight {
                    font-size: 20px;
                    font-weight: 700;
                    color: #27ae60;
                    text-align: center;
                    margin: 15px 0;
                    padding: 8px;
                    background: #f1f8e9;
                    border: 2px solid #27ae60;
                    border-radius: 6px;
                }
                
                .footer {
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                    font-size: 10px;
                    color: #7f8c8d;
                    text-align: center;
                }
                
                .compact-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin: 10px 0;
                }
                
                .compact-item {
                    padding: 5px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 11px;
                }
                
                .compact-label {
                    font-weight: 600;
                    color: #666;
                    display: block;
                    margin-bottom: 2px;
                }
                
                .compact-value {
                    color: #333;
                    font-weight: 500;
                }
                
                /* Print-specific optimizations */
                @media print {
                    body {
                        font-size: 10px !important;
                    }
                    .receipt-container {
                        border: none !important;
                        padding: 0 !important;
                    }
                    .header h1 {
                        font-size: 18px !important;
                    }
                    .amount-highlight {
                        font-size: 16px !important;
                        padding: 6px !important;
                    }
                    .info-grid {
                        gap: 5px !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- Header -->
                <div class="header">
                    <h1> Sammana Educational Institute </h1>
                    <h2>FEE PAYMENT RECEIPT</h2>
                    <div class="subtitle">${isFullPayment ? 'FULL PAYMENT' : 'PARTIAL PAYMENT'}</div>
                    <div class="receipt-id">TXN: ${receiptData.transactionId}</div>
                </div>
                 
                <!-- Compact Info Grid -->
                <div class="compact-grid">
                    <div class="compact-item">
                        <span class="compact-label">Date</span>
                        <span class="compact-value">${receiptData.date}</span>
                    </div>
                    <div class="compact-item">
                        <span class="compact-label">Month</span>
                        <span class="compact-value">${receiptData.month}</span>
                    </div>
                    <div class="compact-item">
                        <span class="compact-label">Method</span>
                        <span class="compact-value">${receiptData.paymentMethod}</span>
                    </div>
                </div>
                
                <!-- Student & Class Info -->
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Student:</span>
                            <span class="value">${receiptData.studentName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Student ID:</span>
                            <span class="value">${receiptData.studentId}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Class:</span>
                            <span class="value">${receiptData.className}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Status:</span>
                            <span class="value">
                                ${isFullPayment ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; background: ${isFullPayment ? '#d4edda' : '#fff3cd'}; color: ${isFullPayment ? '#155724' : '#856404'}; margin-left: 5px;">
                                    ${isFullPayment ? '✓ PAID' : '⚡ PARTIAL'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Fee Breakdown (if fees exist) -->
                ${activeFees.length > 0 ? `
                <div>
                    <div class="section-title">FEE BREAKDOWN</div>
                    <table class="fee-table">
                        <tbody>
                            ${feeBreakdownTable}
                            <tr class="total-row">
                                <td><strong>Total Fee Due</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(totalFee)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ` : ''}
                
                <!-- Payment Summary -->
                <div class="payment-summary">
                    <div class="section-title">PAYMENT SUMMARY</div>
                    <div class="summary-item">
                        <span>Total Fee Due:</span>
                        <span>${formatCurrency(totalFee)}</span>
                    </div>
                    <div class="summary-item">
                        <span>Amount Paid:</span>
                        <span><strong>${formatCurrency(totalAmount)}</strong></span>
                    </div>
                    <div class="summary-item">
                        <span>${remainingBalance > 0 ? 'Remaining Balance:' : 'Overpayment:'}</span>
                        <span style="color: ${remainingBalance > 0 ? '#e74c3c' : '#27ae60'}; font-weight: 600;">
                            ${formatCurrency(Math.abs(remainingBalance))}
                            ${remainingBalance > 0 ? '⚠️ Due' : '✓ Credit'}
                        </span>
                    </div>
                </div>
                
                <!-- Amount Highlight -->
                <div class="amount-highlight">
                    AMOUNT PAID: ${formatCurrency(totalAmount)}
                </div>
                
                <!-- Email Notification -->
                ${receiptData.studentEmail ? `
                <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #2196F3; font-size: 11px;">
                    <strong>📧 Email Sent To:</strong> ${receiptData.studentEmail}
                </div>
                ` : ''}
                
                <!-- Footer -->
                <div class="footer">
                    <div style="margin-bottom: 8px;">
                        <strong>Thank you for your payment!</strong>
                    </div>
                    <div>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div style="margin-top: 5px; font-size: 9px; color: #95a5a6;">
                        Please keep this receipt for your records. For any queries, contact the school administration.
                    </div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    // Focus and print
                    window.focus();
                    
                    // Auto-print after a short delay
                    setTimeout(function() {
                        window.print();
                    }, 250);
                    
                    // Auto-close after printing
                    window.addEventListener('afterprint', function() {
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    });
                    
                    // Fallback close after 5 seconds
                    setTimeout(function() {
                        window.close();
                    }, 5000);
                };
            </script>
        </body>
        </html>
    `;
};

// Helper function for thermal printer receipt
const createThermalReceiptHTML = (totalAmount, totalFee, isFullPayment, remainingBalance, activeFees, receiptData) => {
    // Generate fee breakdown rows
    let feeBreakdownHTML = '';
    
    if (receiptData.feeBreakdown) {
        const fees = [
            { name: 'Monthly Fee', amount: receiptData.feeBreakdown?.monthlyFee || 0 },
            { name: 'Admission Fee', amount: receiptData.feeBreakdown?.admissionFee || 0 },
            { name: 'Exam Fee', amount: receiptData.feeBreakdown?.examFee || 0 },
            { name: 'Sports Fee', amount: receiptData.feeBreakdown?.sportsFee || 0 },
            { name: 'Library Fee', amount: receiptData.feeBreakdown?.libraryFee || 0 },
            { name: 'Lab Fee', amount: receiptData.feeBreakdown?.labFee || 0 },
            { name: 'Other Fees', amount: receiptData.feeBreakdown?.otherFee || 0 }
        ];
        
        // Check if we have meaningful fee breakdown
        const hasFeeBreakdown = fees.some(fee => fee.amount > 0);
        
        if (hasFeeBreakdown) {
            if (isFullPayment) {
                // Show full breakdown for full payment
                feeBreakdownHTML = `
                    <div class="divider"></div>
                    <div class="text-center"><strong>FEE BREAKDOWN</strong></div>
                    <div class="divider"></div>
                `;
                
                fees.forEach(fee => {
                    if (fee.amount > 0) {
                        feeBreakdownHTML += `
                            <div class="row">
                                <div class="text-left">${fee.name}:</div>
                                <div class="text-right">${formatCurrency(fee.amount)}</div>
                            </div>
                        `;
                    }
                });
                
                feeBreakdownHTML += `
                    <div class="row bold">
                        <div class="text-left">TOTAL FEE:</div>
                        <div class="text-right">${formatCurrency(totalFee)}</div>
                    </div>
                    <div class="divider"></div>
                `;
            } else {
                // For partial payments
                feeBreakdownHTML = `
                    <div class="divider"></div>
                    <div class="text-center"><strong>PAYMENT SUMMARY</strong></div>
                    <div class="divider"></div>
                    <div class="row">
                        <div class="text-left">Total Fee:</div>
                        <div class="text-right">${formatCurrency(totalFee)}</div>
                    </div>
                    <div class="row">
                        <div class="text-left">Amount Paid:</div>
                        <div class="text-right bold">${formatCurrency(totalAmount)}</div>
                    </div>
                    <div class="row">
                        <div class="text-left">Balance:</div>
                        <div class="text-right">${formatCurrency(totalFee - totalAmount)}</div>
                    </div>
                    <div class="divider"></div>
                `;
            }
        }
    }
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt Print</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                    @page { 
                        size: 80mm auto;
                        margin: 0;
                    }
                    body {
                        width: 80mm;
                        font-family: 'Courier New', monospace;
                        font-size: 10px;
                        margin: 0;
                        padding: 2mm;
                        line-height: 1.1;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 3px 0;
                    }
                    .double-divider {
                        border-top: 2px solid #000;
                        margin: 5px 0;
                    }
                    .text-left { text-align: left; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                    }
                    .header {
                        font-size: 12px;
                        font-weight: bold;
                        margin: 8px 0;
                    }
                    .small {
                        font-size: 9px;
                    }
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    line-height: 1.1;
                    margin: 0;
                    padding: 3mm;
                    width: 80mm;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 3px 0;
                }
                .double-divider {
                    border-top: 2px solid #000;
                    margin: 5px 0;
                }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin: 2px 0;
                }
                .header {
                    font-size: 12px;
                    font-weight: bold;
                    margin: 8px 0;
                }
                .small {
                    font-size: 9px;
                }
                @media screen {
                    body {
                        border: 1px dashed #ccc;
                        margin: 20px auto;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                }
            </style>
        </head>
        <body>
            <div class="text-center header">Sammana Educational Institute</div>
            <div class="text-center header">FEE PAYMENT RECEIPT</div>
            <div class="text-center small">${isFullPayment ? 'FULL PAYMENT' : 'PARTIAL PAYMENT'}</div>
            <div class="text-center">===============================</div>
            <br>
            
            <div class="row">
                <div class="text-left"><strong>Student:</strong></div>
                <div class="text-right">${receiptData.studentName}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>ID:</strong></div>
                <div class="text-right">${receiptData.studentId}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>Class:</strong></div>
                <div class="text-right">${receiptData.className}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>Month:</strong></div>
                <div class="text-right">${receiptData.month}</div>
            </div>
            
            ${feeBreakdownHTML}
            
            <div class="row">
                <div class="text-left"><strong>Amount Paid:</strong></div>
                <div class="text-right bold">${formatCurrency(totalAmount)}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>Payment Method:</strong></div>
                <div class="text-right">${receiptData.paymentMethod}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>TXN ID:</strong></div>
                <div class="text-right small">${receiptData.transactionId}</div>
            </div>
            <div class="row">
                <div class="text-left"><strong>Date:</strong></div>
                <div class="text-right">${receiptData.date}</div>
            </div>
            
            <div class="double-divider"></div>
            
            <div class="text-center bold">THANK YOU!</div>
            <div class="text-center small">Keep this receipt for records</div>
            
            <div class="divider"></div>
            
            <div class="text-center small">
                ${new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            
            <script>
                window.onload = function() {
                    // Auto-print after a short delay
                    setTimeout(function() {
                        window.print();
                    }, 500);
                    
                    // Auto-close after printing (or after timeout)
                    setTimeout(function() {
                        window.close();
                    }, 5000);
                };
                
                // Also allow manual printing
                window.addEventListener('afterprint', function() {
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                });
            </script>
        </body>
        </html>
    `;
};

// Function to open and print receipt
export const printReceipt = (receiptData, printerType = 'REGULAR') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow pop-ups to print receipt');
        return false;
    }
    
    const receiptHTML = handlePrintReceipt(receiptData, printerType);
    if (!receiptHTML) {
        alert('No receipt data available');
        return false;
    }
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Auto-print and close
    printWindow.addEventListener('load', () => {
        setTimeout(() => {
            printWindow.print();
        }, 250);
        
        printWindow.addEventListener('afterprint', () => {
            setTimeout(() => {
                printWindow.close();
            }, 500);
        });
        
        // Fallback close
        setTimeout(() => {
            printWindow.close();
        }, 5000);
    });
    
    return true;
};

// For USB direct printing
export const handleDirectUSBPrint = (receiptData) => {
    // Show instructions
    const proceed = window.confirm(
        'For direct USB printing:\n\n' +
        '1. Ensure your receipt printer is connected via USB\n' +
        '2. Set it as default printer in your system\n' +
        '3. Click OK to print receipt\n\n' +
        'If automatic printing fails:\n' +
        '- Press Ctrl+P on the receipt window\n' +
        '- Select your receipt printer\n' +
        '- Click Print\n\n' +
        'Click OK to continue printing.'
    );
    
    if (proceed) {
        return printReceipt(receiptData, 'THERMAL');
    }
    return false;
};
import { Worker, Transaction, ExportData } from '../types';
import { CalculationService } from './calculations';

export const ExportService = {
  exportToCSV: (data: ExportData): void => {
    const { workers, transactions, dateRange, filters } = data;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header information
    csvContent += "Hulimane Labour Management - Export Report\n";
    csvContent += `Export Date: ${new Date().toLocaleDateString()}\n`;
    if (dateRange) {
      csvContent += `Date Range: ${dateRange.from} to ${dateRange.to}\n`;
    }
    csvContent += "\n";
    
    // Workers Summary
    csvContent += "Workers Summary\n";
    csvContent += "Name,Phone,Category,Subcategory,Opening Balance,Current Balance,Status\n";
    
    workers.forEach(worker => {
      const balanceStatus = CalculationService.getBalanceStatus(worker.currentBalance);
      csvContent += `"${worker.name}","${worker.phone}","${worker.category}","${worker.subcategory}",${worker.openingBalance},${worker.currentBalance},"${balanceStatus.message}"\n`;
    });
    
    csvContent += "\n";
    
    // Detailed Transactions
    csvContent += "Detailed Transactions\n";
    csvContent += "Date,Worker Name,Type,Attendance,Amount,Balance,Narration\n";
    
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedTransactions.forEach(transaction => {
      const worker = workers.find(w => w.id === transaction.workerId);
      const workerName = worker ? worker.name : 'Unknown';
      const attendance = transaction.attendance || '';
      const narration = transaction.narration || '';
      
      csvContent += `"${transaction.date}","${workerName}","${transaction.type}","${attendance}",${transaction.amount},${transaction.balance},"${narration}"\n`;
    });
    
    // Create and download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hulimane_labour_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToPDF: (data: ExportData): void => {
    const { workers, transactions, dateRange, filters } = data;
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate PDF');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hulimane Labour Management Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #3B82F6;
              margin-bottom: 5px;
            }
            
            .report-info {
              font-size: 14px;
              color: #666;
            }
            
            .section {
              margin: 30px 0;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              border-bottom: 1px solid #E5E7EB;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th, td {
              border: 1px solid #E5E7EB;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            
            th {
              background-color: #F3F4F6;
              font-weight: bold;
            }
            
            .amount {
              text-align: right;
            }
            
            .status-positive {
              color: #059669;
              font-weight: bold;
            }
            
            .status-negative {
              color: #DC2626;
              font-weight: bold;
            }
            
            .status-settled {
              color: #6B7280;
            }
            
            .summary-stats {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            
            .stat-card {
              background: #F9FAFB;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
            }
            
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
            }
            
            .stat-label {
              font-size: 12px;
              color: #6B7280;
              margin-top: 5px;
            }
            
            @media print {
              body { margin: 0; }
              .section { page-break-inside: avoid; }
              .stat-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Hulimane Labour Management</div>
            <div class="report-info">
              Export Date: ${new Date().toLocaleDateString()}<br>
              ${dateRange ? `Date Range: ${dateRange.from} to ${dateRange.to}` : 'All Records'}
            </div>
          </div>

          ${ExportService.generateSummaryStatsHTML(workers, transactions)}
          
          <div class="section">
            <div class="section-title">Workers Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th class="amount">Opening Balance</th>
                  <th class="amount">Current Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${workers.map(worker => {
                  const balanceStatus = CalculationService.getBalanceStatus(worker.currentBalance);
                  const statusClass = worker.currentBalance > 0 ? 'status-negative' : 
                                    worker.currentBalance < 0 ? 'status-positive' : 'status-settled';
                  
                  return `
                    <tr>
                      <td>${worker.name}</td>
                      <td>${CalculationService.formatPhone(worker.phone)}</td>
                      <td>${worker.category}</td>
                      <td>${worker.subcategory}</td>
                      <td class="amount">${CalculationService.formatCurrency(worker.openingBalance)}</td>
                      <td class="amount">${CalculationService.formatCurrency(worker.currentBalance)}</td>
                      <td class="${statusClass}">${balanceStatus.message}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Transaction History</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker</th>
                  <th>Type</th>
                  <th>Attendance</th>
                  <th class="amount">Amount</th>
                  <th class="amount">Balance</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${transactions
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(transaction => {
                    const worker = workers.find(w => w.id === transaction.workerId);
                    return `
                      <tr>
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${worker ? worker.name : 'Unknown'}</td>
                        <td style="text-transform: capitalize">${transaction.type}</td>
                        <td style="text-transform: capitalize">${transaction.attendance || '-'}</td>
                        <td class="amount">${CalculationService.formatCurrency(transaction.amount)}</td>
                        <td class="amount">${CalculationService.formatCurrency(transaction.balance)}</td>
                        <td>${transaction.narration || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  },

  generateSummaryStatsHTML: (workers: Worker[], transactions: Transaction[]): string => {
    const stats = CalculationService.calculateSummaryStats(workers, transactions);
    
    return `
      <div class="section">
        <div class="section-title">Summary Statistics</div>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-value status-negative">${CalculationService.formatCurrency(stats.totalIOweThem)}</div>
            <div class="stat-label">Total I Owe Them</div>
          </div>
          <div class="stat-card">
            <div class="stat-value status-positive">${CalculationService.formatCurrency(stats.totalTheyOweMe)}</div>
            <div class="stat-label">Total They Owe Me</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${CalculationService.formatCurrency(stats.totalWagesGiven)}</div>
            <div class="stat-label">Total Wages Given</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${CalculationService.formatCurrency(stats.totalPaymentsMade)}</div>
            <div class="stat-label">Total Payments Made</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.workersCount}</div>
            <div class="stat-label">Total Workers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.activeWorkers}</div>
            <div class="stat-label">Active Workers</div>
          </div>
        </div>
      </div>
    `;
  }
};
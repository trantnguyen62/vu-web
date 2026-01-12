// Loan Tool - Full Page Functionality
let loanData = null;
let amortizationSchedule = [];
let viewMode = 'yearly';

document.addEventListener('DOMContentLoaded', function () {
    initLoanTool();
});

function initLoanTool() {
    document.getElementById('calculate-loan')?.addEventListener('click', calculateLoan);
    document.getElementById('loan-export-csv')?.addEventListener('click', exportLoanToCSV);
    document.getElementById('loan-export-pdf')?.addEventListener('click', exportLoanToPDF);

    // Scenario buttons
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('extra-payment').value = btn.dataset.extra;
            calculateLoan();
        });
    });

    // Amortization tabs
    document.querySelectorAll('.amort-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.amort-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            viewMode = tab.dataset.view;
            if (amortizationSchedule.length > 0) updateAmortizationTable();
        });
    });
}

function calculateLoan() {
    const principal = getInputValue('loan-amount') || 0;
    const annualRate = getInputValue('interest-rate') || 0;
    const years = getInputValue('loan-term') || 30;
    const extraPayment = getInputValue('extra-payment') || 0;

    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;

    // Standard payment calculation
    const monthlyPayment = monthlyRate > 0
        ? principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : principal / numPayments;

    // Generate amortization schedules
    const standardSchedule = generateAmortization(principal, monthlyRate, monthlyPayment, 0);
    const acceleratedSchedule = generateAmortization(principal, monthlyRate, monthlyPayment, extraPayment);

    amortizationSchedule = acceleratedSchedule;

    const standardInterest = standardSchedule.reduce((s, p) => s + p.interest, 0);
    const acceleratedInterest = acceleratedSchedule.reduce((s, p) => s + p.interest, 0);
    const interestSavings = standardInterest - acceleratedInterest;
    const monthsSaved = standardSchedule.length - acceleratedSchedule.length;

    loanData = {
        principal, annualRate, years, extraPayment,
        monthlyPayment: monthlyPayment + extraPayment,
        standardInterest, acceleratedInterest, interestSavings, monthsSaved,
        standardMonths: standardSchedule.length,
        acceleratedMonths: acceleratedSchedule.length
    };

    // Update UI
    document.getElementById('monthly-payment-result').textContent = formatCurrency(monthlyPayment + extraPayment);
    document.getElementById('total-interest').textContent = formatCurrency(acceleratedInterest);
    document.getElementById('interest-savings').textContent = formatCurrency(interestSavings);
    document.getElementById('time-saved').textContent = monthsSaved > 0 ? `${Math.floor(monthsSaved / 12)}y ${monthsSaved % 12}m` : '0 months';

    // Payoff comparison
    const standardYears = standardSchedule.length / 12;
    const acceleratedYears = acceleratedSchedule.length / 12;
    document.getElementById('standard-payoff-bar').style.width = '100%';
    document.getElementById('accelerated-payoff-bar').style.width = (acceleratedYears / standardYears * 100) + '%';
    document.getElementById('standard-payoff-date').textContent = `${standardYears.toFixed(1)} years`;
    document.getElementById('accelerated-payoff-date').textContent = `${acceleratedYears.toFixed(1)} years`;

    updateLoanChart(acceleratedSchedule);
    updateAmortizationTable();

    showNotification('Loan calculated!', 'success');
}

function generateAmortization(principal, monthlyRate, payment, extra) {
    const schedule = [];
    let balance = principal;
    let month = 0;

    while (balance > 0.01 && month < 600) {
        month++;
        const interestPayment = balance * monthlyRate;
        let principalPayment = payment - interestPayment + extra;

        if (principalPayment > balance) principalPayment = balance;
        balance -= principalPayment;

        schedule.push({
            month,
            payment: interestPayment + principalPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.max(0, balance)
        });
    }

    return schedule;
}

function updateLoanChart(schedule) {
    const canvas = document.getElementById('loan-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Sample data points (every 12 months)
    const yearly = [];
    for (let i = 11; i < schedule.length; i += 12) {
        const yearData = schedule.slice(Math.max(0, i - 11), i + 1);
        yearly.push({
            year: Math.floor(i / 12) + 1,
            principal: yearData.reduce((s, p) => s + p.principal, 0),
            interest: yearData.reduce((s, p) => s + p.interest, 0)
        });
    }

    if (yearly.length === 0) return;

    const maxValue = Math.max(...yearly.map(y => y.principal + y.interest));
    const barWidth = (chartWidth / yearly.length) * 0.7;
    const barGap = (chartWidth / yearly.length) * 0.3;

    yearly.forEach((data, i) => {
        const x = padding.left + i * (barWidth + barGap) + barGap / 2;
        const principalHeight = (data.principal / maxValue) * chartHeight;
        const interestHeight = (data.interest / maxValue) * chartHeight;

        // Interest (bottom)
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, padding.top + chartHeight - interestHeight, barWidth, interestHeight);

        // Principal (top)
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(x, padding.top + chartHeight - interestHeight - principalHeight, barWidth, principalHeight);

        // Year label
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Y${data.year}`, x + barWidth / 2, height - 10);
    });

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const value = (maxValue / 4) * i;
        const y = padding.top + chartHeight - (chartHeight / 4) * i;
        ctx.fillText(formatCurrencyShort(value), padding.left - 5, y + 3);
    }
}

function updateAmortizationTable() {
    const body = document.getElementById('amortization-body');
    if (!body || amortizationSchedule.length === 0) return;

    let rows;
    if (viewMode === 'yearly') {
        const yearly = [];
        for (let i = 0; i < amortizationSchedule.length; i += 12) {
            const yearData = amortizationSchedule.slice(i, i + 12);
            yearly.push({
                period: `Year ${Math.floor(i / 12) + 1}`,
                payment: yearData.reduce((s, p) => s + p.payment, 0),
                principal: yearData.reduce((s, p) => s + p.principal, 0),
                interest: yearData.reduce((s, p) => s + p.interest, 0),
                balance: yearData[yearData.length - 1].balance
            });
        }
        rows = yearly;
    } else {
        rows = amortizationSchedule.slice(0, 60).map(p => ({
            period: `Month ${p.month}`,
            payment: p.payment,
            principal: p.principal,
            interest: p.interest,
            balance: p.balance
        }));
    }

    body.innerHTML = rows.map(r => `
        <tr>
            <td>${r.period}</td>
            <td>${formatCurrency(r.payment)}</td>
            <td>${formatCurrency(r.principal)}</td>
            <td>${formatCurrency(r.interest)}</td>
            <td>${formatCurrency(r.balance)}</td>
        </tr>
    `).join('');
}

function exportLoanToCSV() {
    if (!loanData || amortizationSchedule.length === 0) { showNotification('Calculate loan first', 'error'); return; }

    let csv = 'Month,Payment,Principal,Interest,Balance\n';
    amortizationSchedule.forEach(p => {
        csv += `${p.month},${p.payment.toFixed(2)},${p.principal.toFixed(2)},${p.interest.toFixed(2)},${p.balance.toFixed(2)}\n`;
    });

    downloadFile(csv, 'amortization-schedule.csv', 'text/csv');
    showNotification('CSV downloaded!', 'success');
}

function exportLoanToPDF() {
    if (!loanData) { showNotification('Calculate loan first', 'error'); return; }

    const content = `LOAN AMORTIZATION REPORT
Generated: ${new Date().toLocaleDateString()}

${'='.repeat(50)}
LOAN DETAILS
${'='.repeat(50)}
Loan Amount: ${formatCurrency(loanData.principal)}
Interest Rate: ${loanData.annualRate}%
Loan Term: ${loanData.years} years
Extra Monthly Payment: ${formatCurrency(loanData.extraPayment)}

${'='.repeat(50)}
RESULTS
${'='.repeat(50)}
Monthly Payment: ${formatCurrency(loanData.monthlyPayment)}
Total Interest: ${formatCurrency(loanData.acceleratedInterest)}
Interest Savings: ${formatCurrency(loanData.interestSavings)}
Time Saved: ${Math.floor(loanData.monthsSaved / 12)} years ${loanData.monthsSaved % 12} months
Payoff Time: ${(loanData.acceleratedMonths / 12).toFixed(1)} years

${'='.repeat(50)}
COMPARISON
${'='.repeat(50)}
Standard Payoff: ${loanData.standardMonths} months (${loanData.standardYears} years)
With Extra Payments: ${loanData.acceleratedMonths} months
`;

    downloadFile(content, 'loan-analysis-report.txt', 'text/plain');
    showNotification('Report downloaded!', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

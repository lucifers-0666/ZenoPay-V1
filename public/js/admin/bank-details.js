// Bank Details Page
document.addEventListener('DOMContentLoaded', function() {
    loadBankDetails();
});

function loadBankDetails() {
    // Sample bank data
    const bank = {
        id: 1,
        bankName: 'Federal Bank',
        bankCode: 'FDRL0000001',
        swiftCode: 'FBININD21',
        registrationNumber: 'RBI/2025/01234',
        registeredDate: '12 Jan 2025',
        status: 'Active',
        contact: 'Rajesh Kumar',
        email: 'rajesh@federalbank.com',
        phone: '+91 9876 543 210',
        supportEmail: 'support@federalbank.com',
        supportPhone: '+91 1234 567 890',
        settlementCycle: 'Daily',
        settlementTime: '3:00 PM IST',
        commissionRate: '2.5%',
        minTransaction: '₹ 100',
        maxTransaction: '₹ 50,00,000'
    };

    // Update page with data
    document.getElementById('bankName').textContent = bank.bankName;
    document.getElementById('bankStatus').textContent = bank.status;
}

function editBank() {
    window.location.href = '/admin/banks/1/edit';
}

function suspendBank() {
    if (confirm('Are you sure you want to suspend this bank?')) {
        showToast('Bank suspended successfully', 'success');
        setTimeout(() => {
            window.location.href = '/admin/banks';
        }, 1500);
    }
}

function deleteBank() {
    if (confirm('Are you sure you want to delete this bank? This action cannot be undone.')) {
        showToast('Bank deleted successfully', 'success');
        setTimeout(() => {
            window.location.href = '/admin/banks';
        }, 1500);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

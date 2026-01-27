// Referral Program JavaScript

// Generate QR Code
const referralLink = document.getElementById('referral-link')?.value;
if (referralLink) {
  QRCode.toCanvas(document.getElementById('qr-code'), referralLink, {
    width: 200,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

// Copy code/link
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
      }, 2000);
      showToast('Copied to clipboard', 'success');
    });
  });
});

// Share via different methods
document.querySelectorAll('.share-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const method = btn.dataset.method;
    const referralLink = document.getElementById('referral-link').value;
    const text = `Join me on ZenoPay and we'll both get rewarded! Use my referral link: ${referralLink}`;
    
    let url;
    switch (method) {
      case 'email':
        url = `mailto:?subject=Join ZenoPay&body=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'sms':
        url = `sms:?body=${encodeURIComponent(text)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      
      // Track share
      fetch('/referral/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, recipient: null })
      });
    }
  });
});

// Invite now button - scroll to referral section
document.getElementById('invite-now-btn')?.addEventListener('click', () => {
  document.querySelector('.referral-section')?.scrollIntoView({ behavior: 'smooth' });
});

// Redeem rewards
const redeemBtn = document.getElementById('redeem-btn');
const redeemModal = document.getElementById('redeem-modal');
const closeRedeemModal = document.getElementById('close-redeem-modal');
const cancelRedeemBtn = document.getElementById('cancel-redeem-btn');
const redeemForm = document.getElementById('redeem-form');

redeemBtn?.addEventListener('click', () => {
  redeemModal.hidden = false;
});

closeRedeemModal?.addEventListener('click', () => {
  redeemModal.hidden = true;
});

cancelRedeemBtn?.addEventListener('click', () => {
  redeemModal.hidden = true;
});

redeemModal?.addEventListener('click', (e) => {
  if (e.target === redeemModal) {
    redeemModal.hidden = true;
  }
});

redeemForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const method = document.getElementById('redeem-method').value;
  const availableBalance = parseFloat(document.querySelector('.balance-display').textContent.replace('$', ''));
  
  try {
    const response = await fetch('/referral/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: availableBalance, method })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Rewards redeemed successfully!', 'success');
      redeemModal.hidden = true;
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    showToast('Failed to redeem rewards', 'error');
  }
});

// Web Share API fallback
if (navigator.share) {
  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-btn';
  shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share';
  shareBtn.addEventListener('click', () => {
    navigator.share({
      title: 'Join ZenoPay',
      text: 'Join me on ZenoPay and we\'ll both get rewarded!',
      url: referralLink
    });
  });
  document.querySelector('.share-buttons')?.appendChild(shareBtn);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, 4000);
}

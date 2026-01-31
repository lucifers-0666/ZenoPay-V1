// Initialize QR code on page load
document.addEventListener('DOMContentLoaded', function() {
  generateQRCode();
  loadReferralList();
  loadRewardsHistory();
});

// Generate QR code
function generateQRCode() {
  const canvas = document.getElementById('qr-canvas');
  if (canvas && window.QRCode) {
    QRCode.toCanvas(canvas, referralLink, {
      width: 200,
      margin: 2,
      color: { dark: '#667eea', light: '#ffffff' }
    });
  }
}

// Copy referral code
function copyCode() {
  navigator.clipboard.writeText(referralCode).then(() => {
    showToast('Referral code copied!', 'success');
  }).catch(err => {
    showToast('Failed to copy code', 'error');
  });
}

// Copy referral link
function copyLink() {
  navigator.clipboard.writeText(referralLink).then(() => {
    showToast('Referral link copied!', 'success');
  }).catch(err => {
    showToast('Failed to copy link', 'error');
  });
}

// Share on WhatsApp
function shareWhatsApp() {
  const message = `Hey! Join me on ZenoPay and get rewarded. Use my code: ${referralCode}\n\n${referralLink}`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  trackShare('whatsapp');
}

// Share via Email
function shareEmail() {
  const subject = 'Join ZenoPay and Get Rewarded!';
  const body = `Hey there!\n\nI'm inviting you to join ZenoPay - a secure and easy payment platform. Use my referral code ${referralCode} when you sign up and we both get rewarded!\n\nClick here to join: ${referralLink}\n\nLooking forward to having you on board!`;
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
  trackShare('email');
}

// Share on Facebook
function shareFacebook() {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
  window.open(url, '_blank', 'width=600,height=400');
  trackShare('facebook');
}

// Share on Twitter
function shareTwitter() {
  const text = `Join me on ZenoPay using code ${referralCode} and get rewarded!`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
  window.open(url, '_blank', 'width=600,height=400');
  trackShare('twitter');
}

// Share on LinkedIn
function shareLinkedIn() {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
  window.open(url, '_blank', 'width=600,height=400');
  trackShare('linkedin');
}

// Share on Telegram
function shareTelegram() {
  const text = `Join me on ZenoPay using code ${referralCode} and get rewarded!`;
  const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  trackShare('telegram');
}

// Download QR code
function downloadQR() {
  const canvas = document.getElementById('qr-canvas');
  const link = document.createElement('a');
  link.download = `referral-qr-${referralCode}.png`;
  link.href = canvas.toDataURL();
  link.click();
  showToast('QR code downloaded!', 'success');
}

// Track share action
function trackShare(platform) {
  fetch(`/api/referral/track/${referralCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: platform })
  }).catch(err => console.error('Track error:', err));
}

// Scroll to share section
function scrollToShare() {
  document.getElementById('share-section').scrollIntoView({ behavior: 'smooth' });
}

// Switch tabs
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  if (tabName === 'list') loadReferralList();
  if (tabName === 'rewards') loadRewardsHistory();
  if (tabName === 'leaderboard') loadLeaderboard('all-time');
}

// Load referral list
async function loadReferralList() {
  try {
    const response = await fetch('/api/referral/list');
    const data = await response.json();

    const tableContainer = document.getElementById('referrals-table');
    
    if (!data.referrals || data.referrals.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No Referrals Yet</h3>
          <p>Start inviting friends to see them here!</p>
          <button class="btn btn-primary" onclick="scrollToShare()">Share Now</button>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Referred User</th>
            <th>Status</th>
            <th>Joined Date</th>
            <th>First Transaction</th>
            <th>Reward Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.referrals.map(ref => `
            <tr>
              <td><strong>${ref.referred_user_name || 'Anonymous User'}</strong><br><small>${ref.referred_user_email || 'N/A'}</small></td>
              <td><span class="badge ${ref.status === 'completed' ? 'success' : 'pending'}">${ref.status.toUpperCase()}</span></td>
              <td>${new Date(ref.created_at).toLocaleDateString()}</td>
              <td>${ref.completed_at ? new Date(ref.completed_at).toLocaleDateString() : 'Pending'}</td>
              <td><span class="badge ${ref.reward_credited ? 'completed' : 'pending'}">${ref.reward_credited ? 'Credited' : 'Pending'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load referrals:', error);
    showToast('Failed to load referrals', 'error');
  }
}

// Load rewards history
async function loadRewardsHistory() {
  try {
    const response = await fetch('/api/referral/rewards');
    const data = await response.json();

    const tableContainer = document.getElementById('rewards-table');
    
    if (!data.rewards || data.rewards.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-coins"></i>
          <h3>No Rewards Yet</h3>
          <p>Invite friends to start earning rewards!</p>
          <button class="btn btn-primary" onclick="scrollToShare()">Start Inviting</button>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${data.rewards.map(reward => `
            <tr>
              <td><span class="badge ${reward.reward_type === 'signup_bonus' ? 'success' : reward.reward_type === 'transaction_bonus' ? 'completed' : 'pending'}">${reward.reward_type.replace('_', ' ').toUpperCase()}</span></td>
              <td><strong>₹${reward.amount.toFixed(2)}</strong></td>
              <td><span class="badge ${reward.status === 'credited' ? 'success' : reward.status === 'pending' ? 'pending' : 'completed'}">${reward.status.toUpperCase()}</span></td>
              <td>${new Date(reward.created_at).toLocaleDateString()}</td>
              <td>${reward.description || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:24px;padding:20px;background:#f9fafb;border-radius:12px;text-align:center">
        <h3 style="font-size:24px;color:#667eea;margin-bottom:8px">₹${data.totalRewards.toFixed(2)}</h3>
        <p style="color:#6b7280">Total Rewards Earned</p>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load rewards:', error);
    showToast('Failed to load rewards', 'error');
  }
}

// Load leaderboard
async function loadLeaderboard(period = 'all-time') {
  try {
    const response = await fetch(`/api/referral/leaderboard?period=${period}`);
    const data = await response.json();

    const tableContainer = document.getElementById('leaderboard-table');
    
    if (!data.leaderboard || data.leaderboard.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <h3>No Rankings Yet</h3>
          <p>Be the first to start referring!</p>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Referrals</th>
            <th>Rewards Earned</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>
          ${data.leaderboard.map((user, index) => {
            const tier = user.referralCount >= 25 ? 'Gold' : user.referralCount >= 10 ? 'Silver' : 'Bronze';
            const tierColor = tier === 'Gold' ? '#FFD700' : tier === 'Silver' ? '#C0C0C0' : '#CD7F32';
            return `
              <tr style="${user.isCurrentUser ? 'background:#f0f4ff;font-weight:600' : ''}">
                <td>
                  ${index < 3 ? `<i class="fas fa-trophy" style="color:${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}"></i>` : ''}
                  ${index + 1}
                  ${user.isCurrentUser ? '<span class="badge success" style="margin-left:8px">YOU</span>' : ''}
                </td>
                <td><strong>${user.userName || 'Anonymous'}</strong></td>
                <td>${user.referralCount}</td>
                <td>₹${user.totalRewards.toFixed(2)}</td>
                <td><span class="badge" style="background-color:${tierColor};color:white">${tier}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    showToast('Failed to load leaderboard', 'error');
  }
}

// Open custom code modal
function openCustomCodeModal() {
  document.getElementById('custom-code-modal').classList.add('active');
  document.getElementById('custom-code-input').value = '';
  document.getElementById('custom-code-input').focus();
}

// Close custom code modal
function closeCustomCodeModal() {
  document.getElementById('custom-code-modal').classList.remove('active');
}

// Save custom code
async function saveCustomCode() {
  const customCode = document.getElementById('custom-code-input').value.trim().toUpperCase();
  
  if (!customCode) {
    showToast('Please enter a code', 'error');
    return;
  }

  if (customCode.length < 4 || customCode.length > 15) {
    showToast('Code must be 4-15 characters', 'error');
    return;
  }

  if (!/^[A-Z0-9]+$/.test(customCode)) {
    showToast('Only letters and numbers allowed', 'error');
    return;
  }

  try {
    const response = await fetch('/api/referral/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customCode })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Referral code updated successfully!', 'success');
      closeCustomCodeModal();
      // Update page with new code
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast(data.message || 'Failed to update code', 'error');
    }
  } catch (error) {
    console.error('Failed to save custom code:', error);
    showToast('Failed to update code', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const color = type === 'success' ? '#10b981' : '#ef4444';
  
  toast.innerHTML = `<i class="fas ${icon}" style="color:${color}"></i> ${message}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Close modal on outside click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  var icon = btn.querySelector('i');
  if (!input || !icon) return;

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

function showAuthToast(message, type) {
  var toast = document.createElement('div');
  toast.style.cssText =
    'position:fixed; top:20px; right:20px; z-index:9999;' +
    'padding:12px 20px; border-radius:10px; font-size:0.85rem;' +
    'font-weight:500; color:#fff; box-shadow:0 8px 24px rgba(0,0,0,0.15);' +
    'display:flex; align-items:center; gap:8px;' +
    'background:' + (type === 'success' ? '#22c55e' :
                     type === 'error'   ? '#ef4444' : '#3B82F6') + ';';
  toast.innerHTML =
    '<i class="fas fa-' + (type === 'success' ? 'circle-check' :
    type === 'error' ? 'circle-xmark' : 'circle-info') + '"></i>' +
    message;
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}
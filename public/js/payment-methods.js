(function() {
  const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
  const setDefaultBtns = document.querySelectorAll('.set-default-btn');
  const removeBtns = document.querySelectorAll('.remove-btn');
  const disconnectBtns = document.querySelectorAll('.disconnect-btn');
  const addMethodBtn = document.getElementById('add-method-btn');
  const addFirstMethodBtn = document.getElementById('add-first-method');
  const modal = document.getElementById('confirm-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const toast = document.getElementById('toast');

  let pendingAction = null;

  // Toast notification
  function showToast(message, variant = 'info') {
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = variant === 'success' ? '#123524' : '#0f172a';
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 2500);
  }

  // Close all dropdowns
  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach((menu) => {
      menu.classList.remove('show');
    });
  }

  // Dropdown toggle
  dropdownTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = trigger.dataset.target;
      const dropdown = document.getElementById(`dropdown-${targetId}`);
      const isShowing = dropdown.classList.contains('show');
      
      closeAllDropdowns();
      
      if (!isShowing) {
        dropdown.classList.add('show');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-trigger') && !e.target.closest('.dropdown-menu')) {
      closeAllDropdowns();
    }
  });

  // Show modal
  function showModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.hidden = false;
    pendingAction = onConfirm;
  }

  // Hide modal
  function hideModal() {
    modal.hidden = true;
    pendingAction = null;
  }

  // Modal close handlers
  modalClose.addEventListener('click', hideModal);
  modalCancel.addEventListener('click', hideModal);
  modal.querySelector('.modal-overlay').addEventListener('click', hideModal);

  // Modal confirm
  modalConfirm.addEventListener('click', async () => {
    if (pendingAction) {
      await pendingAction();
    }
    hideModal();
  });

  // Set as default
  setDefaultBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      closeAllDropdowns();
      const methodId = btn.dataset.id;
      const methodType = btn.dataset.type;

      try {
        const res = await fetch('/payment-methods/set-default', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ methodId, methodType }),
        });

        const data = await res.json();

        if (data.success) {
          showToast('Default payment method updated', 'success');
          // Reload page to reflect changes
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(data.message || 'Failed to set default');
        }
      } catch (err) {
        console.error(err);
        showToast('Something went wrong');
      }
    });
  });

  // Remove payment method
  removeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      closeAllDropdowns();
      const methodId = btn.dataset.id;
      const methodType = btn.dataset.type;
      const methodName = btn.dataset.name;

      showModal(
        'Remove Payment Method',
        `Are you sure you want to remove ${methodName}? This action cannot be undone.`,
        async () => {
          try {
            const res = await fetch('/payment-methods/remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ methodId, methodType }),
            });

            const data = await res.json();

            if (data.success) {
              showToast('Payment method removed', 'success');
              // Remove element from DOM
              const element = document.querySelector(`[data-id="${methodId}"][data-type="${methodType}"]`);
              if (element) {
                element.style.opacity = '0';
                element.style.transform = 'scale(0.9)';
                setTimeout(() => {
                  element.remove();
                  // Check if all methods are removed
                  const cardsGrid = document.querySelector('.cards-grid');
                  const bankList = document.querySelector('.bank-list');
                  if (cardsGrid && cardsGrid.children.length === 0) {
                    cardsGrid.closest('.methods-section').remove();
                  }
                  if (bankList && bankList.children.length === 0) {
                    bankList.closest('.methods-section').remove();
                  }
                  // Show empty state if no methods left
                  const methodsSections = document.querySelectorAll('.methods-section');
                  if (methodsSections.length === 0) {
                    window.location.reload();
                  }
                }, 300);
              }
            } else {
              showToast(data.message || 'Failed to remove');
            }
          } catch (err) {
            console.error(err);
            showToast('Something went wrong');
          }
        }
      );
    });
  });

  // Disconnect wallet
  disconnectBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const walletId = btn.dataset.id;
      const walletName = btn.dataset.name;

      showModal(
        'Disconnect Wallet',
        `Are you sure you want to disconnect ${walletName}?`,
        async () => {
          try {
            const res = await fetch('/payment-methods/disconnect-wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletId }),
            });

            const data = await res.json();

            if (data.success) {
              showToast('Wallet disconnected', 'success');
              // Update UI
              const walletItem = document.querySelector(`[data-id="${walletId}"]`);
              if (walletItem) {
                walletItem.setAttribute('data-connected', 'false');
                const statusEl = walletItem.querySelector('.connection-status');
                if (statusEl) {
                  statusEl.className = 'connection-status disconnected';
                  statusEl.innerHTML = '<i class="fas fa-circle"></i> Not Connected';
                }
                const actionBtn = walletItem.querySelector('.btn');
                if (actionBtn) {
                  actionBtn.className = 'btn btn-secondary btn-sm';
                  actionBtn.innerHTML = '<i class="fas fa-link"></i> Connect';
                }
              }
            } else {
              showToast(data.message || 'Failed to disconnect');
            }
          } catch (err) {
            console.error(err);
            showToast('Something went wrong');
          }
        }
      );
    });
  });

  // Add method button (placeholder)
  if (addMethodBtn) {
    addMethodBtn.addEventListener('click', () => {
      showToast('Add payment method feature coming soon');
    });
  }

  if (addFirstMethodBtn) {
    addFirstMethodBtn.addEventListener('click', () => {
      showToast('Add payment method feature coming soon');
    });
  }

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      hideModal();
    }
  });
})();

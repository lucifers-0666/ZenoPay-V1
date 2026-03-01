/* ============================================
   ZENOPAY ADMIN — GLOBAL MODAL CONTROLLER
   Works for ALL modals across all admin pages
   ============================================ */

(function () {
  function closeLightbox() {
    const existing = document.querySelector('.doc-lightbox');
    if (!existing) return;
    existing.remove();
    document.body.style.overflow = '';
  }

  function getOpenModal() {
    const overlays = Array.from(document.querySelectorAll('.modal-overlay, .modal'));
    return overlays.find((modal) => {
      const display = window.getComputedStyle(modal).display;
      return display !== 'none';
    }) || null;
  }

  function resetModal(modal) {
    if (!modal) return;

    modal.querySelectorAll('form').forEach((form) => form.reset());

    modal.querySelectorAll('[type="submit"]').forEach((btn) => {
      btn.disabled = false;
      const original = btn.getAttribute('data-original-text');
      if (original) btn.innerHTML = original;
    });
  }

  window.AdminModal = {
    open: function (modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.removeAttribute('hidden');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      const card = modal.querySelector('.modal-card');
      if (card) {
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'fadeInUp 0.25s ease-out';
      }
    },

    close: function (modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.style.display = 'none';
      modal.setAttribute('hidden', 'hidden');
      document.body.style.overflow = '';

      resetModal(modal);
    },

    closeAll: function () {
      document.querySelectorAll('.modal-overlay, .modal').forEach((modal) => {
        modal.style.display = 'none';
        modal.setAttribute('hidden', 'hidden');
      });
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (event) {
      const lightboxTrigger = event.target.closest('[data-lightbox]');
      if (lightboxTrigger) {
        const src = lightboxTrigger.getAttribute('data-lightbox');
        if (!src) return;

        closeLightbox();

        const lightbox = document.createElement('div');
        lightbox.className = 'doc-lightbox';
        lightbox.innerHTML = `
          <img src="${src}" alt="Document">
          <button type="button" class="doc-lightbox-close" id="closeLightbox">
            <i class="fas fa-times"></i>
          </button>
        `;

        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        lightbox.addEventListener('click', function (ev) {
          if (ev.target === lightbox || ev.target.closest('#closeLightbox')) {
            closeLightbox();
          }
        });

        return;
      }

      const closeTrigger = event.target.closest('[data-close-modal]');
      if (closeTrigger) {
        window.AdminModal.close(closeTrigger.getAttribute('data-close-modal'));
        return;
      }

      const openTrigger = event.target.closest('[data-open-modal]');
      if (openTrigger) {
        window.AdminModal.open(openTrigger.getAttribute('data-open-modal'));
      }
    });

    document.querySelectorAll('.modal-overlay, .modal').forEach((overlay) => {
      if (!overlay.style.display) {
        const computed = window.getComputedStyle(overlay).display;
        if (computed !== 'none') {
          overlay.style.display = 'none';
        }
      }

      overlay.addEventListener('click', function (e) {
        if (e.target === this) {
          window.AdminModal.close(this.id);
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const openLightbox = document.querySelector('.doc-lightbox');
        if (openLightbox) {
          closeLightbox();
          return;
        }

        const openModal = getOpenModal();
        if (openModal) window.AdminModal.close(openModal.id);
      }
    });

    document.querySelectorAll('.modal-card [type="submit"]').forEach((btn) => {
      btn.setAttribute('data-original-text', btn.innerHTML);
    });
  });
})();

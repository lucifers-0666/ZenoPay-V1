/**
 * ZenoPay Admin — Global Date Range Guard
 * Applies to ALL date inputs with class .date-from/.date-to,
 * plus common fallback selectors by name/id.
 */
(function initDateGuards() {
  const processedPairs = new WeakMap();

  function getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const TODAY = getTodayStr();

  function parseDateInputValue(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  function fmtYmd(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMessageContainer(input) {
    return input.closest('.ft-filter-date-wrap') ||
      input.closest('label') ||
      input.parentElement ||
      input;
  }

  function showDateError(input, message) {
    const container = getMessageContainer(input);
    if (!container) return;

    const existing = container.querySelector('.date-error-msg');
    if (existing) existing.remove();

    const msg = document.createElement('span');
    msg.className = 'date-error-msg';
    msg.textContent = message;
    msg.style.cssText = [
      'display:block',
      'font-size:0.72rem',
      'color:#DC2626',
      'font-weight:600',
      'margin-top:4px'
    ].join(';');

    container.appendChild(msg);
    window.setTimeout(() => {
      if (msg && msg.parentElement) msg.remove();
    }, 3000);
  }

  function clampFuture(input) {
    if (!input || !input.value) return;
    if (input.value > TODAY) {
      input.value = TODAY;
      showDateError(input, 'Future dates are not allowed. Reset to today.');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setupPair(fromInput, toInput) {
    if (!fromInput || !toInput) return;

    const existing = processedPairs.get(fromInput);
    if (existing && existing === toInput) {
      fromInput.max = toInput.value || TODAY;
      toInput.max = TODAY;
      toInput.min = fromInput.value || '';
      return;
    }

    processedPairs.set(fromInput, toInput);

    fromInput.max = toInput.value || TODAY;
    toInput.max = TODAY;

    if (fromInput.value) toInput.min = fromInput.value;

    fromInput.addEventListener('change', function () {
      clampFuture(fromInput);
      const fromVal = fromInput.value;
      const toVal = toInput.value;

      toInput.min = fromVal || '';
      toInput.max = TODAY;

      if (toVal && fromVal && toVal < fromVal) {
        toInput.value = '';
        showDateError(toInput, '"To" date cleared — it was before "From" date.');
      }

      fromInput.max = toInput.value || TODAY;
    });

    toInput.addEventListener('change', function () {
      clampFuture(toInput);
      const toVal = toInput.value;
      const fromVal = fromInput.value;

      fromInput.max = toVal || TODAY;
      toInput.max = TODAY;

      if (fromVal && toVal && fromVal > toVal) {
        fromInput.value = '';
        showDateError(fromInput, '"From" date cleared — it was after "To" date.');
      }

      toInput.min = fromInput.value || '';
    });

    [fromInput, toInput].forEach((input) => {
      input.addEventListener('blur', function () {
        clampFuture(input);
      });
    });

    if (fromInput.value && toInput.value && fromInput.value > toInput.value) {
      toInput.value = '';
      showDateError(toInput, '"To" date cleared — it was before "From" date.');
    }
  }

  function setupDataAttributePairs() {
    const pairNames = new Set();
    document.querySelectorAll('[data-date-pair]').forEach((el) => {
      if (el.dataset && el.dataset.datePair) pairNames.add(el.dataset.datePair);
    });

    pairNames.forEach((pairName) => {
      const fromInput = document.querySelector(`[data-date-pair="${pairName}"][data-date-role="from"]`);
      const toInput = document.querySelector(`[data-date-pair="${pairName}"][data-date-role="to"]`);
      if (fromInput && toInput) setupPair(fromInput, toInput);
    });
  }

  function setupContainerPairs() {
    const containers = document.querySelectorAll(
      '.ft-filter-form, .filter-form, .date-filter-group, form'
    );

    containers.forEach((container) => {
      const fromInput = container.querySelector(
        '.date-from, [name="dateFrom"], [name="date_from"], #dateFrom, #fromDate, #filterDateFrom, #kycFromDate, #startDate'
      );
      const toInput = container.querySelector(
        '.date-to, [name="dateTo"], [name="date_to"], #dateTo, #toDate, #filterDateTo, #kycToDate, #endDate'
      );

      if (fromInput && toInput) setupPair(fromInput, toInput);
    });
  }

  function enforceAllDateMaxToday() {
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      if (!input.max || input.max > TODAY) {
        input.max = TODAY;
      }

      const parsed = parseDateInputValue(input.value);
      if (parsed && fmtYmd(parsed) > TODAY) {
        input.value = TODAY;
      }
    });
  }

  function setupAllDatePairs() {
    enforceAllDateMaxToday();
    setupDataAttributePairs();
    setupContainerPairs();
  }

  function setDatePreset(preset, contextForm) {
    const activeForm = contextForm || document.querySelector('.ft-filter-form, .filter-form, form');
    if (!activeForm) return;

    const fromInput = activeForm.querySelector(
      '.date-from, [name="dateFrom"], [name="date_from"], #dateFrom, #fromDate, #filterDateFrom, #kycFromDate, #startDate'
    );
    const toInput = activeForm.querySelector(
      '.date-to, [name="dateTo"], [name="date_to"], #dateTo, #toDate, #filterDateTo, #kycToDate, #endDate'
    );

    if (!fromInput || !toInput) return;

    const today = new Date();
    const fmt = (d) => fmtYmd(d);

    switch (preset) {
      case 'today': {
        const v = fmt(today);
        fromInput.value = v;
        toInput.value = v;
        break;
      }
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        const v = fmt(y);
        fromInput.value = v;
        toInput.value = v;
        break;
      }
      case '7days': {
        const w = new Date(today);
        w.setDate(today.getDate() - 6);
        fromInput.value = fmt(w);
        toInput.value = fmt(today);
        break;
      }
      case 'month': {
        const m = new Date(today.getFullYear(), today.getMonth(), 1);
        fromInput.value = fmt(m);
        toInput.value = fmt(today);
        break;
      }
      default:
        return;
    }

    fromInput.dispatchEvent(new Event('change', { bubbles: true }));
    toInput.dispatchEvent(new Event('change', { bubbles: true }));

    if (typeof activeForm.requestSubmit === 'function') {
      activeForm.requestSubmit();
    } else {
      activeForm.submit();
    }
  }

  window.AdminDateGuards = {
    refresh: setupAllDatePairs,
    setDatePreset,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAllDatePairs);
  } else {
    setupAllDatePairs();
  }

  const observer = new MutationObserver((mutations) => {
    let shouldRefresh = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (shouldRefresh) return;
        if (node && node.nodeType === 1) {
          const element = node;
          if ((element.matches && element.matches('input[type="date"]')) ||
              (element.querySelector && element.querySelector('input[type="date"]'))) {
            shouldRefresh = true;
          }
        }
      });
    });

    if (shouldRefresh) setupAllDatePairs();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

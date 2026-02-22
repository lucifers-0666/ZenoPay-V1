(() => {
  const statsTotalEl = document.getElementById("statsTotalCount");
  const statsFavouriteEl = document.getElementById("statsFavouriteCount");
  const statsTransfersMonthEl = document.getElementById("statsTransfersMonthCount");
  const statsRecentAddedEl = document.getElementById("statsRecentAddedCount");

  const searchInput = document.getElementById("beneficiarySearchInput");
  const sortSelect = document.getElementById("beneficiarySort");
  const filterTabs = Array.from(document.querySelectorAll(".beneficiary-filter-tab"));
  const noResults = document.getElementById("beneficiaryNoResults");

  let activeFilter = "all";

  function getAllCards() {
    return Array.from(document.querySelectorAll(".beneficiary-card"));
  }

  function parseDateLabel(dateLabel) {
    const parsed = new Date(dateLabel);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function matchesFilter(card) {
    if (activeFilter === "all") return true;
    if (activeFilter === "favourite") return card.dataset.favourite === "true";
    return card.dataset.type === activeFilter;
  }

  function matchesSearch(card, query) {
    if (!query) return true;
    const haystack = [card.dataset.name, card.dataset.bank, card.dataset.account, card.dataset.upi]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function applyVisibility() {
    const cards = getAllCards();
    const query = (searchInput?.value || "").trim().toLowerCase();
    let shownCount = 0;

    cards.forEach((card) => {
      const visible = matchesFilter(card) && matchesSearch(card, query);
      card.classList.toggle("hidden", !visible);
      if (visible) shownCount += 1;
    });

    if (noResults) {
      noResults.classList.toggle("hidden", shownCount > 0);
    }
  }

  function sortCards() {
    const grid = document.getElementById("beneficiaryGrid");
    const cards = getAllCards();
    if (!grid || cards.length === 0) return;

    const selected = sortSelect?.value || "az";
    const sortedCards = [...cards].sort((a, b) => {
      const nameA = a.dataset.name || "";
      const nameB = b.dataset.name || "";
      const countA = Number(a.dataset.transferCount || 0);
      const countB = Number(b.dataset.transferCount || 0);
      const recentA = parseDateLabel(a.dataset.lastTransfer || "");
      const recentB = parseDateLabel(b.dataset.lastTransfer || "");

      if (selected === "za") return nameB.localeCompare(nameA);
      if (selected === "recent") return recentB - recentA;
      if (selected === "most-used") return countB - countA;
      return nameA.localeCompare(nameB);
    });

    sortedCards.forEach((card) => grid.appendChild(card));
  }

  function isCurrentMonth(dateLabel) {
    const parsed = new Date(dateLabel);
    if (Number.isNaN(parsed.getTime())) return false;

    const now = new Date();
    return (
      parsed.getMonth() === now.getMonth() &&
      parsed.getFullYear() === now.getFullYear()
    );
  }

  function updateStatsFromCards() {
    const cards = getAllCards();
    const total = cards.length;

    const favourites = cards.filter(
      (card) => card.dataset.favourite === "true"
    ).length;

    const transfersThisMonth = cards.reduce((sum, card) => {
      const explicit = Number(card.dataset.transfersThisMonth || "");
      if (Number.isFinite(explicit) && explicit > 0) {
        return sum + explicit;
      }
      return isCurrentMonth(card.dataset.lastTransfer) ? sum + 1 : sum;
    }, 0);

    const recentlyAdded = cards.filter((card) =>
      isCurrentMonth(card.dataset.addedAt)
    ).length;

    if (statsTotalEl) statsTotalEl.textContent = String(total);
    if (statsFavouriteEl) statsFavouriteEl.textContent = String(favourites);
    if (statsTransfersMonthEl) {
      statsTransfersMonthEl.textContent = String(transfersThisMonth);
    }
    if (statsRecentAddedEl) statsRecentAddedEl.textContent = String(recentlyAdded);
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");
      activeFilter = tab.dataset.filter || "all";
      applyVisibility();
    });
  });

  searchInput?.addEventListener("input", applyVisibility);

  sortSelect?.addEventListener("change", () => {
    sortCards();
    applyVisibility();
  });

  document.addEventListener("click", (event) => {
    const favouriteBtn = event.target.closest(".favourite-toggle");
    if (favouriteBtn) {
      favouriteBtn.classList.toggle("active");
      const card = favouriteBtn.closest(".beneficiary-card");
      if (card) {
        card.dataset.favourite = favouriteBtn.classList.contains("active")
          ? "true"
          : "false";
      }
      applyVisibility();
      updateStatsFromCards();
      return;
    }

    const moreBtn = event.target.closest(".beneficiary-more-btn");
    if (moreBtn) {
      event.stopPropagation();
      const container = moreBtn.closest(".beneficiary-more-wrap");
      document.querySelectorAll(".beneficiary-more-wrap.open").forEach((wrap) => {
        if (wrap !== container) wrap.classList.remove("open");
      });
      container?.classList.toggle("open");
      return;
    }

    const menuItem = event.target.closest(".beneficiary-more-menu button");
    if (menuItem) {
      const action = menuItem.textContent.trim().toLowerCase();
      const card = menuItem.closest(".beneficiary-card");
      const wrap = menuItem.closest(".beneficiary-more-wrap");
      wrap?.classList.remove("open");

      if (action.includes("delete") && card) {
        card.remove();
        applyVisibility();
        updateStatsFromCards();
      }
      return;
    }

    document
      .querySelectorAll(".beneficiary-more-wrap.open")
      .forEach((wrap) => wrap.classList.remove("open"));
  });

  const modalOverlay = document.getElementById("beneficiaryModalOverlay");
  const openButtons = [
    document.getElementById("openBeneficiaryModalBtn"),
    document.getElementById("openBeneficiaryModalEmptyBtn"),
  ].filter(Boolean);
  const closeButton = document.getElementById("closeBeneficiaryModalBtn");
  const cancelButton = document.getElementById("cancelBeneficiaryModalBtn");
  const modalTabs = Array.from(document.querySelectorAll(".beneficiary-modal-tab"));
  const saveButton = document.getElementById("saveBeneficiaryBtn");
  const tabPanels = {
    bank: document.getElementById("beneficiaryBankTab"),
    upi: document.getElementById("beneficiaryUpiTab"),
    mobile: document.getElementById("beneficiaryMobileTab"),
  };

  function openModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.add("open");
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("open");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function switchModalTab(tabKey) {
    modalTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabKey);
    });

    Object.entries(tabPanels).forEach(([key, panel]) => {
      panel?.classList.toggle("active", key === tabKey);
    });
  }

  function getInitials(name) {
    return String(name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "NA";
  }

  function maskAccount(rawValue) {
    const digits = String(rawValue || "").replace(/\D/g, "");
    if (!digits) return "XXXXXX0000";
    return `XXXXXX${digits.slice(-4).padStart(4, "0")}`;
  }

  function formatDateLabel(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function buildCardHtml(payload) {
    const encodedName = (payload.name || "").toLowerCase();
    const encodedBank = (payload.bankName || "").toLowerCase();
    const encodedAccount = (payload.accountMasked || "").toLowerCase();
    const encodedUpi = (payload.upiOrType || "").toLowerCase();

    const card = document.createElement("article");
    card.className = "beneficiary-card";
    card.dataset.name = encodedName;
    card.dataset.bank = encodedBank;
    card.dataset.account = encodedAccount;
    card.dataset.upi = encodedUpi;
    card.dataset.type = payload.typeKey;
    card.dataset.favourite = "false";
    card.dataset.lastTransfer = payload.lastTransfer;
    card.dataset.addedAt = payload.addedAt;
    card.dataset.transferCount = "0";

    card.innerHTML = `
      <button class="favourite-toggle" type="button" title="Toggle favourite" aria-label="Toggle favourite">
        <i class="fas fa-star"></i>
      </button>

      <div class="beneficiary-avatar-wrap">
        <div class="beneficiary-avatar">${payload.initials}</div>
        <span class="beneficiary-bank-badge" aria-hidden="true">
          <i class="fas fa-university"></i>
        </span>
      </div>

      <h3>${payload.name}</h3>
      <p class="beneficiary-bank-line">
        <span>${payload.bankName}</span>
        <code>${payload.accountMasked}</code>
      </p>
      <span class="beneficiary-type-badge">${payload.transferType}</span>
      <div class="beneficiary-history">
        <i class="fas fa-history"></i>
        Last transfer: ${payload.lastTransfer}
      </div>

      <div class="beneficiary-divider"></div>

      <div class="beneficiary-card-actions">
        <button class="send-money-btn" type="button">
          <i class="fas fa-paper-plane"></i>
          Send Money
        </button>

        <div class="beneficiary-more-wrap">
          <button class="beneficiary-more-btn" type="button" aria-label="More options">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="beneficiary-more-menu" role="menu">
            <button type="button" role="menuitem"><i class="fas fa-pen"></i> Edit</button>
            <button type="button" role="menuitem"><i class="fas fa-trash"></i> Delete</button>
            <button type="button" role="menuitem"><i class="fas fa-clock-rotate-left"></i> View History</button>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  openButtons.forEach((btn) => btn.addEventListener("click", openModal));
  closeButton?.addEventListener("click", closeModal);
  cancelButton?.addEventListener("click", closeModal);

  modalOverlay?.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchModalTab(tab.dataset.tab || "bank"));
  });

  saveButton?.addEventListener("click", () => {
    const grid = document.getElementById("beneficiaryGrid");
    if (!grid) {
      closeModal();
      return;
    }

    const activeTab = modalTabs.find((tab) => tab.classList.contains("active"))?.dataset.tab || "bank";
    const now = new Date();
    const addedAt = formatDateLabel(now);

    let name = "New Beneficiary";
    let bankName = "ZenoPay Network";
    let accountMasked = "XXXXXX0000";
    let upiOrType = "";
    let transferType = "Bank Transfer";
    let typeKey = "bank";

    if (activeTab === "bank") {
      name = (document.getElementById("holderName")?.value || "").trim() || name;
      bankName = document.getElementById("bankName")?.value || bankName;
      accountMasked = maskAccount(document.getElementById("accountNumber")?.value);
      transferType = "Bank Transfer";
      typeKey = "bank";
    }

    if (activeTab === "upi") {
      const upi = (document.getElementById("upiId")?.value || "").trim();
      name = (document.getElementById("upiNickname")?.value || "").trim() || upi.split("@")[0] || name;
      bankName = "UPI";
      accountMasked = "XXXXXX0000";
      upiOrType = upi;
      transferType = "UPI";
      typeKey = "upi";
    }

    if (activeTab === "mobile") {
      const mobile = (document.getElementById("mobileNumber")?.value || "").trim();
      name = (document.getElementById("registeredName")?.value || "").trim() || name;
      bankName = "Mobile Transfer";
      accountMasked = "XXXXXX0000";
      upiOrType = mobile;
      transferType = "Mobile Number";
      typeKey = "mobile";
    }

    const newCard = buildCardHtml({
      name,
      initials: getInitials(name),
      bankName,
      accountMasked,
      upiOrType,
      transferType,
      typeKey,
      lastTransfer: "No transfers yet",
      addedAt,
    });

    grid.prepend(newCard);
    sortCards();
    applyVisibility();
    updateStatsFromCards();
    closeModal();
  });

  sortCards();
  applyVisibility();
  updateStatsFromCards();
})();

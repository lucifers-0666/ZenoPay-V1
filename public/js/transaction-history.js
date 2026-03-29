// Transaction History Module (dynamic)
(() => {
  let currentTransaction = null;

  const safeParseJson = (value, fallback = []) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error("[TransactionHistory] Failed to parse JSON payload:", error);
      return fallback;
    }
  };

  const payloadEl = document.getElementById("transactionHistoryData");
  const initialRows = safeParseJson(payloadEl?.textContent || "[]", []);

  const state = {
    allRows: Array.isArray(initialRows) ? initialRows : [],
    filteredRows: [],
    timeFilter: "all",
  };

  const refs = {
    type: document.getElementById("transactionType"),
    status: document.getElementById("status"),
    paymentMethod: document.getElementById("paymentMethod"),
    dateFrom: document.getElementById("dateFrom"),
    searchInput: document.getElementById("searchInput"),
    tableBody: document.getElementById("transactionsTableBody"),
    mobileCards: document.getElementById("transactionsMobileCards"),
    tableWrapper: document.querySelector(".transactions-table-wrapper"),
    summaryTotalTransactions: document.getElementById("summaryTotalTransactions"),
    summaryTotalAmount: document.getElementById("summaryTotalAmount"),
    summaryMoneyIn: document.getElementById("summaryMoneyIn"),
    summaryMoneyOut: document.getElementById("summaryMoneyOut"),
    drawer: document.getElementById("transactionDrawer"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    drawerBody: document.getElementById("drawerBody"),
    timeFilterBtn: document.querySelector(".time-filter-pill"),
  };

  const normalizeMethod = (input) => {
    const method = String(input || "unknown").trim().toLowerCase();
    if (method.includes("upi")) return "upi";
    if (method.includes("card")) return "card";
    if (method.includes("bank")) return "bank";
    if (method.includes("wallet")) return "wallet";
    return "unknown";
  };

  const getTxDate = (tx) => {
    const combined = `${tx?.date || ""} ${tx?.time || ""}`.trim();
    const parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const fallback = new Date(tx?.date || "");
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };

  const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    return safeAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const txDisplayName = (tx) =>
    tx?.isCredit
      ? tx?.senderName || tx?.description || "Unknown"
      : tx?.receiverName || tx?.description || "Unknown";

  const txNote = (tx) => tx?.note || tx?.reference || "No note";

  const iconClass = (type) => {
    if (type === "credit") return "fa-arrow-down";
    if (type === "debit") return "fa-arrow-up";
    return "fa-exchange-alt";
  };

  const statusIconClass = (status) => {
    if (status === "success") return "fa-check-circle";
    if (status === "failed") return "fa-times-circle";
    return "fa-clock";
  };

  const setTimeFilterLabel = () => {
    if (!refs.timeFilterBtn) return;

    const labels = {
      all: "All Time",
      today: "Today",
      week: "Last 7 Days",
      month: "This Month",
      year: "This Year",
    };

    refs.timeFilterBtn.innerHTML = `<i class="fas fa-calendar-alt"></i> ${labels[state.timeFilter] || "This Month"} <i class="fas fa-chevron-down"></i>`;
  };

  const getActiveFilters = () => ({
    type: String(refs.type?.value || "").trim().toLowerCase(),
    status: String(refs.status?.value || "").trim().toLowerCase(),
    paymentMethod: String(refs.paymentMethod?.value || "").trim().toLowerCase(),
    dateFrom: refs.dateFrom?.value || "",
    search: String(refs.searchInput?.value || "").trim().toLowerCase(),
  });

  const applyFilters = () => {
    const filters = getActiveFilters();
    const now = new Date();

    state.filteredRows = state.allRows.filter((tx) => {
      const txType = String(tx?.type || "").toLowerCase();
      const txStatus = String(tx?.status || "pending").toLowerCase();
      const txMethod = normalizeMethod(tx?.paymentMethod);
      const txDate = getTxDate(tx);

      if (filters.type && txType !== filters.type) return false;
      if (filters.status && txStatus !== filters.status) return false;
      if (filters.paymentMethod && txMethod !== filters.paymentMethod) return false;

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (Number.isNaN(fromDate.getTime())) return false;
        if (!txDate || txDate < fromDate) return false;
      }

      if (state.timeFilter !== "all") {
        if (!txDate) return false;

        if (state.timeFilter === "today") {
          const sameDay =
            txDate.getDate() === now.getDate() &&
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear();
          if (!sameDay) return false;
        }

        if (state.timeFilter === "week") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          if (txDate < oneWeekAgo) return false;
        }

        if (state.timeFilter === "month") {
          const sameMonth = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          if (!sameMonth) return false;
        }

        if (state.timeFilter === "year") {
          if (txDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      if (filters.search) {
        const haystack = [
          tx?.transactionId,
          tx?.description,
          tx?.senderName,
          tx?.receiverName,
          tx?.reference,
          tx?.paymentMethod,
          tx?.senderAccountNumber,
          tx?.receiverAccountNumber,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");

        if (!haystack.includes(filters.search)) return false;
      }

      return true;
    });
  };

  const updateSummary = () => {
    const total = state.filteredRows.length;
    const totalAmount = state.filteredRows.reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);
    const moneyIn = state.filteredRows
      .filter((tx) => tx?.isCredit)
      .reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);
    const moneyOut = state.filteredRows
      .filter((tx) => !tx?.isCredit)
      .reduce((sum, tx) => sum + Number(tx?.amount || 0), 0);

    if (refs.summaryTotalTransactions) refs.summaryTotalTransactions.textContent = String(total);
    if (refs.summaryTotalAmount) refs.summaryTotalAmount.textContent = `₹${formatAmount(totalAmount)}`;
    if (refs.summaryMoneyIn) refs.summaryMoneyIn.textContent = `₹${formatAmount(moneyIn)}`;
    if (refs.summaryMoneyOut) refs.summaryMoneyOut.textContent = `₹${formatAmount(moneyOut)}`;
  };

  const renderTable = () => {
    if (!refs.tableBody) return;

    if (!state.filteredRows.length) {
      refs.tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 28px; color:#6B7280;">
            No transactions match your current filters.
          </td>
        </tr>
      `;
      return;
    }

    refs.tableBody.innerHTML = state.filteredRows
      .map((tx) => {
        const encoded = encodeURIComponent(JSON.stringify(tx));
        const status = String(tx?.status || "pending").toLowerCase();
        const type = String(tx?.type || "transfer").toLowerCase();

        return `
          <tr class="transaction-row" data-txn="${encoded}">
            <td class="txn-icon-cell">
              <div class="txn-icon ${type}">
                <i class="fas ${iconClass(type)}"></i>
              </div>
            </td>
            <td data-label="Date">
              <div style="font-size: 0.85rem; font-weight: 600;">
                ${escapeHtml(tx?.date || "N/A")}<br>
                <span style="color: #9CA3AF; font-size: 0.8rem;">${escapeHtml(tx?.time || "N/A")}</span>
              </div>
            </td>
            <td data-label="Description">
              <div class="txn-description">
                <div class="txn-name">${escapeHtml(txDisplayName(tx))}</div>
                <div class="txn-note">${escapeHtml(txNote(tx))}</div>
              </div>
            </td>
            <td data-label="Method" class="txn-method">${escapeHtml(tx?.paymentMethod || "Unknown")}</td>
            <td data-label="Amount" class="txn-amount ${tx?.isCredit ? "positive" : "negative"}">
              ${tx?.isCredit ? "+" : "-"}₹${formatAmount(tx?.amount)}
            </td>
            <td data-label="Status" style="text-align:center;">
              <span class="status-badge status-${status}">
                <i class="fas ${statusIconClass(status)}"></i>
                ${escapeHtml(status)}
              </span>
            </td>
            <td class="txn-actions" onclick="event.stopPropagation();">
              <button class="action-menu" data-txn="${encoded}">
                <i class="fas fa-ellipsis-v"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const renderMobileCards = () => {
    if (!refs.mobileCards) return;

    if (!state.filteredRows.length) {
      refs.mobileCards.innerHTML = `
        <div class="transaction-card-mobile" style="padding:18px; text-align:center; color:#6B7280;">
          No transactions match your current filters.
        </div>
      `;
      return;
    }

    refs.mobileCards.innerHTML = state.filteredRows
      .map((tx) => {
        const encoded = encodeURIComponent(JSON.stringify(tx));
        const type = String(tx?.type || "transfer").toLowerCase();
        const status = String(tx?.status || "pending").toLowerCase();

        return `
          <div class="transaction-card-mobile" data-txn="${encoded}">
            <div class="transaction-card-mobile-header">
              <div class="txn-icon ${type}">
                <i class="fas ${iconClass(type)}"></i>
              </div>
              <div class="transaction-card-mobile-info">
                <div class="transaction-card-mobile-name">${escapeHtml(txDisplayName(tx))}</div>
                <div class="transaction-card-mobile-date">${escapeHtml(tx?.date || "N/A")}</div>
              </div>
              <div class="transaction-card-mobile-amount">
                <div class="transaction-card-mobile-value ${tx?.isCredit ? "positive" : "negative"}">
                  ${tx?.isCredit ? "+" : "-"}₹${formatAmount(tx?.amount)}
                </div>
                <span class="transaction-card-mobile-status status-${status}">
                  ${escapeHtml(status)}
                </span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  const bindRowEvents = () => {
    document.querySelectorAll(".transaction-row[data-txn]").forEach((row) => {
      row.addEventListener("click", () => {
        const txn = parseTransactionFromElement(row);
        if (txn) viewTransactionDetails(txn);
      });
    });

    document.querySelectorAll(".transaction-card-mobile[data-txn]").forEach((card) => {
      card.addEventListener("click", () => {
        const txn = parseTransactionFromElement(card);
        if (txn) viewTransactionDetails(txn);
      });
    });

    document.querySelectorAll(".action-menu[data-txn]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const txn = parseTransactionFromElement(button);
        showActionMenu(event, txn);
      });
    });
  };

  const render = () => {
    applyFilters();
    updateSummary();
    renderTable();
    renderMobileCards();
    bindRowEvents();
  };

  const parseTransactionFromElement = (element) => {
    if (!element) return null;
    const encoded = element.getAttribute("data-txn");
    if (!encoded) return null;

    try {
      return JSON.parse(decodeURIComponent(encoded));
    } catch (error) {
      console.error("Failed to parse transaction data", error);
      return null;
    }
  };

  const viewTransactionDetails = (txn) => {
    if (!txn || !refs.drawer || !refs.drawerOverlay || !refs.drawerBody) {
      return;
    }

    currentTransaction = txn;

    const status = String(txn.status || "pending").toLowerCase();
    const type = String(txn.type || "transaction");
    const statusColor = status === "success" ? "#10B981" : status === "pending" ? "#D97706" : "#EF4444";
    const amountColor = txn.isCredit ? "#10B981" : "#EF4444";

    refs.drawerBody.innerHTML = `
      <div class="drawer-section">
        <h4>Transaction Details</h4>
        <div class="drawer-detail-row">
          <span class="drawer-label">Transaction ID</span>
          <span class="drawer-value">${escapeHtml(txn.transactionId || "N/A")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Date & Time</span>
          <span class="drawer-value">${escapeHtml(txn.date || "N/A")} ${escapeHtml(txn.time || "")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Type</span>
          <span class="drawer-value">${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Status</span>
          <span class="drawer-value" style="color: ${statusColor}">
            <i class="fas ${statusIconClass(status)}"></i>
            ${escapeHtml(status.toUpperCase())}
          </span>
        </div>
      </div>

      <div class="drawer-section">
        <h4>${txn.isCredit ? "Received From" : "Sent To"}</h4>
        <div class="drawer-detail-row">
          <span class="drawer-label">Name</span>
          <span class="drawer-value">${escapeHtml(txn.isCredit ? txn.senderName : txn.receiverName || "N/A")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Account Number</span>
          <span class="drawer-value">${escapeHtml(txn.isCredit ? txn.senderAccountNumber : txn.receiverAccountNumber || "N/A")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Bank</span>
          <span class="drawer-value">${escapeHtml(txn.isCredit ? txn.senderBank : txn.receiverBank || "N/A")}</span>
        </div>
      </div>

      <div class="drawer-section">
        <h4>Payment Details</h4>
        <div class="drawer-detail-row">
          <span class="drawer-label">Description</span>
          <span class="drawer-value">${escapeHtml(txn.description || "N/A")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Payment Method</span>
          <span class="drawer-value">${escapeHtml(txn.paymentMethod || "Unknown")}</span>
        </div>
        <div class="drawer-detail-row">
          <span class="drawer-label">Amount</span>
          <span class="drawer-value highlight" style="color: ${amountColor}">
            ${txn.isCredit ? "+" : "-"}₹${formatAmount(txn.amount)}
          </span>
        </div>
      </div>
    `;

    refs.drawer.classList.add("show");
    refs.drawerOverlay.classList.add("show");
  };

  const closeDrawer = () => {
    if (refs.drawer) refs.drawer.classList.remove("show");
    if (refs.drawerOverlay) refs.drawerOverlay.classList.remove("show");
  };

  const resetFilters = () => {
    if (refs.type) refs.type.value = "";
    if (refs.status) refs.status.value = "";
    if (refs.paymentMethod) refs.paymentMethod.value = "";
    if (refs.dateFrom) refs.dateFrom.value = "";
    if (refs.searchInput) refs.searchInput.value = "";
    state.timeFilter = "all";
    setTimeFilterLabel();
    render();
    showToast("Filters reset", "info");
  };

  const showTimeFilterOptions = () => {
    const options = [
      { key: "today", label: "Today" },
      { key: "week", label: "Last 7 Days" },
      { key: "month", label: "This Month" },
      { key: "year", label: "This Year" },
      { key: "all", label: "All Time" },
    ];

    const current = options.find((opt) => opt.key === state.timeFilter)?.label || "This Month";
    const choice = window.prompt(
      `Choose time filter:\n${options.map((opt) => `- ${opt.label}`).join("\n")}\n\nCurrent: ${current}`,
      current
    );

    if (!choice) return;

    const picked = options.find((opt) => opt.label.toLowerCase() === choice.trim().toLowerCase());
    if (!picked) {
      showToast("Invalid time filter option", "error");
      return;
    }

    state.timeFilter = picked.key;
    setTimeFilterLabel();
    render();
  };

  const exportTransactions = () => {
    const rows = state.filteredRows;
    if (!rows.length) {
      showToast("No transactions to export", "error");
      return;
    }

    const headers = [
      "Transaction ID",
      "Date",
      "Time",
      "Type",
      "Status",
      "Amount",
      "Direction",
      "Sender Name",
      "Receiver Name",
      "Payment Method",
      "Description",
      "Reference",
    ];

    const csvRows = rows.map((tx) => [
      tx.transactionId || "",
      tx.date || "",
      tx.time || "",
      tx.type || "",
      tx.status || "",
      Number(tx.amount || 0),
      tx.isCredit ? "Credit" : "Debit",
      tx.senderName || "",
      tx.receiverName || "",
      tx.paymentMethod || "",
      tx.description || "",
      tx.reference || "",
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaction-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("CSV export completed", "success");
  };

  const downloadReceipt = () => {
    if (!currentTransaction) {
      showToast("No transaction selected", "error");
      return;
    }

    const transactionRef = String(currentTransaction.transactionId || "").replace(/^TXN-/i, "").trim();
    if (!transactionRef) {
      showToast("Unable to resolve transaction", "error");
      return;
    }

    window.location.href = `/transaction/${encodeURIComponent(transactionRef)}`;
  };

  const raiseDispute = () => {
    if (!currentTransaction) {
      showToast("No transaction selected", "error");
      return;
    }

    const transactionRef = String(currentTransaction.transactionId || "").replace(/^TXN-/i, "").trim();
    window.location.href = `/disputes?transactionId=${encodeURIComponent(transactionRef)}`;
  };

  const showActionMenu = (event, txn) => {
    if (event) event.stopPropagation();

    const transactionRef = String(txn?.transactionId || "").replace(/^TXN-/i, "").trim();
    if (!transactionRef) {
      showToast("Unable to open transaction details", "error");
      return;
    }

    window.location.href = `/transaction/${encodeURIComponent(transactionRef)}`;
  };

  const showToast = (message, type = "info") => {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    console.log(`Toast [${type}]: ${message}`);
  };

  const bindFilterEvents = () => {
    [refs.type, refs.status, refs.paymentMethod, refs.dateFrom].forEach((node) => {
      if (!node) return;
      node.addEventListener("change", render);
    });

    if (refs.searchInput) {
      refs.searchInput.addEventListener("input", render);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindFilterEvents();

    if (refs.drawerOverlay) {
      refs.drawerOverlay.addEventListener("click", closeDrawer);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });

    setTimeFilterLabel();
    render();
  });

  window.searchTransactions = render;
  window.resetFilters = resetFilters;
  window.showTimeFilterOptions = showTimeFilterOptions;
  window.exportTransactions = exportTransactions;
  window.closeDrawer = closeDrawer;
  window.downloadReceipt = downloadReceipt;
  window.raiseDispute = raiseDispute;
  window.showActionMenu = showActionMenu;
})();

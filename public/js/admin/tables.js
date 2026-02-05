/**
 * Tables and Data Management
 * Handle DataTables, sorting, filtering, pagination
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeTables();
});

function initializeTables() {
  const tables = document.querySelectorAll('.table');
  
  tables.forEach(table => {
    // TODO: Initialize DataTables if available
    // For now, add basic sorting functionality
    addTableSorting(table);
  });
}

/**
 * Add sorting to table
 */
function addTableSorting(table) {
  const headers = table.querySelectorAll('th');
  
  headers.forEach((header, index) => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function() {
      sortTable(table, index);
    });
  });
}

/**
 * Sort table by column
 */
function sortTable(table, columnIndex) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();
    
    // Try numeric sort first
    if (!isNaN(aValue) && !isNaN(bValue)) {
      return parseFloat(aValue) - parseFloat(bValue);
    }
    
    // Fall back to string sort
    return aValue.localeCompare(bValue);
  });
  
  rows.forEach(row => tbody.appendChild(row));
}

/**
 * Filter table by search term
 */
function filterTable(tableId, searchTerm) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tbody tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

/**
 * Paginate table
 */
function paginateTable(tableId, pageSize = 10) {
  // TODO: Implement pagination
  console.log('Paginating table:', tableId, 'with page size:', pageSize);
}

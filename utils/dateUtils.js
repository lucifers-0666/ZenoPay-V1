/**
 * Validates and sanitizes date range input.
 * - Clamps future dates to today
 * - Swaps range when from > to
 * - Returns both YYYY-MM-DD strings and Date objects
 */
function sanitizeDateRange(rawDateFrom, rawDateTo) {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const parse = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  let from = parse(rawDateFrom);
  let to = parse(rawDateTo);

  const todayStart = new Date(todayEnd);
  todayStart.setHours(0, 0, 0, 0);

  if (from && from > todayStart) {
    from = new Date(todayStart);
  }

  if (to && to > todayStart) {
    to = new Date(todayStart);
  }

  if (from && to && from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  const fmt = (d) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toDateEnd = to
    ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
    : null;

  return {
    dateFrom: fmt(from),
    dateTo: fmt(to),
    fromDate: from,
    toDate: to,
    toDateEnd,
  };
}

module.exports = {
  sanitizeDateRange,
};

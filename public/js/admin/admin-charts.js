(function () {
  function initCharts() {
    // Dashboard-only chart setup
    const txCanvas = document.getElementById('transactionVolumeChart');
    const userCanvas = document.getElementById('userGrowthChart');

    if (!txCanvas && !userCanvas) return;
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not found. admin-charts.js skipped.');
      return;
    }

    const labelsMap = {
      '7d': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      '30d': ['W1', 'W2', 'W3', 'W4'],
      '90d': ['M1', 'M2', 'M3']
    };

    const txMap = {
      '7d': [120, 190, 150, 220, 180, 240, 200],
      '30d': [160, 185, 210, 235],
      '90d': [170, 205, 230]
    };

    const txCtx = txCanvas ? txCanvas.getContext('2d') : null;
    const userCtx = userCanvas ? userCanvas.getContext('2d') : null;

    let txChart = null;
    let userChart = null;

    if (txCtx) {
      txChart = new Chart(txCtx, {
        type: 'line',
        data: {
          labels: labelsMap['7d'],
          datasets: [{
            label: 'Transactions',
            data: txMap['7d'],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#1F2937',
              bodyColor: '#6B7280',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } },
              beginAtZero: true
            }
          }
        }
      });
    }

    if (userCtx) {
      userChart = new Chart(userCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'New Users',
            data: [45, 72, 38, 91, 65, 110, 83],
            backgroundColor: 'rgba(139,92,246,0.85)',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#1F2937',
              bodyColor: '#6B7280',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } },
              beginAtZero: true
            }
          }
        }
      });
    }

    window.updateTxChartPeriod = function (period) {
      if (!txChart || !labelsMap[period] || !txMap[period]) return;

      txChart.data.labels = labelsMap[period];
      txChart.data.datasets[0].data = txMap[period];
      txChart.update();
    };

    document.querySelectorAll('.chart-period-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-period-tab').forEach((tab) => tab.classList.remove('active'));
        btn.classList.add('active');
        const period = btn.dataset.period;
        if (period) window.updateTxChartPeriod(period);
      });
    });

    // Animate count numbers on dashboard
    const counters = document.querySelectorAll('.stat-value[data-count]');
    counters.forEach((el) => {
      const target = Number(el.dataset.count || '0');
      let current = 0;
      const duration = 1000;
      const start = performance.now();

      function animate(ts) {
        const progress = Math.min((ts - start) / duration, 1);
        current = Math.floor(target * progress);
        el.textContent = current.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  if (typeof Chart !== 'undefined') {
    initCharts();
    return;
  }

  const chartScript = document.createElement('script');
  chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
  chartScript.async = true;
  chartScript.onload = initCharts;
  document.head.appendChild(chartScript);
})();

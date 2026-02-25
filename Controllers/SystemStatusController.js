const formatLastCheckedIST = () => {
  const now = new Date();
  const datePart = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(now);

  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(now);

  return `${datePart} at ${timePart} IST`;
};

const buildUptimeBars = (state = 'operational') => {
  const totalBars = 48;
  const bars = [];

  for (let i = 0; i < totalBars; i++) {
    let value = 'green';

    if (state === 'degraded' && i % 17 === 0) {
      value = 'yellow';
    }

    if (state === 'outage' && (i % 13 === 0 || i > totalBars - 4)) {
      value = 'red';
    }

    if (state === 'maintenance' && i > totalBars - 8) {
      value = 'gray';
    }

    bars.push(value);
  }

  return bars;
};

const getSystemStatusPage = (req, res) => {
  try {
    const mode = String(req.query.status || 'all').toLowerCase();

    const statusMap = {
      all: {
        key: 'all',
        icon: 'fa-check-circle',
        title: 'All Systems Operational',
        titleColor: '#059669',
        ring: false,
        iconClass: 'ok',
      },
      partial: {
        key: 'partial',
        icon: 'fa-exclamation-circle',
        title: 'Partial System Degradation',
        titleColor: '#D97706',
        ring: true,
        iconClass: 'partial',
      },
      major: {
        key: 'major',
        icon: 'fa-times-circle',
        title: 'Major Service Outage',
        titleColor: '#DC2626',
        ring: true,
        iconClass: 'major',
      },
      maintenance: {
        key: 'maintenance',
        icon: 'fa-tools',
        title: 'Maintenance in Progress',
        titleColor: '#2563EB',
        ring: true,
        iconClass: 'maintenance',
      },
    };

    const hero = statusMap[mode] || statusMap.all;

    const services = [
      { icon: 'fa-server', name: 'Core Payment API', status: 'operational', responseMs: 122 },
      { icon: 'fa-exchange-alt', name: 'Transaction Processing', status: mode === 'major' ? 'outage' : mode === 'partial' ? 'degraded' : 'operational', responseMs: mode === 'major' ? 0 : mode === 'partial' ? 310 : 142 },
      { icon: 'fa-university', name: 'Bank Connectivity', status: mode === 'major' ? 'degraded' : 'operational', responseMs: mode === 'major' ? 420 : 168 },
      { icon: 'fa-mobile-alt', name: 'UPI Gateway', status: mode === 'maintenance' ? 'maintenance' : 'operational', responseMs: mode === 'maintenance' ? 0 : 156 },
      { icon: 'fa-user-shield', name: 'Authentication Service', status: 'operational', responseMs: 88 },
      { icon: 'fa-bell', name: 'Notification Service', status: mode === 'partial' ? 'degraded' : 'operational', responseMs: mode === 'partial' ? 228 : 96 },
      { icon: 'fa-chart-bar', name: 'Analytics & Reporting', status: mode === 'maintenance' ? 'maintenance' : 'operational', responseMs: mode === 'maintenance' ? 0 : 179 },
      { icon: 'fa-envelope', name: 'Email Delivery', status: mode === 'partial' ? 'degraded' : 'operational', responseMs: mode === 'partial' ? 260 : 118 },
      { icon: 'fa-headset', name: 'Customer Support Portal', status: mode === 'major' ? 'outage' : 'operational', responseMs: mode === 'major' ? 0 : 132 },
    ].map((service) => ({
      ...service,
      uptimeBars: buildUptimeBars(service.status),
    }));

    const incidents = [
      {
        status: 'resolved',
        title: 'UPI gateway latency spike in South region',
        description: 'Users experienced delayed confirmation messages for UPI collect requests.',
        duration: 'Duration: 23 minutes',
        date: 'Feb 20, 2026',
      },
      {
        status: 'monitoring',
        title: 'Email delivery queue recovered after SMTP throttling',
        description: 'Outbound transactional emails were delayed for a subset of users.',
        duration: 'Duration: 41 minutes',
        date: 'Feb 18, 2026',
      },
      {
        status: 'investigating',
        title: 'Intermittent dashboard chart loading issue',
        description: 'Our team is investigating occasional timeout errors in analytics widgets.',
        duration: 'Duration: Ongoing',
        date: 'Feb 22, 2026',
      },
    ];

    res.render('system-status', {
      pageTitle: 'System Status - ZenoPay',
      mode: 'status',
      hero,
      services,
      incidents,
      uptime90Days: '99.97% uptime last 90 days',
      lastCheckedText: formatLastCheckedIST(),
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
    });
  } catch (error) {
    console.error('Error rendering system status page:', error);
    res.status(500).send('Error loading system status page');
  }
};

const getMaintenancePage = (req, res) => {
  try {
    const targetDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // Default 2 hours from now
    const etaDate = new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(targetDate).replace(',', ' at') + ' IST';

    res.render('maintenance', {
      pageTitle: 'Scheduled Maintenance - ZenoPay',
      etaDate,
      lastUpdate: '1 hour ago',
      targetDate: targetDate.toISOString(),
    });
  } catch (error) {
    console.error('Error rendering maintenance page:', error);
    res.status(500).send('Error loading maintenance page');
  }
};

module.exports = {
  getSystemStatusPage,
  getMaintenancePage,
};

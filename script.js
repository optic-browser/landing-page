const revealItems = Array.from(document.querySelectorAll('.reveal'));

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  },
  {
    threshold: 0.14,
    rootMargin: '0px 0px -5% 0px'
  }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 80, 420)}ms`;
  observer.observe(item);
});

const el = {
  ip: document.getElementById('sig-ip'),
  platform: document.getElementById('sig-platform'),
  ua: document.getElementById('sig-ua'),
  gpu: document.getElementById('sig-gpu'),
  screen: document.getElementById('sig-screen'),
  locale: document.getElementById('sig-locale'),
  hardware: document.getElementById('sig-hardware'),
  cookie: document.getElementById('sig-cookie'),
  storage: document.getElementById('sig-storage'),
  referrer: document.getElementById('sig-referrer'),
  network: document.getElementById('sig-network'),
  devices: document.getElementById('sig-devices'),
  history: document.getElementById('sig-history'),
  dnt: document.getElementById('sig-dnt')
};

const opticEl = {
  ip: document.getElementById('optic-ip'),
  platform: document.getElementById('optic-platform'),
  ua: document.getElementById('optic-ua'),
  gpu: document.getElementById('optic-gpu'),
  screen: document.getElementById('optic-screen'),
  locale: document.getElementById('optic-locale'),
  hardware: document.getElementById('optic-hardware'),
  cookie: document.getElementById('optic-cookie'),
  storage: document.getElementById('optic-storage'),
  referrer: document.getElementById('optic-referrer'),
  network: document.getElementById('optic-network'),
  devices: document.getElementById('optic-devices'),
  history: document.getElementById('optic-history'),
  dnt: document.getElementById('optic-dnt')
};

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const storyLinks = Array.from(document.querySelectorAll('.story-link'));

function setActiveStoryLink(targetId) {
  storyLinks.forEach((link) => {
    const linkTarget = link.getAttribute('href')?.slice(1);
    link.classList.toggle('is-current', linkTarget === targetId);
  });
}

function readGpuRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'Unavailable';

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'Generic WebGL profile';

    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Generic WebGL profile';
  } catch {
    return 'Unavailable';
  }
}

function shortUA(value) {
  if (!value) return 'Unknown';
  return value.length > 68 ? `${value.slice(0, 68)}...` : value;
}

function safeValue(value, fallback = 'Unknown') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function maskIp(ip) {
  if (!ip || ip === 'Unavailable') return 'Masked route active';

  if (ip.includes(':')) {
    const chunks = ip.split(':').filter(Boolean);
    return `${chunks.slice(0, 2).join(':')}:****:****`;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) return 'Masked route active';
  return `${parts[0]}.${parts[1]}.*.*`;
}

function coarseScreen() {
  const { width, height, colorDepth } = window.screen;
  return `${width}x${height}, ${colorDepth}-bit`;
}

function readCookieCount() {
  const raw = document.cookie;
  if (!raw) return '0 readable cookies';
  const count = raw.split(';').filter((item) => item.trim().length > 0).length;
  return `${count} readable cookie${count === 1 ? '' : 's'}`;
}

function readStorageFootprint() {
  let localCount = 'blocked';
  let sessionCount = 'blocked';

  try {
    localCount = String(window.localStorage.length);
  } catch {
    localCount = 'blocked';
  }

  try {
    sessionCount = String(window.sessionStorage.length);
  } catch {
    sessionCount = 'blocked';
  }

  return `local:${localCount}, session:${sessionCount}`;
}

function readReferrer() {
  if (!document.referrer) return 'Direct visit / no referrer';
  try {
    const url = new URL(document.referrer);
    return url.hostname || 'Referrer present';
  } catch {
    return 'Referrer present';
  }
}

function readNetworkProfile() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return 'Unavailable';

  const type = connection.effectiveType || 'unknown';
  const downlink = connection.downlink ? `${connection.downlink}Mbps` : 'n/a';
  const rtt = connection.rtt ? `${connection.rtt}ms` : 'n/a';
  return `${type}, ${downlink}, ${rtt}`;
}

async function readDeviceFootprint() {
  if (!navigator.mediaDevices?.enumerateDevices) return 'Unavailable';

  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    const counts = list.reduce(
      (acc, device) => {
        if (device.kind === 'audioinput') acc.mic += 1;
        if (device.kind === 'videoinput') acc.cam += 1;
        if (device.kind === 'audiooutput') acc.spk += 1;
        return acc;
      },
      { mic: 0, cam: 0, spk: 0 }
    );

    return `mics:${counts.mic}, cams:${counts.cam}, outputs:${counts.spk}`;
  } catch {
    return 'Blocked or unavailable';
  }
}

function readHistoryDepth() {
  return `${window.history.length} entries in this tab history`;
}

function readDoNotTrack() {
  const value = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (value === '1' || value === 1) return 'Enabled';
  if (value === '0' || value === 0) return 'Disabled';
  return 'Not provided';
}

function readRawSignals() {
  const platform = safeValue(navigator.userAgentData?.platform || navigator.platform);
  const ua = shortUA(navigator.userAgent);
  const language = safeValue(navigator.language);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown TZ';
  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown RAM';
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'Unknown CPU';

  return {
    ip: 'Detecting...',
    platform,
    ua,
    gpu: readGpuRenderer(),
    screen: coarseScreen(),
    locale: `${language}, ${timezone}`,
    hardware: `${memory}, ${cores}`,
    cookie: readCookieCount(),
    storage: readStorageFootprint(),
    referrer: readReferrer(),
    network: readNetworkProfile(),
    devices: 'Detecting...',
    history: readHistoryDepth(),
    dnt: readDoNotTrack()
  };
}

function paintRawSignals(data) {
  el.ip.textContent = data.ip;
  el.platform.textContent = data.platform;
  el.ua.textContent = data.ua;
  el.gpu.textContent = data.gpu;
  el.screen.textContent = data.screen;
  el.locale.textContent = data.locale;
  el.hardware.textContent = data.hardware;
  el.cookie.textContent = data.cookie;
  el.storage.textContent = data.storage;
  el.referrer.textContent = data.referrer;
  el.network.textContent = data.network;
  el.devices.textContent = data.devices;
  el.history.textContent = data.history;
  el.dnt.textContent = data.dnt;
}

const opticProfiles = {
  low: {
    platform: 'Desktop class (coarse)',
    ua: 'Optic/<major>; common browser family',
    gpu: 'Generic GPU family',
    screen: 'Rounded viewport band',
    locale: 'Language only, coarse timezone',
    hardware: 'Performance tier only',
    cookie: 'First-party cookie reduction',
    storage: 'Scoped storage containers',
    referrer: 'Origin only',
    network: 'Coarse network class',
    devices: 'Capability hint only',
    history: 'Low-value session hint',
    dnt: 'Enforced privacy preference'
  },
  medium: {
    platform: 'Platform bucket (desktop/mobile)',
    ua: 'Normalized Optic token only',
    gpu: 'Graphics capability class',
    screen: 'Normalized resolution class',
    locale: 'Region-safe locale profile',
    hardware: 'Approximate capability bucket',
    cookie: 'Partitioned first-party cookie jar',
    storage: 'Per-site compartmentalized',
    referrer: 'Strict origin policy',
    network: 'Standardized network hint',
    devices: 'Rounded device category',
    history: 'No actionable history entropy',
    dnt: 'Policy-managed privacy signal'
  },
  high: {
    platform: 'Generic platform class',
    ua: 'Single stable anonymity profile',
    gpu: 'Abstract renderer profile',
    screen: 'Standardized viewport set',
    locale: 'Neutral locale envelope',
    hardware: 'Common baseline profile',
    cookie: 'Ephemeral first-party policy',
    storage: 'Aggressive state partitioning',
    referrer: 'Minimal referrer leak',
    network: 'High-privacy network envelope',
    devices: 'No granular device footprint',
    history: 'No useful entropy exposed',
    dnt: 'Privacy signal + anti-fingerprint mode'
  }
};

function renderOpticSignals(level, rawData) {
  const profile = opticProfiles[level];
  opticEl.ip.textContent = level === 'high' ? 'Multi-hop masked route' : maskIp(rawData.ip);
  opticEl.platform.textContent = profile.platform;
  opticEl.ua.textContent = profile.ua;
  opticEl.gpu.textContent = profile.gpu;
  opticEl.screen.textContent = profile.screen;
  opticEl.locale.textContent = profile.locale;
  opticEl.hardware.textContent = profile.hardware;
  opticEl.cookie.textContent = profile.cookie;
  opticEl.storage.textContent = profile.storage;
  opticEl.referrer.textContent = profile.referrer;
  opticEl.network.textContent = profile.network;
  opticEl.devices.textContent = profile.devices;
  opticEl.history.textContent = profile.history;
  opticEl.dnt.textContent = profile.dnt;
}

async function fetchIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    if (!response.ok) throw new Error('ip lookup failed');
    const data = await response.json();
    return safeValue(data.ip, 'Unavailable');
  } catch {
    return 'Unavailable';
  }
}

async function setupLiveSnapshot() {
  const rawData = readRawSignals();
  paintRawSignals(rawData);
  renderOpticSignals('high', rawData);

  rawData.devices = await readDeviceFootprint();
  el.devices.textContent = rawData.devices;

  const ip = await fetchIpAddress();
  rawData.ip = ip;
  el.ip.textContent = ip;

  const active = document.querySelector('.mode-btn.is-active');
  const activeLevel = active?.dataset.level || 'high';
  renderOpticSignals(activeLevel, rawData);

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((item) => item.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderOpticSignals(btn.dataset.level || 'high', rawData);
    });
  });
}

setupLiveSnapshot();

function setupStoryNavTracking() {
  if (!storyLinks.length) return;

  const sectionMap = storyLinks
    .map((link) => {
      const id = link.getAttribute('href')?.replace('#', '');
      const target = id ? document.getElementById(id) : null;
      if (!target) return null;
      return { link, target };
    })
    .filter(Boolean);

  function updateActiveFromScroll() {
    const anchorLine = 220;
    let candidate = sectionMap[0];

    sectionMap.forEach((item) => {
      const rect = item.target.getBoundingClientRect();
      if (rect.top <= anchorLine) {
        candidate = item;
      }
    });

    if (candidate) {
      setActiveStoryLink(candidate.target.id);
    }
  }

  storyLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href')?.slice(1);
      if (id) setActiveStoryLink(id);
    });
  });

  const initialTarget = window.location.hash?.slice(1) || 'snapshot';
  setActiveStoryLink(initialTarget);

  let scrollRaf = 0;

  const requestNavUpdate = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      updateActiveFromScroll();
      scrollRaf = 0;
    });
  };

  window.addEventListener('scroll', requestNavUpdate, { passive: true });
  window.addEventListener('resize', requestNavUpdate);

  window.addEventListener('hashchange', () => {
    const nextTarget = window.location.hash?.slice(1) || 'snapshot';
    setActiveStoryLink(nextTarget);
    requestNavUpdate();
  });

  requestNavUpdate();
}

setupStoryNavTracking();

function setupQuickActions() {
  const quickActions = document.getElementById('quick-actions');
  if (!quickActions) return;

  let revealAt = Math.max(window.innerHeight * 0.68, 420);
  let scrollRaf = 0;

  function updateQuickActions() {
    const isVisible = window.scrollY > revealAt;
    quickActions.classList.toggle('is-visible', isVisible);
  }

  const requestUpdate = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      updateQuickActions();
      scrollRaf = 0;
    });
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    revealAt = Math.max(window.innerHeight * 0.68, 420);
    requestUpdate();
  });

  requestUpdate();
}

setupQuickActions();

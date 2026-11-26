const TOKEN_KEY = 'cadastre_oneid_token';
const VERIFIER_KEY = 'cadastre_oneid_verifier';
const STATE_KEY = 'cadastre_oneid_state';

let cfg = {
  oneidUrl: 'https://oneid-ruddy.vercel.app',
  citizenPassUrl: 'https://citizen-pass-beryl.vercel.app',
  agoraUrl: 'https://assembly-lovat.vercel.app',
  clientId: 'cadastre',
};

// 🏛️ 공식 국가 공공시설 및 랜드마크 (비매품 관공서 / 국유재산)
const PUBLIC_LANDMARKS = [
  {
    id: 'landmark-agora',
    name: '아텔리에 최고인민회의 의사당',
    enName: 'ATELIER SUPREME ASSEMBLY (AGORA)',
    district: 'central',
    districtKo: '중앙 행정·의사당구',
    icon: '🏛️',
    mapX: 50,
    mapY: 13,
    badge: '국가 최고 입법기관',
    address: '아텔리에 제1특별시 중앙구 의사당대로 1',
    desc: '아텔리에 제1특별시의 모든 헌법 제정과 정책 법안 표결이 이루어지는 최고 의회 전당.',
    siteUrl: 'https://assembly-lovat.vercel.app',
  },
  {
    id: 'landmark-citizen-pass',
    name: '아텔리에 통합 행정복지센터',
    enName: 'CITIZEN PASS CIVIL REGISTRY',
    district: 'central',
    districtKo: '중앙 행정·의사당구',
    icon: '🪪',
    mapX: 42,
    mapY: 22,
    badge: '통합 주민센터 · 등기소',
    address: '아텔리에 제1특별시 중앙구 행정중앙로 7',
    desc: '아텔리에 공식 주민등록증(CITIZEN PASS) 발급 및 공적 주소지 등재, 커플인증서 등록을 총괄하는 행정 중심지.',
    siteUrl: 'https://citizen-pass-beryl.vercel.app',
  },
  {
    id: 'landmark-one-bank',
    name: '원뱅크 아텔리에 중앙본점',
    enName: 'ONE-BANK HEADQUARTERS',
    district: 'finance',
    districtKo: '넥서스 금융·비즈니스구',
    icon: '🏦',
    mapX: 82,
    mapY: 28,
    badge: '제1금융권 중앙은행',
    address: '아텔리에 제1특별시 금융구 테헤란로 100',
    desc: '시민들의 자산 예치, 이체, 금융 대출 및 부동산 거래 자금을 보관하는 아텔리에 공식 금융기관.',
    siteUrl: 'https://one-bank-seven.vercel.app',
  },
  {
    id: 'landmark-pulse',
    name: '국영 펄스 미디어 방송국',
    enName: 'PULSE MEDIA BROADCAST TOWER',
    district: 'media',
    districtKo: '펄스 미디어·창작밸리',
    icon: '🎙️',
    mapX: 20,
    mapY: 38,
    badge: '국영 음성/미디어 방송국',
    address: '아텔리에 제1특별시 미디어구 디지털로 1',
    desc: '실시간 음성 방송, 음악 스트리밍, 창작가들의 오디오 콘텐츠가 송출되는 아텔리에 제1 미디어 타워.',
    siteUrl: 'https://pulse-media.vercel.app',
  },
  {
    id: 'landmark-pigsty',
    name: '피그스티 시민 대광장',
    enName: 'PIGSTY GRAND PLAZA & ARENA',
    district: 'plaza',
    districtKo: '피그스티 광장·번화가',
    icon: '🐷',
    mapX: 50,
    mapY: 64,
    badge: '시민 번화가 · 광장 랜드마크',
    address: '아텔리에 제1특별시 광장구 광장중앙로 1',
    desc: '시민들이 자유롭게 모여 축제를 열고 담소를 나누며 다양한 문화 행사가 열리는 최대 번화가 광장.',
    siteUrl: 'https://pigsty.vercel.app',
  },
  {
    id: 'landmark-revo',
    name: '국립 리보 메디컬 센터',
    enName: 'REVO NATIONAL MEDICAL CENTER',
    district: 'plaza',
    districtKo: '피그스티 광장·번화가',
    icon: '🏥',
    mapX: 34,
    mapY: 54,
    badge: '국립 종합의료기관',
    address: '아텔리에 제1특별시 광장구 대학병원앞길 1',
    desc: '24시간 응급의료 및 첨단 재생의학, 심리 치유 서비스를 제공하는 아텔리에 국립 종합병원.',
    siteUrl: 'https://revo-clinic.vercel.app',
  },
  {
    id: 'landmark-prison',
    name: '아텔리에 중앙인민수감교화소 (ЦНИИ-1)',
    enName: 'ЦЕНТРАЛЬНЫЙ НАРОДНЫЙ ИСПРАВИТЕЛЬНО-ТРУДОВОЙ ИЗОЛЯТОР',
    district: 'underground',
    districtKo: '언더그라운드·제한구역',
    icon: '⛓️',
    mapX: 35,
    mapY: 89,
    badge: '국가 특별 교정·수감기관',
    address: '아텔리에 지하특구 해안암초로 1 (ЦНИИ-1)',
    desc: '아텔리에 제1특별시의 질서를 어지럽힌 수형자들을 격리 수용하여 채석장 강제 노역과 반성문으로 사상을 교화하는 중앙인민수감교화소.',
    siteUrl: 'https://prison-gold.vercel.app',
  },
];

let token = localStorage.getItem(TOKEN_KEY) || '';
let stateData = {
  me: null,
  buildings: [],
  trades: [],
};
let activeDistrict = 'all';
let ledgerFilter = 'all'; // 'all' | 'sale' | 'mine' | 'landmark'
let selectedBuilding = null;
let selectedLandmark = null;

// Zoom & Pan State
let mapScale = 1;
let mapPanX = 0;
let mapPanY = 0;
let isPanning = false;
let startPointerX = 0;
let startPointerY = 0;
let origPanX = 0;
let origPanY = 0;
let hasDragged = false;
const activePointers = new Map();
let initialPinchDist = null;
let initialPinchScale = 1;

// DOM Elements
const oneidBtn = document.getElementById('oneidBtn');
const openAdminBuildBtn = document.getElementById('openAdminBuildBtn');
const districtFilterBar = document.getElementById('districtFilterBar');
const cityMapViewport = document.getElementById('cityMapViewport');
const mapWorld = document.getElementById('mapWorld');
const mapPinsLayer = document.getElementById('mapPinsLayer');
const mapLandmarksLayer = document.getElementById('mapLandmarksLayer');
const inspectorPanel = document.getElementById('inspectorPanel');

const statTotalBuildings = document.getElementById('statTotalBuildings');
const statForSale = document.getElementById('statForSale');
const statOwned = document.getElementById('statOwned');
const statMyBuildings = document.getElementById('statMyBuildings');
const statBankBalance = document.getElementById('statBankBalance');
const statBankAccountNo = document.getElementById('statBankAccountNo');

const buildingListCount = document.getElementById('buildingListCount');
const buildingLedgerList = document.getElementById('buildingLedgerList');
const tradeHistoryList = document.getElementById('tradeHistoryList');
const filterAllLotBtn = document.getElementById('filterAllLotBtn');
const filterSaleLotBtn = document.getElementById('filterSaleLotBtn');
const filterMineLotBtn = document.getElementById('filterMineLotBtn');
const filterLandmarksBtn = document.getElementById('filterLandmarksBtn');

const mapZoomInBtn = document.getElementById('mapZoomInBtn');
const mapZoomOutBtn = document.getElementById('mapZoomOutBtn');
const mapResetBtn = document.getElementById('mapResetBtn');
const mapZoomLevel = document.getElementById('mapZoomLevel');

const buyModal = document.getElementById('buyModal');
const closeBuyModalBtn = document.getElementById('closeBuyModalBtn');
const buyForm = document.getElementById('buyForm');
const buyBankSettlementBox = document.getElementById('buyBankSettlementBox');
const buySubmitBtn = document.getElementById('buySubmitBtn');

const sellModal = document.getElementById('sellModal');
const closeSellModalBtn = document.getElementById('closeSellModalBtn');
const sellForm = document.getElementById('sellForm');
const sellBuildingId = document.getElementById('sellBuildingId');
const sellPriceInput = document.getElementById('sellPriceInput');
const sellSignboardInput = document.getElementById('sellSignboardInput');
const sellBuildingSummary = document.getElementById('sellBuildingSummary');
const sellSubmitBtn = document.getElementById('sellSubmitBtn');

const sellbackModal = document.getElementById('sellbackModal');
const closeSellbackModalBtn = document.getElementById('closeSellbackModalBtn');
const sellbackBuildingId = document.getElementById('sellbackBuildingId');
const sellbackBuildingSummary = document.getElementById('sellbackBuildingSummary');
const sellbackSettlementBox = document.getElementById('sellbackSettlementBox');
const sellbackConfirmBtn = document.getElementById('sellbackConfirmBtn');

const manageModal = document.getElementById('manageModal');
const closeManageModalBtn = document.getElementById('closeManageModalBtn');
const manageForm = document.getElementById('manageForm');

const adminBuildModal = document.getElementById('adminBuildModal');
const closeAdminBuildModalBtn = document.getElementById('closeAdminBuildModalBtn');
const adminBuildForm = document.getElementById('adminBuildForm');

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatWon(num) {
  const n = Number(num || 0);
  if (n >= 100000000) {
    const eok = (n / 100000000).toFixed(1).replace(/\.0$/, '');
    return `₩${eok}억 원 (${n.toLocaleString()}원)`;
  }
  return `₩${n.toLocaleString()}원`;
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function startOneIdLogin() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const challenge = base64Url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  );
  const redirectUri = `${location.origin}${location.pathname}`;
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const query = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    state,
  });
  location.assign(`${cfg.oneidUrl}/login.html?${query}`);
}

async function handleOneIdCallback() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code) return;

  const state = params.get('state');
  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  history.replaceState(null, '', `${location.pathname}`);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!state || state !== expectedState || !verifier) {
    alert('ONEID 인증 상태를 확인할 수 없습니다. 다시 로그인해 주세요.');
    return;
  }

  try {
    const res = await fetch(`${cfg.oneidUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: cfg.clientId,
        redirect_uri: `${location.origin}${location.pathname}`,
        code,
        code_verifier: verifier,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      throw new Error(data.detail || '토큰 발급 실패');
    }
    token = data.access_token;
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    alert(`ONEID 로그인 실패: ${err.message}`);
  }
}

async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function isMine(b) {
  if (!stateData.me || !b) return false;
  if (b.ownerUserId && b.ownerUserId === stateData.me.id) return true;
  if (b.coOwnerName && b.coOwnerName.toLowerCase() === stateData.me.nickname.toLowerCase()) return true;
  return false;
}

function getPinStatusClass(b) {
  if (isMine(b)) return 'status-mine';
  if (b.forSale) return 'status-sale';
  return 'status-owned';
}

function renderStats() {
  const list = stateData.buildings || [];
  const saleCnt = list.filter((b) => b.forSale).length;
  const ownedCnt = list.filter((b) => Boolean(b.ownerUserId)).length;
  const myCnt = list.filter((b) => isMine(b)).length;

  if (statTotalBuildings) statTotalBuildings.textContent = `${list.length}동`;
  if (statForSale) statForSale.textContent = `${saleCnt}동`;
  if (statOwned) statOwned.textContent = `${ownedCnt}동`;
  if (statMyBuildings) statMyBuildings.textContent = `${myCnt}동`;

  if (statBankBalance) {
    if (stateData.me?.bank) {
      statBankBalance.textContent = formatWon(stateData.me.bank.balance);
    } else if (stateData.me) {
      statBankBalance.textContent = '조회 중...';
    } else {
      statBankBalance.textContent = '로그인 필요';
    }
  }

  if (statBankAccountNo) {
    if (stateData.me?.bank?.accountNo) {
      statBankAccountNo.textContent = `계좌: ${stateData.me.bank.accountNo}`;
    } else {
      statBankAccountNo.textContent = '계좌: 777-01-XXXXXX';
    }
  }
}

// =========================================================
// SELECTION HANDLERS (건물 및 랜드마크 선택 함수)
// =========================================================
function selectBuilding(b, focus = false) {
  if (!b) return;
  selectedBuilding = b;
  selectedLandmark = null;
  renderLandmarks();
  renderMapPins();
  renderInspector(b);
  if (focus) {
    focusMap(b.mapX, b.mapY, 1.55);
  }
}

function selectLandmark(lm, focus = false) {
  if (!lm) return;
  selectedLandmark = lm;
  selectedBuilding = null;
  renderLandmarks();
  renderMapPins();
  renderInspectorLandmark(lm);
  if (focus) {
    focusMap(lm.mapX, lm.mapY, 1.55);
  }
}

// =========================================================
// ZOOM & PAN LOGIC (큰 섬 지도 확대 / 축소 / 이동)
// =========================================================
function clampPan() {
  if (!cityMapViewport) return;
  const vw = cityMapViewport.clientWidth;
  const vh = cityMapViewport.clientHeight;
  const worldW = 1600 * mapScale;
  const worldH = 1100 * mapScale;
  const marginX = vw * 0.45;
  const marginY = vh * 0.45;
  const minX = vw - worldW - marginX;
  const maxX = marginX;
  const minY = vh - worldH - marginY;
  const maxY = marginY;
  mapPanX = Math.min(maxX, Math.max(minX, mapPanX));
  mapPanY = Math.min(maxY, Math.max(minY, mapPanY));
}

function applyMapTransform(animate = false) {
  if (!mapWorld) return;
  mapWorld.style.transition = animate ? 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
  mapWorld.style.transform = `translate3d(${mapPanX}px, ${mapPanY}px, 0) scale(${mapScale})`;
  mapWorld.style.setProperty('--map-scale', mapScale);
  if (mapZoomLevel) {
    mapZoomLevel.textContent = `${Math.round(mapScale * 100)}%`;
  }
}

function fitIsland(animate = true) {
  if (!cityMapViewport) return;
  const vw = cityMapViewport.clientWidth;
  const vh = cityMapViewport.clientHeight;
  const scaleX = vw / 1600;
  const scaleY = vh / 1100;
  const fitScale = Math.max(0.48, Math.min(scaleX, scaleY) * 0.98);
  mapScale = Math.round(fitScale * 100) / 100;
  mapPanX = Math.round((vw - 1600 * mapScale) / 2);
  mapPanY = Math.round((vh - 1100 * mapScale) / 2);
  applyMapTransform(animate);
}

function focusMap(targetPercentX, targetPercentY, targetScale = 1.45) {
  if (!cityMapViewport) return;
  const vw = cityMapViewport.clientWidth;
  const vh = cityMapViewport.clientHeight;
  const worldX = (1600 * targetPercentX) / 100;
  const worldY = (1100 * targetPercentY) / 100;
  mapScale = Math.max(0.5, Math.min(3.2, targetScale));
  mapPanX = Math.round(vw / 2 - worldX * mapScale);
  mapPanY = Math.round(vh / 2 - worldY * mapScale);
  clampPan();
  applyMapTransform(true);
}

function initMapInteractions() {
  if (!cityMapViewport) return;

  let isPointerDown = false;
  let dragThresholdPassed = false;
  let downX = 0;
  let downY = 0;

  // Mouse Wheel Zoom centered on cursor
  cityMapViewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const rect = cityMapViewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.max(0.48, Math.min(3.2, mapScale * factor));
      if (newScale === mapScale) return;
      mapPanX = mouseX - (mouseX - mapPanX) * (newScale / mapScale);
      mapPanY = mouseY - (mouseY - mapPanY) * (newScale / mapScale);
      mapScale = newScale;
      clampPan();
      applyMapTransform(false);
    },
    { passive: false }
  );

  // Pointer Down (Mouse drag or touch drag) - NO setPointerCapture so clicks work!
  cityMapViewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.map-controls')) return;

    isPointerDown = true;
    dragThresholdPassed = false;
    hasDragged = false;
    downX = e.clientX;
    downY = e.clientY;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    origPanX = mapPanX;
    origPanY = mapPanY;

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      isPanning = false;
      const pts = Array.from(activePointers.values());
      initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchScale = mapScale;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2 && initialPinchDist) {
      const pts = Array.from(activePointers.values());
      const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = curDist / initialPinchDist;
      const newScale = Math.max(0.48, Math.min(3.2, initialPinchScale * ratio));
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const rect = cityMapViewport.getBoundingClientRect();
      const cx = midX - rect.left;
      const cy = midY - rect.top;
      mapPanX = cx - (cx - mapPanX) * (newScale / mapScale);
      mapPanY = cy - (cy - mapPanY) * (newScale / mapScale);
      mapScale = newScale;
      clampPan();
      applyMapTransform(false);
      return;
    }

    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (!dragThresholdPassed && dist > 6) {
      dragThresholdPassed = true;
      hasDragged = true;
      isPanning = true;
      cityMapViewport.style.cursor = 'grabbing';
    }

    if (isPanning) {
      const dx = e.clientX - startPointerX;
      const dy = e.clientY - startPointerY;
      mapPanX = origPanX + dx;
      mapPanY = origPanY + dy;
      clampPan();
      applyMapTransform(false);
    }
  });

  function pointerEnd(e) {
    if (!isPointerDown) return;
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) {
      isPointerDown = false;
      isPanning = false;
      cityMapViewport.style.cursor = 'grab';
    }
    if (activePointers.size < 2) {
      initialPinchDist = null;
    }
    if (hasDragged) {
      setTimeout(() => {
        hasDragged = false;
      }, 100);
    }
  }

  window.addEventListener('pointerup', pointerEnd);
  window.addEventListener('pointercancel', pointerEnd);

  // Delegated click handler on viewport - works 100% reliably regardless of inner targets
  cityMapViewport.addEventListener('click', (e) => {
    if (hasDragged) return;
    const pin = e.target.closest('.map-pin');
    if (pin) {
      const id = Number(pin.dataset.pinId);
      const found = (stateData.buildings || []).find((x) => x.id === id);
      if (found) selectBuilding(found, false);
      return;
    }
    const lm = e.target.closest('.landmark-pin');
    if (lm) {
      const id = lm.dataset.landmarkId;
      const found = PUBLIC_LANDMARKS.find((x) => x.id === id);
      if (found) selectLandmark(found, false);
      return;
    }
  });

  window.addEventListener('resize', () => {
    clampPan();
    applyMapTransform(false);
  });

  // Toolbar zoom buttons
  mapZoomInBtn?.addEventListener('click', () => {
    const cx = cityMapViewport.clientWidth / 2;
    const cy = cityMapViewport.clientHeight / 2;
    const newScale = Math.min(3.2, mapScale * 1.25);
    mapPanX = cx - (cx - mapPanX) * (newScale / mapScale);
    mapPanY = cy - (cy - mapPanY) * (newScale / mapScale);
    mapScale = newScale;
    clampPan();
    applyMapTransform(true);
  });

  mapZoomOutBtn?.addEventListener('click', () => {
    const cx = cityMapViewport.clientWidth / 2;
    const cy = cityMapViewport.clientHeight / 2;
    const newScale = Math.max(0.48, mapScale / 1.25);
    mapPanX = cx - (cx - mapPanX) * (newScale / mapScale);
    mapPanY = cy - (cy - mapPanY) * (newScale / mapScale);
    mapScale = newScale;
    clampPan();
    applyMapTransform(true);
  });

  mapResetBtn?.addEventListener('click', () => {
    activeDistrict = 'all';
    districtFilterBar?.querySelectorAll('.d-pill').forEach((b) => b.classList.toggle('active', b.dataset.district === 'all'));
    renderMapPins();
    renderLandmarks();
    renderLedgerList();
    fitIsland(true);
  });
}

// =========================================================
// RENDER PUBLIC LANDMARKS (국가 관공서 · 비매품 랜드마크)
// =========================================================
function renderLandmarks() {
  if (!mapLandmarksLayer) return;

  const list = PUBLIC_LANDMARKS.filter(
    (lm) => activeDistrict === 'all' || lm.district === activeDistrict
  );

  mapLandmarksLayer.innerHTML = list
    .map((lm) => {
      const isSelected = selectedLandmark && selectedLandmark.id === lm.id ? 'selected' : '';
      return `
        <div class="landmark-pin ${isSelected}"
             style="left:${lm.mapX}%;top:${lm.mapY}%;"
             data-landmark-id="${lm.id}"
             title="${escapeHtml(lm.name)} (${escapeHtml(lm.badge)})">
          <span class="landmark-badge">🏛️ ${escapeHtml(lm.badge)}</span>
          <div class="landmark-box">${escapeHtml(lm.icon)}</div>
          <span class="landmark-name-tag">${escapeHtml(lm.name)}</span>
        </div>
      `;
    })
    .join('');

  mapLandmarksLayer.querySelectorAll('[data-landmark-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (hasDragged) return;
      e.stopPropagation();
      const id = el.dataset.landmarkId;
      const found = PUBLIC_LANDMARKS.find((x) => x.id === id);
      if (found) selectLandmark(found, false);
    });
  });
}

// =========================================================
// RENDER PRIVATE VIRTUAL REAL ESTATE PINS (순수 가상 건물 20동)
// =========================================================
function renderMapPins() {
  if (!mapPinsLayer) return;

  const list = (stateData.buildings || []).filter(
    (b) => activeDistrict === 'all' || b.district === activeDistrict
  );

  mapPinsLayer.innerHTML = list
    .map((b) => {
      const statusCls = getPinStatusClass(b);
      const selectedCls = selectedBuilding && selectedBuilding.id === b.id ? 'selected' : '';
      const ownerBadge = b.ownerUserId
        ? `👑 ${escapeHtml(b.ownerName)}${b.coOwnerName ? `·${escapeHtml(b.coOwnerName)}` : ''}`
        : '🟢 분양중';
      return `
        <div class="map-pin ${statusCls} ${selectedCls}"
             style="left:${b.mapX}%;top:${b.mapY}%;"
             data-pin-id="${b.id}"
             title="${escapeHtml(b.name)} (${escapeHtml(b.lotNo)})">
          <span class="pin-roof-owner">${ownerBadge}</span>
          <div class="pin-building-box">${escapeHtml(b.icon || '🏢')}</div>
          <span class="pin-name-tag">${escapeHtml(b.name)}</span>
        </div>
      `;
    })
    .join('');

  mapPinsLayer.querySelectorAll('[data-pin-id]').forEach((pinEl) => {
    pinEl.addEventListener('click', (e) => {
      if (hasDragged) return;
      e.stopPropagation();
      const id = Number(pinEl.dataset.pinId);
      const found = (stateData.buildings || []).find((x) => x.id === id);
      if (found) selectBuilding(found, false);
    });
  });
}

// =========================================================
// INSPECTOR: PUBLIC LANDMARK
// =========================================================
function renderInspectorLandmark(lm) {
  inspectorPanel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
      <div>
        <span class="eyebrow">${escapeHtml(lm.districtKo)} · 공공 랜드마크</span>
        <h2 style="font-size:20px;font-weight:900;margin-top:2px;">${escapeHtml(lm.icon)} ${escapeHtml(lm.name)}</h2>
        <span style="font-size:11px;color:#94a3b8;font-weight:700;">${escapeHtml(lm.enName)}</span>
      </div>
      <span class="badge landmark">🏛️ 국유 공공시설</span>
    </div>

    <div class="landmark-notice-box">
      🛡️ <strong>아텔리에 국가 공공시설 안내:</strong><br>
      본 건축물은 아텔리에 제1특별시 정부 소유의 공식 국유 랜드마크로, <strong>민간 매매 및 사유화가 불가능한 영구 공공재산</strong>입니다.
    </div>

    <!-- OFFICIAL PUBLIC LANDMARK DEED -->
    <div class="deed-certificate public-deed">
      <div class="deed-head">
        <strong>🏛️ 국가 공공시설 지정증서 (PUBLIC LANDMARK)</strong>
        <span class="deed-lot-badge">GOV-LANDMARK</span>
      </div>

      <table class="deed-table">
        <tbody>
          <tr>
            <th>기관 / 시설명</th>
            <td>${escapeHtml(lm.name)}</td>
          </tr>
          <tr>
            <th>소재지 (주소)</th>
            <td>${escapeHtml(lm.address)}</td>
          </tr>
          <tr>
            <th>시설 기능</th>
            <td><strong style="color:#fcd34d;">${escapeHtml(lm.badge)}</strong></td>
          </tr>
          <tr>
            <th>소유권 구분</th>
            <td style="color:#38bdf8;font-weight:700;">아텔리에 제1특별시 정부 (국유지)</td>
          </tr>
          <tr>
            <th>매매 상태</th>
            <td style="color:#ef4444;font-weight:700;">사유화 금지 (비매품)</td>
          </tr>
        </tbody>
      </table>

      <div class="deed-foot">
        <span>관할: 아텔리에 국토관리청</span>
        <span>ATELIER J <i class="stamp-red">국유</i></span>
      </div>
    </div>

    <p style="font-size:13px;color:#cbd5e1;line-height:1.6;">${escapeHtml(lm.desc)}</p>

    <div style="margin-top:10px;">
      <a href="${escapeHtml(lm.siteUrl)}" target="_blank" rel="noopener" class="btn gold full" style="font-size:14px;padding:12px;">
        🔗 공식 웹사이트 방문하기 (${escapeHtml(lm.name)}) ↗
      </a>
    </div>
  `;
}

// =========================================================
// INSPECTOR: PRIVATE VIRTUAL REAL ESTATE & DEED
// =========================================================
function renderInspector(b) {
  if (!b) {
    inspectorPanel.innerHTML = `<div class="empty-box">지도에서 건물이나 필지를 클릭하면 등기부등본과 매입/관리 창구가 표시됩니다.</div>`;
    return;
  }

  const mine = isMine(b);
  const isAdmin = Boolean(stateData.me?.isAdmin);
  const ownerDisplay = b.coOwnerName
    ? `${escapeHtml(b.ownerName)} ♥ ${escapeHtml(b.coOwnerName)} (공동명의)`
    : escapeHtml(b.ownerName);

  inspectorPanel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
      <div>
        <span class="eyebrow">${escapeHtml(b.districtKo)} · ${escapeHtml(b.category)}</span>
        <h2 style="font-size:20px;font-weight:900;margin-top:2px;">${escapeHtml(b.icon)} ${escapeHtml(b.name)}</h2>
      </div>
      ${
        b.forSale
          ? `<span class="badge sale">🟢 분양 / 매수 가능</span>`
          : `<span class="badge owned">🔒 사유지 등기 완료</span>`
      }
    </div>

    ${
      b.signboard
        ? `<div class="signboard-banner">🪧 <strong>건물 외벽 간판:</strong> “${escapeHtml(b.signboard)}”</div>`
        : ''
    }

    <!-- OFFICIAL REAL ESTATE DEED CERTIFICATE -->
    <div class="deed-certificate">
      <div class="deed-head">
        <strong>📜 부동산 등기사항전부증명서 (건축물 등기부등본)</strong>
        <span class="deed-lot-badge">${escapeHtml(b.lotNo)}</span>
      </div>

      <table class="deed-table">
        <tbody>
          <tr>
            <th>표제부 (건물명)</th>
            <td>${escapeHtml(b.name)} (지상 ${b.floors}층)</td>
          </tr>
          <tr>
            <th>소재지 (도로명)</th>
            <td>${escapeHtml(b.address)}</td>
          </tr>
          <tr>
            <th>갑구 (소유권자)</th>
            <td style="color:${b.ownerUserId ? '#003764' : '#047857'};">${ownerDisplay}</td>
          </tr>
          <tr>
            <th>공시지가 · 매매가</th>
            <td style="color:#b45309;">${formatWon(b.price)}</td>
          </tr>
          <tr>
            <th>최근 등기일</th>
            <td>${formatDate(b.updatedAt)}</td>
          </tr>
        </tbody>
      </table>

      <div class="deed-foot">
        <span>관할: 아텔리에 중앙등기소</span>
        <span>ATELIER J 지적등기청장 <i class="stamp-red">인</i></span>
      </div>
    </div>

    <p style="font-size:12.5px;color:#cbd5e1;line-height:1.55;">${escapeHtml(b.description)}</p>

    <!-- ONE-BANK SETTLEMENT CAPABILITY CARD -->
    ${(() => {
      if (!b.forSale || mine) return '';
      if (!stateData.me) {
        return `
          <div class="inspector-bank-card">
            <div>
              <span style="font-size:11px;color:#94a3b8;">🏦 원뱅크 결제 연동</span>
              <div style="font-size:12.5px;font-weight:700;color:#fcd34d;">로그인 후 통장 잔고 및 즉시 매수 가능 여부 확인</div>
            </div>
            <button type="button" class="btn small gold" id="inspectorLoginBtn">로그인</button>
          </div>
        `;
      }
      const myBal = Number(stateData.me?.bank?.balance ?? 0);
      const canAfford = myBal >= b.price;
      const acct = stateData.me?.bank?.accountNo || '777-01-XXXXXX';
      return `
        <div class="inspector-bank-card ${canAfford ? 'can-afford' : 'cannot-afford'}">
          <div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:11px;color:#94a3b8;">🏦 내 원뱅크 (${acct})</span>
              ${
                canAfford
                  ? `<span class="badge" style="background:rgba(16,185,129,0.2);color:#34d399;font-size:10.5px;padding:2px 6px;">🟢 즉시 매수가능</span>`
                  : `<span class="badge" style="background:rgba(239,68,68,0.2);color:#f87171;font-size:10.5px;padding:2px 6px;">🔴 잔액 부족</span>`
              }
            </div>
            <div style="font-size:13px;font-weight:800;margin-top:2px;color:${canAfford ? '#34d399' : '#f87171'};">
              보유 잔고: ${formatWon(myBal)}
              ${!canAfford ? `<span style="font-size:11.5px;font-weight:600;color:#fca5a5;"> (${formatWon(b.price - myBal)} 부족)</span>` : ''}
            </div>
          </div>
          <a href="${cfg.oneBankUrl || 'https://one-bank-seven.vercel.app'}" target="_blank" rel="noopener" class="btn small ghost">원뱅크 ↗</a>
        </div>
      `;
    })()}

    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
      ${
        b.forSale && !mine
          ? `<button type="button" class="btn gold full" id="inspectorBuyBtn">🏛️ 이 건물 매입 · 소유권 이전 등기 신청</button>`
          : ''
      }
      ${
        mine
          ? `
            <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12.5px;font-weight:800;color:#60a5fa;">👑 내 소유 부동산 관리</span>
                <span class="badge ${b.forSale ? 'sale' : 'owned'}">${b.forSale ? '🟢 시장 매물 등록 중' : '🔒 비공개 사유지'}</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                ${
                  b.forSale
                    ? `<button type="button" class="btn small danger" id="inspectorCancelSaleBtn">🛑 매물 등록 취소</button>`
                    : `<button type="button" class="btn small gold" id="inspectorOpenSellBtn">🏷️ 시장 매도 등록</button>`
                }
                <button type="button" class="btn small danger" id="inspectorOpenSellbackBtn">🏛️ 국가 즉시 매각</button>
              </div>
              <button type="button" class="btn emerald full" id="inspectorManageBtn" style="padding:8px 12px;font-size:12.5px;">
                🔑 간판 · 공동명의 · 민증 주소 설정
              </button>
            </div>
          `
          : ''
      }
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn small ghost" id="inspectorDownloadDeedBtn">🖨️ 등기권리증(집문서) PNG 출력</button>
        ${
          b.siteUrl
            ? `<a href="${escapeHtml(b.siteUrl)}" target="_blank" rel="noopener" class="btn small">🔗 입주 사이트 바로가기 ↗</a>`
            : ''
        }
        ${
          isAdmin && b.ownerUserId
            ? `<button type="button" class="btn small danger" id="inspectorNationalizeBtn">👑 국유화(강제 수용)</button>`
            : ''
        }
      </div>
    </div>
  `;

  document.getElementById('inspectorLoginBtn')?.addEventListener('click', () => startOneIdLogin());
  document.getElementById('inspectorBuyBtn')?.addEventListener('click', () => openBuyModal(b));
  document.getElementById('inspectorOpenSellBtn')?.addEventListener('click', () => openSellModal(b));
  document.getElementById('inspectorCancelSaleBtn')?.addEventListener('click', async () => {
    if (!confirm(`[${b.name}] 건물의 시장 매물 등록을 취소하고 비공개 사유지로 전환하시겠습니까?`)) return;
    try {
      await api(`/api/buildings/${b.id}/market-sale`, { method: 'POST', body: { forSale: false } });
      await loadOverview(b.id);
      alert('🔒 시장 매물 등록이 취소되었습니다. 이제 비공개 사유지로 안전하게 보관됩니다.');
    } catch (err) {
      alert(err.message);
    }
  });
  document.getElementById('inspectorOpenSellbackBtn')?.addEventListener('click', () => openSellbackModal(b));
  document.getElementById('inspectorManageBtn')?.addEventListener('click', () => openManageModal(b));
  document.getElementById('inspectorDownloadDeedBtn')?.addEventListener('click', () => exportDeedPng(b));
  document.getElementById('inspectorNationalizeBtn')?.addEventListener('click', async () => {
    if (!confirm(`[${b.name}] 건물을 국유지(미분양)로 강제 수용하시겠습니까?`)) return;
    try {
      await api(`/api/admin/buildings/${b.id}/nationalize`, { method: 'POST' });
      await loadOverview(b.id);
    } catch (err) {
      alert(err.message);
    }
  });
}

function openBuyModal(b) {
  if (!stateData.me) return startOneIdLogin();
  document.getElementById('buyBuildingId').value = b.id;
  document.getElementById('buyBuildingSummary').innerHTML = `
    <div><strong>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</strong> (${escapeHtml(b.lotNo)})</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">소재지: ${escapeHtml(b.address)}</div>
    <div style="font-size:13px;color:#fcd34d;margin-top:4px;font-weight:800;">등기 매입가: ${formatWon(b.price)}</div>
  `;

  // ONE-BANK Settlement Calculation
  const myBal = Number(stateData.me?.bank?.balance ?? 0);
  const accountNo = stateData.me?.bank?.accountNo || '777-01-XXXXXX';
  const price = Number(b.price);
  const canAfford = myBal >= price;
  const remBal = myBal - price;
  const shortage = price - myBal;

  if (buyBankSettlementBox) {
    if (canAfford) {
      buyBankSettlementBox.className = 'bank-settlement-box settlement-ok';
      buyBankSettlementBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:800;color:#34d399;">🏦 원뱅크 즉시 결제 정산서</span>
          <span style="font-size:11px;color:#94a3b8;">계좌: ${accountNo}</span>
        </div>
        <table class="settlement-table">
          <tbody>
            <tr>
              <td style="color:#94a3b8;">현재 통장 잔고</td>
              <td style="color:#f1f5f9;">${formatWon(myBal)}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8;">부동산 매매 대금 (출금)</td>
              <td style="color:#ef4444;">- ${formatWon(price)}</td>
            </tr>
            <tr><td colspan="2" class="settlement-divider"></td></tr>
            <tr>
              <td style="color:#6ee7b7;font-weight:700;">결제 후 예상 잔여 잔고</td>
              <td style="color:#34d399;font-size:14px;">${formatWon(remBal)}</td>
            </tr>
          </tbody>
        </table>
        <div class="settlement-alert ok">
          ✅ <strong>결제 가능:</strong> 신청 즉시 원뱅크 계좌에서 대금이 자동 출금되어 소유권 이전 등기 및 권리증이 발급됩니다.
        </div>
      `;
    } else {
      buyBankSettlementBox.className = 'bank-settlement-box settlement-shortage';
      buyBankSettlementBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:800;color:#f87171;">⚠️ 원뱅크 잔고 부족 안내</span>
          <span style="font-size:11px;color:#94a3b8;">계좌: ${accountNo}</span>
        </div>
        <table class="settlement-table">
          <tbody>
            <tr>
              <td style="color:#94a3b8;">현재 통장 잔고</td>
              <td style="color:#f1f5f9;">${formatWon(myBal)}</td>
            </tr>
            <tr>
              <td style="color:#94a3b8;">필요 매매 대금</td>
              <td style="color:#ef4444;">${formatWon(price)}</td>
            </tr>
            <tr><td colspan="2" class="settlement-divider"></td></tr>
            <tr>
              <td style="color:#fca5a5;font-weight:700;">부족 금액</td>
              <td style="color:#f87171;font-size:14px;">${formatWon(shortage)} 부족</td>
            </tr>
          </tbody>
        </table>
        <div class="settlement-alert warn">
          ❌ <strong>잔고가 부족합니다:</strong> 원뱅크에서 자금을 송금받거나 충전한 후 등기 신청을 진행해 주세요.
        </div>
        <div style="text-align:right;">
          <a href="${cfg.oneBankUrl || 'https://one-bank-seven.vercel.app'}" target="_blank" rel="noopener" class="btn small gold" style="display:inline-flex;align-items:center;gap:4px;">
            🏦 원뱅크 바로가기 ↗
          </a>
        </div>
      `;
    }
  }

  if (buySubmitBtn) {
    buySubmitBtn.disabled = !canAfford;
    buySubmitBtn.classList.toggle('disabled', !canAfford);
    if (canAfford) {
      buySubmitBtn.innerHTML = `✍️ ${formatWon(price)} 원뱅크 결제 및 등기권리증 발급`;
    } else {
      buySubmitBtn.innerHTML = `⚠️ 원뱅크 잔고 부족 (${formatWon(shortage)} 부족)`;
    }
  }

  document.getElementById('buyCoOwnerInput').value = stateData.me.partnerName || '';
  document.getElementById('buySignboardInput').value = b.signboard || `${stateData.me.nickname} 타워`;
  document.getElementById('buySetDomicileCheck').checked = true;
  buyModal.hidden = false;
}

function openManageModal(b) {
  if (!stateData.me) return startOneIdLogin();
  document.getElementById('manageBuildingId').value = b.id;
  document.getElementById('manageSignboardInput').value = b.signboard || '';
  document.getElementById('manageCoOwnerInput').value = b.coOwnerName || '';
  document.getElementById('managePriceInput').value = b.price;
  document.getElementById('manageForSaleCheck').checked = Boolean(b.forSale);
  document.getElementById('manageSetDomicileCheck').checked = false;
  manageModal.hidden = false;
}

function openSellModal(b) {
  if (!stateData.me) return startOneIdLogin();
  sellBuildingId.value = b.id;
  sellBuildingSummary.innerHTML = `
    <div><strong>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</strong> (${escapeHtml(b.lotNo)})</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">소재지: ${escapeHtml(b.address)}</div>
    <div style="font-size:13px;color:#fcd34d;margin-top:4px;font-weight:800;">현재 공시지가: ${formatWon(b.price)}</div>
  `;
  sellPriceInput.value = b.price;
  sellSignboardInput.value = b.signboard || '';
  sellModal.hidden = false;
}

function openSellbackModal(b) {
  if (!stateData.me) return startOneIdLogin();
  sellbackBuildingId.value = b.id;
  sellbackBuildingSummary.innerHTML = `
    <div><strong>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</strong> (${escapeHtml(b.lotNo)})</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px;">소재지: ${escapeHtml(b.address)}</div>
  `;

  const price = Number(b.price);
  const refund = Math.floor(price * 0.9);
  const tax = price - refund;
  const acct = stateData.me?.bank?.accountNo || '777-01-XXXXXX';
  const curBal = Number(stateData.me?.bank?.balance ?? 0);
  const afterBal = curBal + refund;

  sellbackSettlementBox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:800;color:#34d399;">🏛️ 국토교통부 국가 환매 정산서</span>
      <span style="font-size:11px;color:#94a3b8;">입금계좌: ${acct}</span>
    </div>
    <table class="settlement-table">
      <tbody>
        <tr>
          <td style="color:#94a3b8;">건축물 기준 평가액</td>
          <td style="color:#f1f5f9;">${formatWon(price)}</td>
        </tr>
        <tr>
          <td style="color:#94a3b8;">국가 양도소득세 및 수수료 (10%)</td>
          <td style="color:#ef4444;">- ${formatWon(tax)}</td>
        </tr>
        <tr><td colspan="2" class="settlement-divider"></td></tr>
        <tr>
          <td style="color:#6ee7b7;font-weight:700;">원뱅크 통장 즉시 입금액 (환매율 90%)</td>
          <td style="color:#34d399;font-size:15px;font-weight:900;">+ ${formatWon(refund)}</td>
        </tr>
        <tr>
          <td style="color:#94a3b8;font-size:11.5px;">입금 후 예상 통장 잔고</td>
          <td style="color:#fcd34d;font-size:12.5px;">${formatWon(afterBal)}</td>
        </tr>
      </tbody>
    </table>
    <div class="settlement-alert ok">
      💡 <strong>즉시 현금화:</strong> 매각 승인 즉시 국토교통부 환매 기금에서 귀하의 원뱅크 통장으로 대금이 실시간 입금됩니다.
    </div>
  `;

  sellbackConfirmBtn.textContent = `💰 ${formatWon(refund)} 수령하고 국가에 즉시 매각`;
  sellbackModal.hidden = false;
}

function exportDeedPng(b) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, 1000, 700);

  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 952, 652);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, 928, 628);

  ctx.fillStyle = '#003764';
  ctx.font = 'bold 28px Pretendard, sans-serif';
  ctx.fillText('📜 부동산 등기권리증 (건축물 등기부등본)', 64, 96);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#854d0e';
  ctx.font = 'bold 22px Consolas, monospace';
  ctx.fillText(`지번번호: ${b.lotNo}`, 936, 96);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px Pretendard, sans-serif';
  const rows = [
    ['건축물 명칭', `${b.name} (지상 ${b.floors}층 / ${b.category})`],
    ['관할 구역', b.districtKo],
    ['도로명 주소', b.address],
    ['갑구 소유권자', b.coOwnerName ? `${b.ownerName} ♥ ${b.coOwnerName} (공동명의)` : b.ownerName],
    ['등기 평가액', formatWon(b.price)],
    ['외벽 간판', b.signboard || '-'],
    ['등기 확인일', formatDate(b.updatedAt)],
  ];

  let y = 175;
  for (const [k, v] of rows) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(64, y - 28, 210, 46);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(64, y - 28, 210, 46);
    ctx.strokeRect(274, y - 28, 662, 46);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px Pretendard, sans-serif';
    ctx.fillText(k, 84, y);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 19px Pretendard, sans-serif';
    ctx.fillText(String(v).slice(0, 48), 294, y);
    y += 58;
  }

  ctx.fillStyle = '#475569';
  ctx.font = '16px Pretendard, sans-serif';
  ctx.fillText('본 증서는 아텔리에 통합 지적등기청(CADASTRE) 및 통합 주민센터 원부에 등재된 공식 권리증입니다.', 64, 625);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#003764';
  ctx.font = 'bold 22px Pretendard, sans-serif';
  ctx.fillText('ATELIER J 지적등기청장 [인]', 936, 625);

  const link = document.createElement('a');
  link.download = `${b.lotNo}-${b.name}-등기권리증.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function renderLedgerList() {
  if (ledgerFilter === 'landmark') {
    const list = PUBLIC_LANDMARKS.filter(
      (lm) => activeDistrict === 'all' || lm.district === activeDistrict
    );
    buildingListCount.textContent = String(list.length);
    buildingLedgerList.innerHTML = list
      .map(
        (lm) => `
        <div class="ledger-row" data-ledger-landmark-id="${lm.id}">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge landmark">🏛️ GOV</span>
              <strong>${escapeHtml(lm.icon)} ${escapeHtml(lm.name)}</strong>
              <span style="font-size:11.5px;color:#94a3b8;">(${escapeHtml(lm.districtKo)})</span>
            </div>
            <div style="font-size:12px;color:#cbd5e1;margin-top:3px;">
              기능: <strong style="color:#fcd34d;">${escapeHtml(lm.badge)}</strong> · <span style="color:#38bdf8;">국유지 (사유화 불가)</span>
            </div>
          </div>
          <div>
            <span class="badge landmark">공공 랜드마크</span>
          </div>
        </div>
      `
      )
      .join('');

    buildingLedgerList.querySelectorAll('[data-ledger-landmark-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.ledgerLandmarkId;
        const found = PUBLIC_LANDMARKS.find((x) => x.id === id);
        if (found) {
          selectLandmark(found, true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
    return;
  }

  const list = (stateData.buildings || []).filter((b) => {
    if (activeDistrict !== 'all' && b.district !== activeDistrict) return false;
    if (ledgerFilter === 'sale') return b.forSale;
    if (ledgerFilter === 'mine') return isMine(b);
    return true;
  });

  buildingListCount.textContent = String(list.length);
  if (!list.length) {
    buildingLedgerList.innerHTML = '<div class="empty-box">조건에 맞는 건물이 없습니다.</div>';
    return;
  }

  buildingLedgerList.innerHTML = list
    .map((b) => {
      const ownerLabel = b.coOwnerName
        ? `${escapeHtml(b.ownerName)} ♥ ${escapeHtml(b.coOwnerName)}`
        : escapeHtml(b.ownerName);
      return `
        <div class="ledger-row" data-ledger-id="${b.id}">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge">${escapeHtml(b.lotNo)}</span>
              <strong>${escapeHtml(b.icon)} ${escapeHtml(b.name)}</strong>
              <span style="font-size:11.5px;color:#94a3b8;">(${escapeHtml(b.districtKo)})</span>
            </div>
            <div style="font-size:12px;color:#cbd5e1;margin-top:3px;">
              소유자: <strong style="color:#fcd34d;">${ownerLabel}</strong> · 평가액: ${formatWon(b.price)}
            </div>
          </div>
          <div>
            ${
              b.forSale
                ? `<span class="badge sale">🟢 분양/매물</span>`
                : `<span class="badge owned">등기됨</span>`
            }
          </div>
        </div>
      `;
    })
    .join('');

  buildingLedgerList.querySelectorAll('[data-ledger-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const id = Number(row.dataset.ledgerId);
      const found = (stateData.buildings || []).find((x) => x.id === id);
      if (found) {
        selectBuilding(found, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function renderTrades() {
  const trades = stateData.trades || [];
  if (!trades.length) {
    tradeHistoryList.innerHTML = '<div class="empty-box">아직 실거래 등기 내역이 없습니다. 첫 번째 건물주가 되어보세요!</div>';
    return;
  }

  tradeHistoryList.innerHTML = trades
    .map(
      (t) => `
      <div class="ledger-row" style="cursor:default;">
        <div>
          <div style="font-size:13px;">
            <span class="badge">${escapeHtml(t.lotNo)}</span>
            <strong>${escapeHtml(t.buildingName)}</strong>
          </div>
          <div style="font-size:12px;color:#cbd5e1;margin-top:3px;">
            매수인: <strong style="color:#34d399;">${escapeHtml(t.buyerName)}${t.coOwnerName ? ` ♥ ${escapeHtml(t.coOwnerName)}` : ''}</strong>
            ← 이전: ${escapeHtml(t.sellerName)}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12.5px;font-weight:800;color:#fcd34d;">${formatWon(t.price)}</div>
          <div style="font-size:11px;color:#94a3b8;">${formatDate(t.tradedAt)}</div>
        </div>
      </div>
    `
    )
    .join('');
}

async function loadOverview(keepBuildingId = null) {
  try {
    stateData = await api('/api/overview');
    if (stateData.me) {
      oneidBtn.textContent = `${stateData.me.nickname} (내 건물 보기)`;
      openAdminBuildBtn.hidden = !stateData.me.isAdmin;
    } else {
      oneidBtn.textContent = 'ONEID 로그인';
      openAdminBuildBtn.hidden = true;
    }

    if (keepBuildingId) {
      selectedBuilding = (stateData.buildings || []).find((b) => b.id === keepBuildingId) || stateData.buildings?.[0] || null;
      selectedLandmark = null;
    } else if (!selectedBuilding && !selectedLandmark) {
      selectedBuilding = stateData.buildings?.[0] || null;
    } else if (selectedBuilding) {
      selectedBuilding = (stateData.buildings || []).find((b) => b.id === selectedBuilding.id) || stateData.buildings?.[0] || null;
    }

    renderStats();
    renderLandmarks();
    renderMapPins();

    if (selectedLandmark) {
      renderInspectorLandmark(selectedLandmark);
    } else {
      renderInspector(selectedBuilding);
    }

    renderLedgerList();
    renderTrades();
  } catch (err) {
    console.error(err);
  }
}

districtFilterBar?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-district]');
  if (!btn) return;
  activeDistrict = btn.dataset.district;
  districtFilterBar.querySelectorAll('.d-pill').forEach((b) => b.classList.toggle('active', b === btn));
  renderMapPins();
  renderLandmarks();
  renderLedgerList();

  switch (activeDistrict) {
    case 'all':
      fitIsland(true);
      break;
    case 'central':
      focusMap(48, 22, 1.55);
      break;
    case 'finance':
      focusMap(78, 30, 1.6);
      break;
    case 'media':
      focusMap(22, 38, 1.6);
      break;
    case 'plaza':
      focusMap(50, 60, 1.5);
      break;
    case 'underground':
      focusMap(50, 84, 1.6);
      break;
  }
});

function setLedgerFilter(mode) {
  ledgerFilter = mode;
  filterAllLotBtn?.classList.toggle('active', mode === 'all');
  filterSaleLotBtn?.classList.toggle('active', mode === 'sale');
  filterMineLotBtn?.classList.toggle('active', mode === 'mine');
  filterLandmarksBtn?.classList.toggle('active', mode === 'landmark');
  renderLedgerList();
}

filterAllLotBtn?.addEventListener('click', () => setLedgerFilter('all'));
filterSaleLotBtn?.addEventListener('click', () => setLedgerFilter('sale'));
filterMineLotBtn?.addEventListener('click', () => setLedgerFilter('mine'));
filterLandmarksBtn?.addEventListener('click', () => setLedgerFilter('landmark'));

oneidBtn?.addEventListener('click', () => {
  if (stateData.me) {
    setLedgerFilter('mine');
    const myFirst = (stateData.buildings || []).find((b) => isMine(b));
    if (myFirst) {
      selectBuilding(myFirst, true);
    }
    return;
  }
  startOneIdLogin();
});

closeBuyModalBtn?.addEventListener('click', () => { buyModal.hidden = true; });
closeSellModalBtn?.addEventListener('click', () => { sellModal.hidden = true; });
closeSellbackModalBtn?.addEventListener('click', () => { sellbackModal.hidden = true; });
closeManageModalBtn?.addEventListener('click', () => { manageModal.hidden = true; });
openAdminBuildBtn?.addEventListener('click', () => { adminBuildModal.hidden = false; });
closeAdminBuildModalBtn?.addEventListener('click', () => { adminBuildModal.hidden = true; });

sellForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = Number(sellBuildingId.value);
  const price = Number(sellPriceInput.value);
  const signboard = sellSignboardInput.value.trim();
  try {
    await api(`/api/buildings/${id}/market-sale`, {
      method: 'POST',
      body: { forSale: true, price, signboard },
    });
    sellModal.hidden = true;
    await loadOverview(id);
    alert(`🎉 [부동산 시장 매물 등록 완료]\n${formatWon(price)}에 매물로 등록되었습니다.\n다른 시민이 매수 시 매매 대금이 본인의 원뱅크 계좌로 즉시 100% 입금됩니다!`);
  } catch (err) {
    alert(err.message);
  }
});

sellbackConfirmBtn?.addEventListener('click', async () => {
  const id = Number(sellbackBuildingId.value);
  try {
    sellbackConfirmBtn.disabled = true;
    const res = await api(`/api/buildings/${id}/sellback`, { method: 'POST' });
    sellbackModal.hidden = true;
    if (res.newBalance !== undefined && stateData.me?.bank) {
      stateData.me.bank.balance = res.newBalance;
    }
    await loadOverview(id);
    alert(
      `🎉 [국가 즉시 환매 매각 완료]\n` +
      `소유권이 국유지로 반환되었으며, 환매 대금이 귀하의 원뱅크 통장으로 즉시 입금되었습니다!\n\n` +
      `• 수령 환매액: +${formatWon(res.refund || 0)}\n` +
      `• 현재 원뱅크 잔고: ${formatWon(res.newBalance || 0)}`
    );
  } catch (err) {
    alert(err.message);
  } finally {
    sellbackConfirmBtn.disabled = false;
  }
});

buyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = Number(document.getElementById('buyBuildingId').value);
  try {
    const res = await api(`/api/buildings/${id}/buy`, {
      method: 'POST',
      body: {
        coOwnerName: document.getElementById('buyCoOwnerInput').value.trim(),
        signboard: document.getElementById('buySignboardInput').value.trim(),
        setAsDomicile: document.getElementById('buySetDomicileCheck').checked,
      },
    });
    buyModal.hidden = true;
    if (res.newBalance !== undefined && stateData.me?.bank) {
      stateData.me.bank.balance = res.newBalance;
    }
    await loadOverview(id);
    alert(
      `🎉 [원뱅크 결제 및 소유권 등기 완료]\n` +
      `원뱅크 계좌에서 매매대금이 정상 출금되었습니다.\n` +
      `• 현재 잔고: ${formatWon(res.newBalance ?? 0)}\n\n` +
      (res.domicileUpdated
        ? '✅ 소유권 이전 등기 완료 및 통합 주민센터(CITIZEN PASS) 내 주민등록증 공식 주소지도 이 건물로 즉시 변경되었습니다!'
        : '✅ 소유권 이전 등기가 완료되었습니다!')
    );
  } catch (err) {
    alert(err.message);
  }
});

manageForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = Number(document.getElementById('manageBuildingId').value);
  try {
    await api(`/api/buildings/${id}/manage`, {
      method: 'PUT',
      body: {
        signboard: document.getElementById('manageSignboardInput').value.trim(),
        coOwnerName: document.getElementById('manageCoOwnerInput').value.trim(),
        price: Number(document.getElementById('managePriceInput').value),
        forSale: document.getElementById('manageForSaleCheck').checked,
        setAsDomicile: document.getElementById('manageSetDomicileCheck').checked,
      },
    });
    manageModal.hidden = true;
    await loadOverview(id);
  } catch (err) {
    alert(err.message);
  }
});

adminBuildForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api('/api/admin/buildings', {
      method: 'POST',
      body: {
        district: document.getElementById('adminDistrictSelect').value,
        icon: document.getElementById('adminIconSelect').value,
        name: document.getElementById('adminNameInput').value.trim(),
        address: document.getElementById('adminAddressInput').value.trim(),
        mapX: Number(document.getElementById('adminMapXInput').value),
        mapY: Number(document.getElementById('adminMapYInput').value),
        floors: Number(document.getElementById('adminFloorsInput').value),
        price: Number(document.getElementById('adminPriceInput').value),
        description: document.getElementById('adminDescInput').value.trim(),
      },
    });
    adminBuildForm.reset();
    adminBuildModal.hidden = true;
    await loadOverview(res.building?.id);
  } catch (err) {
    alert(err.message);
  }
});

(async function init() {
  initMapInteractions();
  try {
    const c = await fetch('/api/config');
    if (c.ok) cfg = await c.json();
  } catch {}
  await handleOneIdCallback();
  await loadOverview();
  setTimeout(() => fitIsland(false), 50);
})();

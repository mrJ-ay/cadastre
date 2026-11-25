const TOKEN_KEY = 'cadastre_oneid_token';
const VERIFIER_KEY = 'cadastre_oneid_verifier';
const STATE_KEY = 'cadastre_oneid_state';

let cfg = {
  oneidUrl: 'https://oneid-ruddy.vercel.app',
  citizenPassUrl: 'https://citizen-pass-beryl.vercel.app',
  agoraUrl: 'https://assembly-lovat.vercel.app',
  clientId: 'cadastre',
};

let token = localStorage.getItem(TOKEN_KEY) || '';
let stateData = {
  me: null,
  buildings: [],
  trades: [],
};
let activeDistrict = 'all';
let ledgerFilter = 'all'; // 'all' | 'sale' | 'mine'
let selectedBuilding = null;

// DOM
const oneidBtn = document.getElementById('oneidBtn');
const openAdminBuildBtn = document.getElementById('openAdminBuildBtn');
const districtFilterBar = document.getElementById('districtFilterBar');
const mapPinsLayer = document.getElementById('mapPinsLayer');
const inspectorPanel = document.getElementById('inspectorPanel');

const statTotalBuildings = document.getElementById('statTotalBuildings');
const statForSale = document.getElementById('statForSale');
const statOwned = document.getElementById('statOwned');
const statMyBuildings = document.getElementById('statMyBuildings');

const buildingListCount = document.getElementById('buildingListCount');
const buildingLedgerList = document.getElementById('buildingLedgerList');
const tradeHistoryList = document.getElementById('tradeHistoryList');
const filterAllLotBtn = document.getElementById('filterAllLotBtn');
const filterSaleLotBtn = document.getElementById('filterSaleLotBtn');
const filterMineLotBtn = document.getElementById('filterMineLotBtn');

const buyModal = document.getElementById('buyModal');
const closeBuyModalBtn = document.getElementById('closeBuyModalBtn');
const buyForm = document.getElementById('buyForm');

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

  statTotalBuildings.textContent = `${list.length}동`;
  statForSale.textContent = `${saleCnt}동`;
  statOwned.textContent = `${ownedCnt}동`;
  statMyBuildings.textContent = `${myCnt}동`;
}

function renderMapPins() {
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
    pinEl.addEventListener('click', () => {
      const id = Number(pinEl.dataset.pinId);
      const found = (stateData.buildings || []).find((x) => x.id === id);
      if (!found) return;
      selectedBuilding = found;
      renderMapPins();
      renderInspector(found);
    });
  });
}

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

    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
      ${
        b.forSale && !mine
          ? `<button type="button" class="btn gold full" id="inspectorBuyBtn">🏛️ 이 건물 매입 · 소유권 이전 등기 신청</button>`
          : ''
      }
      ${
        mine
          ? `<button type="button" class="btn emerald full" id="inspectorManageBtn">🔑 건물주 관리 (간판 변경 · 매물 등록 · 민증 주소지 반영)</button>`
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

  document.getElementById('inspectorBuyBtn')?.addEventListener('click', () => openBuyModal(b));
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
      if (!found) return;
      selectedBuilding = found;
      renderMapPins();
      renderInspector(found);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    } else if (!selectedBuilding) {
      selectedBuilding = stateData.buildings?.[0] || null;
    } else {
      selectedBuilding = (stateData.buildings || []).find((b) => b.id === selectedBuilding.id) || stateData.buildings?.[0] || null;
    }

    renderStats();
    renderMapPins();
    renderInspector(selectedBuilding);
    renderLedgerList();
    renderTrades();
  } catch (err) {
    console.error(err);
  }
}

districtFilterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-district]');
  if (!btn) return;
  activeDistrict = btn.dataset.district;
  districtFilterBar.querySelectorAll('.d-pill').forEach((b) => b.classList.toggle('active', b === btn));
  renderMapPins();
  renderLedgerList();
});

function setLedgerFilter(mode) {
  ledgerFilter = mode;
  filterAllLotBtn.classList.toggle('active', mode === 'all');
  filterSaleLotBtn.classList.toggle('active', mode === 'sale');
  filterMineLotBtn.classList.toggle('active', mode === 'mine');
  renderLedgerList();
}

filterAllLotBtn.addEventListener('click', () => setLedgerFilter('all'));
filterSaleLotBtn.addEventListener('click', () => setLedgerFilter('sale'));
filterMineLotBtn.addEventListener('click', () => setLedgerFilter('mine'));

oneidBtn.addEventListener('click', () => {
  if (stateData.me) {
    setLedgerFilter('mine');
    const myFirst = (stateData.buildings || []).find((b) => isMine(b));
    if (myFirst) {
      selectedBuilding = myFirst;
      renderMapPins();
      renderInspector(myFirst);
    }
    return;
  }
  startOneIdLogin();
});

closeBuyModalBtn.addEventListener('click', () => { buyModal.hidden = true; });
closeManageModalBtn.addEventListener('click', () => { manageModal.hidden = true; });
openAdminBuildBtn.addEventListener('click', () => { adminBuildModal.hidden = false; });
closeAdminBuildModalBtn.addEventListener('click', () => { adminBuildModal.hidden = true; });

buyForm.addEventListener('submit', async (e) => {
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
    await loadOverview(id);
    alert(
      res.domicileUpdated
        ? '🎉 소유권 이전 등기가 완료되었으며, 통합 주민센터(CITIZEN PASS) 내 주민등록증 주소지도 이 건물로 즉시 변경되었습니다!'
        : '🎉 소유권 이전 등기가 완료되었습니다!'
    );
  } catch (err) {
    alert(err.message);
  }
});

manageForm.addEventListener('submit', async (e) => {
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

adminBuildForm.addEventListener('submit', async (e) => {
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
  try {
    const c = await fetch('/api/config');
    if (c.ok) cfg = await c.json();
  } catch {}
  await handleOneIdCallback();
  await loadOverview();
})();

/* =========================================================
   CADASTRE — ATELIER J 도시 지적도 · 부동산 등기 및 건물 매매 거래소
   - 공공 랜드마크(의사당, 주민센터, 은행, 병원 등)는 비매물 도시 기준점으로만 표시
   - 실제 매매 대상은 100% 순수 가상 부동산(펜트하우스, 아파트, 오피스텔, 꼬마빌딩, 타운하우스, 상가, 지하 벙커 등)
   - CITIZEN PASS(통합 주민센터) 실시간 연동: 내 집 마련 시 주민등록 주소지 즉시 변경
   ========================================================= */
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3018);
const ONEID_URL = (process.env.ONEID_URL || 'https://oneid-ruddy.vercel.app').replace(/\/$/, '');
const CITIZEN_PASS_URL = (process.env.CITIZEN_PASS_URL || 'https://citizen-pass-beryl.vercel.app').replace(/\/$/, '');
const AGORA_URL = (process.env.AGORA_URL || 'https://assembly-lovat.vercel.app').replace(/\/$/, '');
const CLIENT_ID = process.env.ONEID_CLIENT_ID || 'cadastre';

let rawDbUrl = process.env.DATABASE_URL || '';
if (rawDbUrl.startsWith('postgresql+psycopg2://')) {
  rawDbUrl = rawDbUrl.replace('postgresql+psycopg2://', 'postgresql://');
} else if (rawDbUrl.startsWith('postgres://')) {
  rawDbUrl = rawDbUrl.replace('postgres://', 'postgresql://');
}

const pool = rawDbUrl
  ? new Pool({
      connectionString: rawDbUrl,
      ssl: { rejectUnauthorized: false },
    })
  : null;

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 순수 가상 부동산 매물 20동 (아파트, 펜트하우스, 오피스텔, 꼬마빌딩, 타운하우스, 상가, 지하벙커)
const SEED_BUILDINGS = [
  // 1. CENTRAL (중앙 행정·의사당구 — 최고급 주거지)
  {
    lot_no: 'CDS-101',
    name: '더 소버린 의사당 펜트하우스',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 의사당대로 77 (더 소버린 88층)',
    category: '하이엔드 펜트하우스',
    icon: '🏰',
    map_x: 48,
    map_y: 18,
    floors: 88,
    price: 950000000,
    for_sale: true,
    signboard: '중앙구 스카이라인 88층 로열 펜트하우스',
    site_url: null,
    desc: '도시 전체와 중앙공원이 한눈에 내려다보이는 88층 초고층 복층 펜트하우스. 전용 엘리베이터와 스카이 풀 완비.',
  },
  {
    lot_no: 'CDS-102',
    name: '캐피톨 힐 단독 대저택',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 영빈관길 24',
    category: '단독주택 · 대저택',
    icon: '🏡',
    map_x: 34,
    map_y: 24,
    floors: 3,
    price: 620000000,
    for_sale: true,
    signboard: '프라이빗 잔디 정원과 지하 와인셀러가 딸린 단독 저택',
    site_url: null,
    desc: '높은 담장과 보안 게이트로 둘러싸인 유럽풍 3층 단독 대저택.',
  },
  {
    lot_no: 'CDS-103',
    name: '센트럴 파크 자이 아파트 101동',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 공원로 101 (센트럴자이 로열층)',
    category: '대단지 아파트',
    icon: '🏢',
    map_x: 60,
    map_y: 26,
    floors: 35,
    price: 380000000,
    for_sale: true,
    signboard: '중앙공원 영구 조망권 45평형 브랜드 아파트',
    site_url: null,
    desc: '행정타운 도보 5분, 명문 학군과 공원 산책로를 품은 중앙구 대장 아파트.',
  },
  {
    lot_no: 'CDS-104',
    name: '레이크뷰 테라스 타운하우스',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 호수공원길 15',
    category: '타운하우스 · 빌라',
    icon: '🏘️',
    map_x: 42,
    map_y: 33,
    floors: 4,
    price: 290000000,
    for_sale: true,
    signboard: '야외 바비큐 테라스가 있는 호수공원 타운하우스',
    site_url: null,
    desc: '세대별 루프탑 정원이 제공되는 조용하고 쾌적한 고급 연립 타운하우스.',
  },

  // 2. FINANCE (넥서스 금융·비즈니스구 — 마천루 오피스 & 상업빌딩)
  {
    lot_no: 'CDS-201',
    name: '골드만 스퀘어 프라임 오피스 빌딩',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 테헤란로 1',
    category: '상업용 마천루 빌딩',
    icon: '🏙️',
    map_x: 78,
    map_y: 24,
    floors: 64,
    price: 880000000,
    for_sale: true,
    signboard: '금융가 중심 64층 유리 커튼월 오피스 타워',
    site_url: null,
    desc: '수많은 금융사와 법인들이 입주해 안정적인 임대 수익이 나오는 64층 대형 오피스 빌딩.',
  },
  {
    lot_no: 'CDS-202',
    name: '월스트리트 시그니처 복층 오피스텔',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 금융중앙로 50',
    category: '역세권 오피스텔',
    icon: '🏢',
    map_x: 86,
    map_y: 38,
    floors: 42,
    price: 240000000,
    for_sale: true,
    signboard: '금융가 직장인·트레이더 전용 호텔식 풀옵션 오피스텔',
    site_url: null,
    desc: '조식 서비스와 피트니스 라운지가 포함된 초역세권 하이엔드 오피스텔.',
  },
  {
    lot_no: 'CDS-203',
    name: '파이낸셜 리버뷰 주상복합 타워',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 강변금융로 88',
    category: '한강뷰 주상복합',
    icon: '🌆',
    map_x: 72,
    map_y: 44,
    floors: 55,
    price: 540000000,
    for_sale: true,
    signboard: '파노라마 리버뷰 55층 주상복합 레지던스',
    site_url: null,
    desc: '거실 통창으로 아텔리에 강변 야경이 펼쳐지는 55층 럭셔리 주상복합.',
  },
  {
    lot_no: 'CDS-204',
    name: '금융사거리 코너 7층 꼬마빌딩',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 역세권로 18',
    category: '수익형 꼬마빌딩 · 상가',
    icon: '🏬',
    map_x: 84,
    map_y: 16,
    floors: 7,
    price: 410000000,
    for_sale: true,
    signboard: '1층 프랜차이즈 카페 입점 · 공실률 0% 알짜 꼬마빌딩',
    site_url: null,
    desc: '유동인구가 끊이지 않는 금융가 삼거리 코너 자리에 위치한 7층 상업용 꼬마빌딩.',
  },

  // 3. MEDIA (펄스 미디어·창작밸리 — 스튜디오 & 로프트)
  {
    lot_no: 'CDS-301',
    name: '크리에이터 스카이 로프트 하우스',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 스트림로 21',
    category: '방송·작업용 로프트',
    icon: '🎙️',
    map_x: 20,
    map_y: 30,
    floors: 24,
    price: 310000000,
    for_sale: true,
    signboard: '전 세대 이중 방음 부스 & 기가 광랜 완비 로프트',
    site_url: null,
    desc: '스트리머와 뮤지션들이 밤새 방송하고 음악 작업을 해도 층간소음 걱정이 없는 특화 주거지.',
  },
  {
    lot_no: 'CDS-302',
    name: '아티스트 브릭 하우스 & 갤러리 카페',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 예술가길 12',
    category: '상가주택 · 작업실',
    icon: '🧱',
    map_x: 13,
    map_y: 20,
    floors: 4,
    price: 230000000,
    for_sale: true,
    signboard: '1층 전시 카페 + 2~4층 복층 주거 겸용 붉은 벽돌집',
    site_url: null,
    desc: '감성적인 붉은 벽돌 외관에 1층은 카페, 위층은 살림집으로 쓰는 인기 상가주택.',
  },
  {
    lot_no: 'CDS-303',
    name: '선셋 루프탑 풀빌라 레지던스',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 강변노을길 7',
    category: '고급 풀빌라',
    icon: '🌅',
    map_x: 26,
    map_y: 44,
    floors: 5,
    price: 460000000,
    for_sale: true,
    signboard: '루프탑 온수 인피니티 풀이 있는 프라이빗 풀빌라',
    site_url: null,
    desc: '파티와 휴양을 동시에 즐길 수 있는 강변 뷰 프라이빗 풀빌라.',
  },
  {
    lot_no: 'CDS-304',
    name: '미디어밸리 청년 스마트 스튜디오',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 창작로 88',
    category: '소형 오피스텔 · 원룸',
    icon: '🏠',
    map_x: 12,
    map_y: 52,
    floors: 15,
    price: 95000000,
    for_sale: true,
    signboard: '사회초년생·1인 창작자 첫 내 집 마련 가성비 오피스텔',
    site_url: null,
    desc: '합리적인 가격으로 첫 부동산 등기를 시작하기 좋은 깔끔한 신축 스마트 원룸 오피스텔.',
  },

  // 4. PLAZA (피그스티 광장·번화가 — 아파트 단지 & 핵심 상권)
  {
    lot_no: 'CDS-401',
    name: '광장역 더샵 센트럴시티 아파트',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 번화가중앙로 100',
    category: '초역세권 아파트',
    icon: '🏙️',
    map_x: 49,
    map_y: 54,
    floors: 49,
    price: 340000000,
    for_sale: true,
    signboard: '광장역 지하 직결 · 커플 신혼집 선호도 1위 49층 아파트',
    site_url: null,
    desc: '백화점, 대학병원, 광장 상권이 전부 슬리퍼 생활권인 3,000세대 랜드마크 아파트.',
  },
  {
    lot_no: 'CDS-402',
    name: '번화가 1번지 먹자골목 5층 상가빌딩',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 젊음의거리 24',
    category: '핵심상권 상가빌딩',
    icon: '🍻',
    map_x: 38,
    map_y: 64,
    floors: 5,
    price: 390000000,
    for_sale: true,
    signboard: '24시간 불이 꺼지지 않는 번화가 메인 스트리트 통건물',
    site_url: null,
    desc: '1~5층 전체에 맛집과 펍, PC방이 성업 중인 광장구 최고 핫플레이스 상가 건물.',
  },
  {
    lot_no: 'CDS-403',
    name: '아레나 파크뷰 신축 빌라트',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 스타디움길 55',
    category: '신축 고급빌라',
    icon: '🏘️',
    map_x: 62,
    map_y: 63,
    floors: 6,
    price: 155000000,
    for_sale: true,
    signboard: '엘리베이터 · 자주식 주차 100% 완비 쓰리룸 신축 빌라',
    site_url: null,
    desc: '넓은 실평수와 깔끔한 모던 인테리어를 자랑하는 실거주 만족도 최고 신축 빌라.',
  },
  {
    lot_no: 'CDS-404',
    name: '메디컬 타운 약국·클리닉 복합상가',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 대학병원앞길 119',
    category: '메디컬 상업빌딩',
    icon: '🏪',
    map_x: 32,
    map_y: 48,
    floors: 9,
    price: 320000000,
    for_sale: true,
    signboard: '대학병원 정문 앞 독점 1층 대형 약국 & 전문 클리닉 빌딩',
    site_url: null,
    desc: '종합병원 바로 맞은편에 위치해 평생 안정적인 수요가 보장되는 메디컬 상가 빌딩.',
  },

  // 5. UNDERGROUND (언더그라운드·제한구역 — 벙커 & 야시장 & 로프트)
  {
    lot_no: 'CDS-501',
    name: '심연 방공호 럭셔리 지하 벙커 하우스',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 제0구역 심연로 B301',
    category: '특수 방공호 · 비밀아지트',
    icon: '🛡️',
    map_x: 24,
    map_y: 82,
    floors: 3,
    price: 280000000,
    for_sale: true,
    signboard: '핵방호 등급 강철 도어 & 자가발전기가 설치된 지하 펜트하우스',
    site_url: null,
    desc: '어떠한 외부 추적이나 재난에도 완벽히 격리되는 최고급 지하 비밀 아지트.',
  },
  {
    lot_no: 'CDS-502',
    name: '네온 디스트릭트 부티크 호텔',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 네온대로 707',
    category: '숙박시설 · 부티크 호텔',
    icon: '🏨',
    map_x: 76,
    map_y: 80,
    floors: 18,
    price: 510000000,
    for_sale: true,
    signboard: '사이버펑크 네온 라운지 바 & VIP 스위트룸 호텔',
    site_url: null,
    desc: '화려한 네온 조명으로 꾸며진 지하특구 최대 규모의 프라이빗 부티크 호텔.',
  },
  {
    lot_no: 'CDS-503',
    name: '올드타운 재개발 구역 다세대 주택',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 구시가지길 44',
    category: '재개발 투자용 빌라',
    icon: '🏚️',
    map_x: 48,
    map_y: 86,
    floors: 4,
    price: 68000000,
    for_sale: true,
    signboard: '향후 뉴타운 재개발 지정 1순위 대지지분 넓은 구옥 빌라',
    site_url: null,
    desc: '소액으로 매입해 미래 재개발 시세 차익을 노릴 수 있는 구시가지 통빌라.',
  },
  {
    lot_no: 'CDS-504',
    name: '인더스트리얼 컨테이너 개조 로프트',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 폐항만로 19',
    category: '인더스트리얼 하우스',
    icon: '🏗️',
    map_x: 62,
    map_y: 84,
    floors: 3,
    price: 82000000,
    for_sale: true,
    signboard: '해커·언더그라운드 크루들의 감성 창고형 로프트 하우스',
    site_url: null,
    desc: '높은 층고와 철제 인더스트리얼 인테리어로 개조된 개성 넘치는 창고형 주택.',
  },
];

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cadastre_buildings (
      id SERIAL PRIMARY KEY,
      lot_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      district_ko TEXT NOT NULL,
      address TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🏢',
      map_x INT NOT NULL DEFAULT 50,
      map_y INT NOT NULL DEFAULT 50,
      floors INT NOT NULL DEFAULT 10,
      price BIGINT NOT NULL DEFAULT 100000000,
      owner_user_id TEXT,
      owner_name TEXT NOT NULL DEFAULT '국유지 (미분양)',
      co_owner_name TEXT,
      for_sale BOOLEAN NOT NULL DEFAULT TRUE,
      signboard TEXT NOT NULL DEFAULT '',
      site_url TEXT,
      description TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cadastre_trades (
      id SERIAL PRIMARY KEY,
      lot_no TEXT NOT NULL,
      building_name TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      co_owner_name TEXT,
      seller_name TEXT NOT NULL,
      price BIGINT NOT NULL,
      traded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 기존 웹사이트 판매형 시드 데이터를 순수 가상 부동산 매물로 자동 업그레이드(마이그레이션)
  for (const b of SEED_BUILDINGS) {
    await pool.query(
      `INSERT INTO cadastre_buildings
         (lot_no, name, district, district_ko, address, category, icon, map_x, map_y, floors, price, for_sale, signboard, site_url, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (lot_no) DO UPDATE
         SET name = EXCLUDED.name,
             district = EXCLUDED.district,
             district_ko = EXCLUDED.district_ko,
             address = EXCLUDED.address,
             category = EXCLUDED.category,
             icon = EXCLUDED.icon,
             map_x = EXCLUDED.map_x,
             map_y = EXCLUDED.map_y,
             floors = EXCLUDED.floors,
             site_url = NULL,
             description = EXCLUDED.description,
             signboard = CASE
               WHEN cadastre_buildings.owner_user_id IS NULL THEN EXCLUDED.signboard
               ELSE cadastre_buildings.signboard
             END`,
      [
        b.lot_no,
        b.name,
        b.district,
        b.district_ko,
        b.address,
        b.category,
        b.icon,
        b.map_x,
        b.map_y,
        b.floors,
        b.price,
        b.for_sale,
        b.signboard,
        b.site_url,
        b.desc,
      ]
    );
  }

  const validLots = SEED_BUILDINGS.map((b) => b.lot_no);
  await pool.query(
    `DELETE FROM cadastre_buildings WHERE NOT (lot_no = ANY($1)) AND owner_user_id IS NULL`,
    [validLots]
  );
}

let dbInitialized = false;
let dbInitPromise = null;
async function ensureDb() {
  if (dbInitialized || !pool) return;
  if (!dbInitPromise) {
    dbInitPromise = initDb()
      .then(() => {
        dbInitialized = true;
      })
      .catch((err) => {
        dbInitPromise = null;
        console.error('DB init error:', err.message);
      });
  }
  await dbInitPromise;
}

app.use('/api', async (_req, _res, next) => {
  await ensureDb();
  next();
});

async function verifyOneIdUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  try {
    const res = await fetch(`${ONEID_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      id: String(u.id),
      username: u.username,
      nickname: u.nickname || u.username,
      isAdmin: Boolean(u.is_admin),
      token,
    };
  } catch {
    return null;
  }
}

function serializeBuilding(row) {
  return {
    id: row.id,
    lotNo: row.lot_no,
    name: row.name,
    district: row.district,
    districtKo: row.district_ko,
    address: row.address,
    category: row.category,
    icon: row.icon,
    mapX: row.map_x,
    mapY: row.map_y,
    floors: row.floors,
    price: Number(row.price),
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    coOwnerName: row.co_owner_name || null,
    forSale: row.for_sale,
    signboard: row.signboard,
    siteUrl: row.site_url || null,
    description: row.description,
    updatedAt: row.updated_at,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'cadastre', dbConnected: Boolean(pool) });
});

app.get('/api/config', (_req, res) => {
  res.json({
    oneidUrl: ONEID_URL,
    citizenPassUrl: CITIZEN_PASS_URL,
    agoraUrl: AGORA_URL,
    clientId: CLIENT_ID,
  });
});

app.get('/api/overview', async (req, res) => {
  if (!pool) return res.status(500).json({ error: 'DATABASE_URL not configured' });
  const user = await verifyOneIdUser(req);

  try {
    const { rows: bRows } = await pool.query(
      'SELECT * FROM cadastre_buildings ORDER BY lot_no ASC'
    );
    const buildings = bRows.map(serializeBuilding);

    const { rows: tRows } = await pool.query(
      'SELECT * FROM cadastre_trades ORDER BY traded_at DESC LIMIT 20'
    );
    const trades = tRows.map((t) => ({
      id: t.id,
      lotNo: t.lot_no,
      buildingName: t.building_name,
      buyerName: t.buyer_name,
      coOwnerName: t.co_owner_name,
      sellerName: t.seller_name,
      price: Number(t.price),
      tradedAt: t.traded_at,
    }));

    let myPartnerName = null;
    if (user) {
      try {
        const { rows: cpRows } = await pool.query(
          `SELECT partner_a_name, partner_b_name, partner_a_user_id
           FROM couple_certificates
           WHERE status = 'active'
             AND (partner_a_user_id = $1 OR partner_b_user_id = $1 OR LOWER(partner_a_name) = LOWER($2) OR LOWER(partner_b_name) = LOWER($2))
           ORDER BY issued_at DESC LIMIT 1`,
          [user.id, user.nickname]
        );
        if (cpRows[0]) {
          myPartnerName =
            cpRows[0].partner_a_user_id === user.id ||
            cpRows[0].partner_a_name.toLowerCase() === user.nickname.toLowerCase()
              ? cpRows[0].partner_b_name
              : cpRows[0].partner_a_name;
        }
      } catch {}
    }

    res.json({
      me: user ? { ...user, partnerName: myPartnerName } : null,
      buildings,
      trades,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 건물 매입 (분양 또는 매수) + 선택 시 주민등록증(citizen_cards) 주소지 자동 변경!
app.post('/api/buildings/:id/buy', async (req, res) => {
  const user = await verifyOneIdUser(req);
  if (!user) return res.status(401).json({ error: '부동산을 매입·등기하려면 ONEID 로그인이 필요합니다.' });

  const id = Number(req.params.id);
  const coOwnerName = String(req.body?.coOwnerName || '').trim().slice(0, 24) || null;
  const customSignboard = String(req.body?.signboard || '').trim().slice(0, 60);
  const setAsDomicile = Boolean(req.body?.setAsDomicile);

  try {
    const { rows } = await pool.query('SELECT * FROM cadastre_buildings WHERE id = $1', [id]);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: '해당 필지·건물을 찾을 수 없습니다.' });
    if (!b.for_sale && b.owner_user_id !== user.id && !user.isAdmin) {
      return res.status(400).json({ error: '현재 매물로 나와 있지 않은 사유지 건물입니다.' });
    }

    const prevOwner = b.owner_name || '국유지 (미분양)';
    const nextSignboard = customSignboard || b.signboard;

    const { rows: updated } = await pool.query(
      `UPDATE cadastre_buildings
       SET owner_user_id = $1,
           owner_name = $2,
           co_owner_name = $3,
           for_sale = FALSE,
           signboard = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [user.id, user.nickname, coOwnerName, nextSignboard, id]
    );

    await pool.query(
      `INSERT INTO cadastre_trades (lot_no, building_name, buyer_name, co_owner_name, seller_name, price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [b.lot_no, b.name, user.nickname, coOwnerName, prevOwner, b.price]
    );

    if (setAsDomicile) {
      try {
        await pool.query(
          `UPDATE citizen_cards
           SET domicile = $1, updated_at = NOW()
           WHERE user_id = $2`,
          [`${b.address} (${b.name})`, user.id]
        );
      } catch {}
    }

    res.json({
      ok: true,
      building: serializeBuilding(updated[0]),
      domicileUpdated: setAsDomicile,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 건물주 관리
app.put('/api/buildings/:id/manage', async (req, res) => {
  const user = await verifyOneIdUser(req);
  if (!user) return res.status(401).json({ error: 'ONEID 로그인이 필요합니다.' });

  const id = Number(req.params.id);
  try {
    const { rows } = await pool.query('SELECT * FROM cadastre_buildings WHERE id = $1', [id]);
    const b = rows[0];
    if (!b) return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });

    const isOwner =
      user.isAdmin ||
      b.owner_user_id === user.id ||
      (b.co_owner_name && b.co_owner_name.toLowerCase() === user.nickname.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ error: '해당 건물의 소유주(또는 공동명의자)만 설정할 수 있습니다.' });
    }

    const signboard = String(req.body?.signboard ?? b.signboard).trim().slice(0, 60);
    const coOwnerName =
      req.body?.coOwnerName !== undefined
        ? String(req.body.coOwnerName || '').trim().slice(0, 24) || null
        : b.co_owner_name;
    const forSale = req.body?.forSale !== undefined ? Boolean(req.body.forSale) : b.for_sale;
    const rawPrice = Number(req.body?.price);
    const price = Number.isFinite(rawPrice) && rawPrice >= 1000000 ? Math.floor(rawPrice) : Number(b.price);
    const setAsDomicile = Boolean(req.body?.setAsDomicile);

    const { rows: updated } = await pool.query(
      `UPDATE cadastre_buildings
       SET signboard = $1,
           co_owner_name = $2,
           for_sale = $3,
           price = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [signboard, coOwnerName, forSale, price, id]
    );

    if (setAsDomicile) {
      try {
        await pool.query(
          `UPDATE citizen_cards
           SET domicile = $1, updated_at = NOW()
           WHERE user_id = $2`,
          [`${b.address} (${b.name})`, user.id]
        );
      } catch {}
    }

    res.json({ ok: true, building: serializeBuilding(updated[0]) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 총괄관리자(국토교통부장관) 전용: 신규 건물 건축 및 국유화
app.post('/api/admin/buildings', async (req, res) => {
  const user = await verifyOneIdUser(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: '총괄관리자(국토교통부장관)만 신규 건축 허가를 내릴 수 있습니다.' });
  }

  const DISTRICT_MAP = {
    central: '중앙 행정·의사당구',
    finance: '넥서스 금융·비즈니스구',
    media: '펄스 미디어·창작밸리',
    plaza: '피그스티 광장·번화가',
    underground: '언더그라운드·제한구역',
  };

  const district = DISTRICT_MAP[req.body?.district] ? req.body.district : 'central';
  const districtKo = DISTRICT_MAP[district];
  const name = String(req.body?.name || '').trim().slice(0, 40);
  const address = String(req.body?.address || '').trim().slice(0, 80) || `아텔리에 제1특별시 ${districtKo}`;
  const category = String(req.body?.category || '상업·주거 복합빌딩').trim().slice(0, 30);
  const icon = String(req.body?.icon || '🏢').trim().slice(0, 4) || '🏢';
  const mapX = Math.max(8, Math.min(92, Number(req.body?.mapX) || 50));
  const mapY = Math.max(10, Math.min(90, Number(req.body?.mapY) || 50));
  const floors = Math.max(1, Math.min(200, Number(req.body?.floors) || 20));
  const price = Math.max(1000000, Number(req.body?.price) || 200000000);
  const signboard = String(req.body?.signboard || `${name} 신규 분양`).trim().slice(0, 60);
  const description = String(req.body?.description || `${districtKo}에 신축된 랜드마크 빌딩.`).trim().slice(0, 200);

  if (!name) return res.status(400).json({ error: '건물명을 입력해 주세요.' });

  try {
    const { rows: cntRows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM cadastre_buildings');
    const lotNo = `CDS-${600 + (cntRows[0]?.cnt || 0) + 1}`;
    const { rows } = await pool.query(
      `INSERT INTO cadastre_buildings
         (lot_no, name, district, district_ko, address, category, icon, map_x, map_y, floors, price, for_sale, signboard, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,$12,$13)
       RETURNING *`,
      [lotNo, name, district, districtKo, address, category, icon, mapX, mapY, floors, price, signboard, description]
    );
    res.status(201).json({ ok: true, building: serializeBuilding(rows[0]) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/buildings/:id/nationalize', async (req, res) => {
  const user = await verifyOneIdUser(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: '총괄관리자만 국유화(강제 수용)를 집행할 수 있습니다.' });
  }
  const id = Number(req.params.id);
  try {
    await pool.query(
      `UPDATE cadastre_buildings
       SET owner_user_id = NULL,
           owner_name = '국유지 (미분양)',
           co_owner_name = NULL,
           for_sale = TRUE,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🗺️ CADASTRE listening on http://localhost:${PORT}`);
  });
}

export default app;

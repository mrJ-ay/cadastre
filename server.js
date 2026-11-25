/* =========================================================
   CADASTRE — ATELIER J 도시 지적도 · 부동산 등기 및 건물 매매 거래소
   - 아텔리에 시티 5대 행정구역 인터랙티브 도시 지도 (24개 랜드마크 및 매입 가능 건물)
   - 미분양(국유지) 분양 · 유저 간 매물 매수/매도 · 커플 공동명의 등기 · 건물 간판 커스텀
   - CITIZEN PASS(통합 주민센터) 실시간 연동: 건물 매입 및 주민등록 주소지 즉시 변경
   - 총괄관리자(국토교통부장관): 신규 건물 건설(지도 좌표 지정), 강제 수용(국유화), 시세 조정
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

// 초기 아텔리에 시티 5대 행정구역 20개 건물/랜드마크 시드 데이터
const SEED_BUILDINGS = [
  // 1. CENTRAL (중앙 행정·의사당구)
  {
    lot_no: 'CDS-101',
    name: 'AGORA 국회의사당',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 의사당로 1',
    category: '국가기관 · 랜드마크',
    icon: '🏛️',
    map_x: 48,
    map_y: 22,
    floors: 12,
    price: 950000000,
    for_sale: true,
    signboard: '가상 국민의회 · 300석 입법의 전당',
    site_url: 'https://assembly-lovat.vercel.app',
    desc: '아텔리에 공화국 300석 의회가 열리는 상징적 의사당 본관. 매입 시 국회의사당 명예 건물주 권한 부여.',
  },
  {
    lot_no: 'CDS-102',
    name: 'CITIZEN PASS 통합주민센터',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 행정청사로 10',
    category: '국가기관 · 행정청',
    icon: '🪪',
    map_x: 34,
    map_y: 28,
    floors: 8,
    price: 620000000,
    for_sale: true,
    signboard: '주민등록증 · 커플인증서 발급 본청',
    site_url: 'https://citizen-pass-beryl.vercel.app',
    desc: '전 시민의 주민등록증과 커플 등기필증을 관할하는 통합 행정복지센터 청사.',
  },
  {
    lot_no: 'CDS-103',
    name: '더 소버린 의사당 펜트하우스',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 의사당로 77 (더 소버린 88층)',
    category: '최고급 주거 · 펜트하우스',
    icon: '🏰',
    map_x: 61,
    map_y: 26,
    floors: 88,
    price: 480000000,
    for_sale: true,
    signboard: '중앙구 스카이라인 최고층 로열 펜트하우스',
    site_url: null,
    desc: '국회의사당과 중앙공원이 한눈에 내려다보이는 88층 초고층 하이엔드 레지던스.',
  },
  {
    lot_no: 'CDS-104',
    name: '캐피톨 힐 외교관 타운하우스',
    district: 'central',
    district_ko: '중앙 행정·의사당구',
    address: '아텔리에 제1특별시 중앙구 영빈관길 24',
    category: '고급 주택 · 타운하우스',
    icon: '🏡',
    map_x: 42,
    map_y: 14,
    floors: 4,
    price: 210000000,
    for_sale: true,
    signboard: '프라이빗 정원이 딸린 단독 저택',
    site_url: null,
    desc: '정당 대표와 고위 인사들이 선호하는 조용하고 삼엄한 보안의 단독 저택.',
  },

  // 2. FINANCE (넥서스 금융·비즈니스구)
  {
    lot_no: 'CDS-201',
    name: 'ONE BANK 중앙은행 타워',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 원뱅크대로 1',
    category: '금융 랜드마크 · 본점',
    icon: '🏦',
    map_x: 78,
    map_y: 30,
    floors: 64,
    price: 880000000,
    for_sale: true,
    signboard: '777 계좌 & 복리 파킹통장 금융 허브',
    site_url: 'https://one-bank-lm2p.onrender.com',
    desc: '아텔리에 모든 화폐와 계좌 이체를 관장하는 64층 유리 마천루 은행 본점.',
  },
  {
    lot_no: 'CDS-202',
    name: 'NEXUS 증권거래소 파이낸셜 센터',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 넥서스광장 50',
    category: '금융 랜드마크 · 거래소',
    icon: '📈',
    map_x: 86,
    map_y: 44,
    floors: 72,
    price: 920000000,
    for_sale: true,
    signboard: '24시간 실시간 시세 전광판 마천루',
    site_url: 'https://nexus-exchange-l9i8.onrender.com',
    desc: '실시간 캔들 차트와 IPO 상장이 이뤄지는 아텔리에 자본시장의 심장.',
  },
  {
    lot_no: 'CDS-203',
    name: 'JARKET 트레이드 몰 & 오피스',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 마켓로 18',
    category: '상업빌딩 · 복합쇼핑몰',
    icon: '🛍️',
    map_x: 72,
    map_y: 48,
    floors: 22,
    price: 340000000,
    for_sale: true,
    signboard: 'C2C 중고거래 & 상업 무역 센터',
    site_url: 'https://jarket.onrender.com',
    desc: '수많은 상인과 시민들이 물품을 거래하는 초대형 복합 상업 빌딩.',
  },
  {
    lot_no: 'CDS-204',
    name: '월스트리트 시그니처 오피스텔',
    district: 'finance',
    district_ko: '넥서스 금융·비즈니스구',
    address: '아텔리에 제1특별시 금융구 테헤란로 105',
    category: '주거 · 역세권 오피스텔',
    icon: '🏢',
    map_x: 84,
    map_y: 20,
    floors: 38,
    price: 165000000,
    for_sale: true,
    signboard: '금융인·트레이더 전용 풀옵션 복층 오피스텔',
    site_url: null,
    desc: '증권거래소 도보 3분 거리에 위치한 직주근접 최고 인기 오피스텔.',
  },

  // 3. MEDIA (펄스 미디어·창작밸리)
  {
    lot_no: 'CDS-301',
    name: 'PULSE 브로드캐스팅 타워',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 스트림로 1',
    category: '방송국 · 미디어 랜드마크',
    icon: '📡',
    map_x: 20,
    map_y: 36,
    floors: 45,
    price: 590000000,
    for_sale: true,
    signboard: '실시간 라이브 스트리밍 & BJ 스튜디오 본사',
    site_url: 'https://pulse-2g12.onrender.com',
    desc: '수많은 스트리머들의 실시간 방송과 무수수료 후원이 중계되는 방송국 타워.',
  },
  {
    lot_no: 'CDS-302',
    name: 'FAKEPRESS 중앙언론회관',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 프레스로 12',
    category: '언론사 · 인쇄조판국',
    icon: '📰',
    map_x: 13,
    map_y: 22,
    floors: 18,
    price: 380000000,
    for_sale: true,
    signboard: '특종 호외 발행 · 아텔리에 중앙 일간지 사옥',
    site_url: 'https://fakepress-1.onrender.com',
    desc: '도시의 모든 뉴스와 호외 신문이 실시간 조판·인쇄되어 나오는 언론사 본관.',
  },
  {
    lot_no: 'CDS-303',
    name: 'INKVOID 국립문학도서관',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 서재길 33',
    category: '문화시설 · 웹소설 서재',
    icon: '📚',
    map_x: 26,
    map_y: 50,
    floors: 10,
    price: 310000000,
    for_sale: true,
    signboard: '작가들의 웹소설 집필실 & 아카이브 서재',
    site_url: 'https://inkvoid-eoqx.onrender.com',
    desc: '수많은 웹소설 작품들이 연재되고 보관되는 고풍스러운 아치형 대도서관.',
  },
  {
    lot_no: 'CDS-304',
    name: 'SONORA & MY BAND 레코딩 홀',
    district: 'media',
    district_ko: '펄스 미디어·창작밸리',
    address: '아텔리에 제1특별시 미디어구 사운드로 88',
    category: '공연장 · DAW 스튜디오',
    icon: '🎹',
    map_x: 12,
    map_y: 56,
    floors: 14,
    price: 270000000,
    for_sale: true,
    signboard: '브라우저 작곡 & 오케스트라 합주 콘서트홀',
    site_url: 'https://sonora-daw.onrender.com',
    desc: '작곡가와 가상 합주단이 24시간 음악을 제작하고 연주하는 방음 스튜디오 빌딩.',
  },

  // 4. PLAZA (피그스티 광장·번화가)
  {
    lot_no: 'CDS-401',
    name: 'PIGSTY 커뮤니티 그랜드 플라자',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 피그스티중앙로 1',
    category: '커뮤니티 랜드마크 · 광장',
    icon: '🐷',
    map_x: 49,
    map_y: 55,
    floors: 30,
    price: 750000000,
    for_sale: true,
    signboard: '전체 갤러리 & 개념글 광장 본관 (검열봇 가동중)',
    site_url: 'https://pigsty.onrender.com',
    desc: '아텔리에 최대 유동인구가 모이는 메이저/마이너 갤러리 복합 커뮤니티 타워.',
  },
  {
    lot_no: 'CDS-402',
    name: 'DISPATCH 텔레콤 타워',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 메신저로 42',
    category: '통신시설 · 메신저 본사',
    icon: '💬',
    map_x: 38,
    map_y: 66,
    floors: 40,
    price: 430000000,
    for_sale: true,
    signboard: '초고속 실시간 채팅 & 파일 전송 통신국',
    site_url: 'https://dispatch-z3rj.onrender.com',
    desc: '시민들의 실시간 메신저 대화방과 파일 송수신을 중계하는 전파 송신 타워.',
  },
  {
    lot_no: 'CDS-403',
    name: 'KEYWAR 콜로세움 아레나',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 투기장로 99',
    category: '경기장 · 1:1 키배 스타디움',
    icon: '⚔️',
    map_x: 62,
    map_y: 65,
    floors: 8,
    price: 390000000,
    for_sale: true,
    signboard: '3초 카운트다운 무규칙 1:1 랜덤 키배 경기장',
    site_url: 'https://keywar-96xe.onrender.com',
    desc: '밤낮으로 1:1 키보드 배틀이 벌어지는 원형 돔 스타디움.',
  },
  {
    lot_no: 'CDS-404',
    name: 'LIVO 중앙대학병원 & 응급의료센터',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 생명으로 119',
    category: '의료기관 · 24시 응급센터',
    icon: '🏥',
    map_x: 32,
    map_y: 44,
    floors: 20,
    price: 410000000,
    for_sale: true,
    signboard: '24시간 응급실 · 병의원 위치 관제 병원',
    site_url: 'https://livo-self.vercel.app',
    desc: '키배로 다친 시민들의 멘탈과 건강을 책임지는 아텔리에 최대 종합병원.',
  },
  {
    lot_no: 'CDS-405',
    name: '센트럴 파크 뷰 주상복합 아파트',
    district: 'plaza',
    district_ko: '피그스티 광장·번화가',
    address: '아텔리에 제1특별시 광장구 번화가길 101동',
    category: '주거 · 신축 브랜드 아파트',
    icon: '🏙️',
    map_x: 52,
    map_y: 74,
    floors: 49,
    price: 120000000,
    for_sale: true,
    signboard: '신혼·커플 공동명의 1순위 대단지 아파트',
    site_url: null,
    desc: '피그스티 광장과 병원, 마켓이 모두 도보권인 살기 좋은 49층 주상복합 아파트.',
  },

  // 5. UNDERGROUND (언더그라운드·제한구역)
  {
    lot_no: 'CDS-501',
    name: 'PIGSTY // DARK 심연 지하벙커',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 제0구역 심연로 B104',
    category: '제한구역 · 무검열 아지트',
    icon: '🕶️',
    map_x: 22,
    map_y: 82,
    floors: 6,
    price: 520000000,
    for_sale: true,
    signboard: '검열봇 절대 출입금지 · 다크 피그스티 본진',
    site_url: 'https://pigsty-dark.onrender.com',
    desc: '일반 피그스티에서 검열당한 게시글과 요원들이 강제 이송되어 모이는 지하 요새.',
  },
  {
    lot_no: 'CDS-502',
    name: 'NEON STRIP 카지노 & 리조트 호텔',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 네온대로 777',
    category: '카지노 호텔 · 유흥특구',
    icon: '🎰',
    map_x: 78,
    map_y: 80,
    floors: 55,
    price: 680000000,
    for_sale: true,
    signboard: '24시간 잭팟 슬롯 & VIP 칩 대출 호텔',
    site_url: 'https://vegas-slots-2izy.onrender.com',
    desc: '화려한 네온사인 아래 일확천금의 슬롯머신이 돌아가는 초대형 카지노 리조트.',
  },
  {
    lot_no: 'CDS-503',
    name: 'DODGE TOTO 지하 피구 투기장',
    district: 'underground',
    district_ko: '언더그라운드·제한구역',
    address: '아텔리에 지하특구 배당로 365',
    category: '투기장 · 승부예측 센터',
    icon: '🏐',
    map_x: 48,
    map_y: 88,
    floors: 5,
    price: 290000000,
    for_sale: true,
    signboard: '실시간 60FPS AI 피구 리그 & 배당 거래소',
    site_url: 'https://dodge-toto.onrender.com',
    desc: '언더그라운드 승부사들이 모여 실시간 피구 경기에 베팅하는 비밀 경기장.',
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

  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM cadastre_buildings');
  if ((rows[0]?.cnt || 0) === 0) {
    for (const b of SEED_BUILDINGS) {
      await pool.query(
        `INSERT INTO cadastre_buildings
           (lot_no, name, district, district_ko, address, category, icon, map_x, map_y, floors, price, for_sale, signboard, site_url, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (lot_no) DO NOTHING`,
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
  }
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

    // 로그인 유저의 커플 파트너 이름 조회 (공동명의 자동 제안용)
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

    // 주민등록증(citizen_cards) 주소지 자동 연동
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

// 건물주 관리: 간판 변경, 매물 내놓기(호가 설정), 내 주민등록 주소지로 즉시 반영
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

// 총괄관리자(국토교통부장관) 전용: 신규 건물 건축(지도에 새 필지 추가) 및 국유화(강제 수용)
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

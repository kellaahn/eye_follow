// ===== 아트보드 & 레이아웃 (Illustrator 1920×1080 원본에서 측정) =====
const W = 1920;
const H = 1080;

const COLS = 6;
const ROWS = 3;
const ORIGIN_X = 256.79; // 좌상단 눈 중심
const ORIGIN_Y = 258.96;
const PITCH_X = 281.25;  // 눈 간격
const PITCH_Y = 281.2;

// ===== 검은 판 (네 변이 바깥으로 살짝 부푼 2차 곡선) =====
// 위/아래 변: y = mid ± K_H·(x − PANEL_CX)², 좌/우 변: x = mid ± K_V·(y − PANEL_CY)²
const PANEL_CX = 960;
const PANEL_CY = 540.1;
const PANEL_TOP = 111.03;
const PANEL_BOTTOM = 969.2;
const PANEL_LEFT = 108.92;
const PANEL_RIGHT = 1811.0;
const K_H = 8.83e-6;
const K_V = 2.79e-5;

// ===== 가시(눈금선): 판 바깥으로 뻗는 가늘어지는 선 =====
const SPIKE_XS = [116.19, 397.45, 678.71, 959.97, 1241.23, 1522.49, 1803.75];
const SPIKE_YS = [118.3, 399.55, 680.8, 962.05];
const V_SPIKE_TIP = 31.5;   // 세로 가시 끝 (위: y, 아래: H − y)
const V_SPIKE_TAPER = 0.054; // 끝에서 1px 멀어질 때마다 늘어나는 굵기
const H_SPIKE_TIP = 54.5;   // 가로 가시 끝 (왼쪽: x, 오른쪽: W − x)
const H_SPIKE_TAPER = 0.0335;
const SPIKE_LEN = 150;      // 판 아래로 숨겨지는 부분까지 포함한 길이

// ===== 색상 =====
const C_BG = '#FFFFFF';
const C_PANEL = '#000000';
const C_RED = '#DE004F';
const C_WHITE = '#FFFFFF';
const C_BLUE = '#00A9DC';
const C_PUPIL = '#000000';

// ===== 눈 내부 치수 (눈 중심 기준) =====
const IRIS_R = 56.2;   // 파란 홍채 반지름
const PUPIL_R = 39.75; // 동공 반지름
const HL_X = 29.5;     // 하이라이트 오프셋
const HL_Y = -33.6;
const HL_R = 14.9;     // 하이라이트 반지름

// 빨간 테두리 / 흰자 윤곽: 눈 중심에서 1° 간격(0°=오른쪽, 시계방향)으로 잰 반지름 (px, 1920×1080 기준)
const RED_PROFILE = [
  136.50, 136.50, 136.25, 136.35, 136.50, 136.35, 136.60, 136.50, 136.50, 136.50, 136.60, 136.70,
  136.80, 137.00, 136.90, 137.20, 137.15, 137.15, 137.55, 137.65, 137.45, 137.65, 137.85, 138.15,
  138.10, 138.45, 138.50, 138.60, 138.75, 138.90, 139.15, 139.40, 139.35, 139.70, 139.80, 140.20,
  140.30, 140.40, 140.65, 140.65, 140.80, 141.10, 141.25, 141.50, 141.55, 141.65, 142.05, 142.00,
  142.40, 142.50, 142.85, 142.75, 143.20, 143.20, 143.20, 143.45, 143.35, 143.70, 143.65, 143.70,
  143.75, 143.85, 144.05, 144.20, 144.10, 144.00, 144.30, 144.30, 144.35, 144.45, 144.20, 144.35,
  144.25, 144.20, 144.45, 144.40, 144.45, 144.20, 144.30, 144.15, 144.35, 144.30, 144.25, 144.25,
  143.95, 144.05, 143.85, 144.05, 143.90, 143.85, 143.85, 143.85, 143.60, 143.35, 143.50, 143.40,
  143.30, 143.25, 142.90, 142.95, 142.65, 142.80, 142.60, 142.50, 142.40, 142.00, 142.00, 141.95,
  141.80, 141.55, 141.35, 141.20, 141.10, 141.05, 140.65, 140.70, 140.40, 140.50, 140.25, 140.05,
  139.90, 139.80, 139.75, 139.70, 139.70, 139.40, 139.20, 139.20, 138.95, 139.05, 139.05, 138.90,
  138.85, 138.80, 138.80, 138.85, 138.45, 138.55, 138.40, 138.45, 138.20, 138.35, 138.35, 138.35,
  138.25, 138.15, 138.10, 138.10, 138.15, 138.25, 138.35, 138.55, 138.35, 138.40, 138.50, 138.50,
  138.45, 138.65, 138.60, 138.70, 138.90, 138.75, 138.95, 138.90, 139.25, 139.25, 139.30, 139.40,
  139.55, 139.75, 139.60, 139.90, 139.85, 140.20, 140.25, 140.35, 140.50, 140.35, 140.60, 140.85,
  140.85, 140.85, 141.25, 141.35, 141.50, 141.35, 141.60, 141.55, 141.90, 141.90, 142.00, 142.10,
  142.30, 142.50, 142.40, 142.70, 142.70, 142.75, 142.80, 142.95, 143.15, 143.25, 143.25, 143.30,
  143.60, 143.60, 143.70, 143.85, 144.05, 143.85, 144.00, 144.10, 144.05, 144.10, 144.25, 144.25,
  144.40, 144.55, 144.55, 144.60, 144.70, 144.65, 144.65, 144.70, 144.80, 144.95, 145.05, 144.95,
  144.90, 145.05, 144.95, 144.95, 145.10, 145.25, 145.45, 145.25, 145.15, 145.35, 145.45, 145.45,
  145.50, 145.60, 145.35, 145.55, 145.60, 145.65, 145.60, 145.55, 145.60, 145.70, 145.80, 145.90,
  145.80, 145.70, 146.00, 145.95, 146.00, 146.10, 145.85, 146.00, 146.20, 146.15, 146.10, 146.10,
  146.15, 146.20, 146.35, 146.20, 146.10, 146.35, 146.35, 146.35, 146.10, 146.20, 146.00, 146.20,
  146.15, 146.10, 146.10, 146.15, 145.90, 145.85, 145.85, 145.75, 145.65, 145.65, 145.65, 145.35,
  145.45, 145.25, 145.45, 145.30, 145.25, 145.20, 144.85, 144.90, 144.85, 144.80, 144.60, 144.45,
  144.35, 144.25, 144.25, 144.15, 143.95, 143.65, 143.75, 143.60, 143.20, 143.25, 142.85, 142.65,
  142.65, 142.45, 142.25, 142.15, 142.05, 141.50, 141.50, 141.25, 141.05, 140.90, 140.65, 140.45,
  140.30, 140.20, 140.10, 139.70, 139.65, 139.40, 139.15, 138.90, 138.75, 138.75, 138.50, 138.45,
  138.45, 138.15, 137.90, 138.00, 137.80, 137.65, 137.55, 137.50, 137.15, 137.20, 137.25, 137.00,
  136.80, 137.00, 136.90, 136.85, 136.85, 136.50, 136.60, 136.70, 136.50, 136.35, 136.60, 136.50
];

const WHITE_PROFILE = [
  134.15, 134.20, 134.25, 134.35, 134.15, 134.35, 134.25, 134.15, 134.15, 134.15, 133.85, 133.95,
  133.75, 133.60, 133.65, 133.70, 133.35, 133.35, 133.35, 133.10, 132.85, 133.00, 132.60, 132.70,
  132.25, 132.20, 132.20, 131.90, 131.95, 131.70, 131.45, 131.40, 131.10, 130.95, 130.90, 130.75,
  130.45, 130.15, 130.10, 129.75, 129.65, 129.55, 129.40, 129.20, 129.05, 128.95, 128.80, 128.55,
  128.30, 128.30, 127.95, 127.90, 127.75, 127.70, 127.30, 127.35, 127.25, 127.20, 126.95, 127.15,
  127.00, 126.85, 126.75, 126.65, 126.60, 126.50, 126.60, 126.40, 126.55, 126.40, 126.30, 126.20,
  126.20, 126.20, 126.25, 126.30, 126.10, 126.25, 126.10, 126.30, 126.25, 126.20, 126.25, 126.30,
  126.35, 126.50, 126.65, 126.50, 126.75, 126.70, 126.65, 127.00, 127.10, 127.20, 127.30, 127.15,
  127.35, 127.60, 127.60, 127.55, 127.95, 128.00, 128.15, 128.30, 128.50, 128.40, 128.65, 128.60,
  129.00, 129.05, 129.10, 129.25, 129.45, 129.65, 129.90, 129.85, 130.20, 130.20, 130.25, 130.35,
  130.50, 130.65, 130.90, 130.75, 131.10, 131.05, 131.30, 131.50, 131.55, 131.65, 131.85, 131.85,
  131.85, 131.70, 132.05, 132.00, 132.30, 131.95, 132.10, 132.30, 132.25, 132.30, 132.20, 132.40,
  132.45, 132.45, 132.35, 132.20, 132.25, 132.05, 132.20, 132.05, 132.05, 132.15, 131.85, 131.85,
  131.90, 131.65, 131.75, 131.55, 131.55, 131.70, 131.60, 131.25, 131.25, 131.30, 131.05, 131.20,
  131.05, 130.90, 130.80, 130.80, 130.45, 130.50, 130.20, 130.00, 130.15, 130.00, 129.90, 129.50,
  129.50, 129.50, 129.25, 129.35, 129.15, 129.00, 128.90, 128.80, 128.75, 128.75, 128.45, 128.55,
  128.30, 128.10, 128.15, 128.20, 128.15, 127.75, 127.75, 127.80, 127.55, 127.45, 127.45, 127.30,
  127.15, 127.10, 127.05, 127.00, 127.05, 126.75, 126.65, 126.60, 126.45, 126.60, 126.45, 126.35,
  126.30, 126.25, 126.15, 126.05, 126.00, 126.00, 125.80, 125.60, 125.70, 125.65, 125.60, 125.35,
  125.30, 125.45, 125.30, 125.25, 125.20, 125.20, 125.05, 125.25, 125.05, 125.15, 125.00, 124.85,
  125.00, 124.80, 124.95, 124.95, 125.00, 124.70, 124.80, 124.55, 124.75, 124.60, 124.50, 124.80,
  124.80, 124.80, 124.50, 124.60, 124.70, 124.55, 124.75, 124.65, 124.55, 124.55, 124.55, 124.60,
  124.70, 124.50, 124.65, 124.50, 124.75, 124.70, 124.65, 124.70, 124.75, 124.85, 124.65, 124.80,
  124.70, 124.95, 124.90, 124.85, 124.90, 124.95, 125.05, 124.85, 125.05, 125.25, 125.20, 125.15,
  125.15, 125.40, 125.25, 125.35, 125.45, 125.65, 125.80, 125.80, 125.85, 126.10, 126.10, 126.15,
  126.35, 126.55, 126.55, 126.80, 126.65, 126.95, 127.30, 127.30, 127.50, 127.40, 127.85, 127.80,
  128.30, 128.30, 128.35, 128.70, 128.60, 129.05, 129.05, 129.20, 129.45, 129.75, 129.95, 130.00,
  130.40, 130.40, 130.55, 130.95, 130.85, 131.25, 131.35, 131.35, 131.55, 131.90, 131.85, 132.20,
  132.25, 132.35, 132.60, 132.65, 132.85, 133.10, 133.00, 133.35, 133.35, 133.40, 133.65, 133.60,
  133.75, 133.95, 133.85, 134.15, 134.15, 134.15, 134.25, 134.35, 134.15, 134.35, 134.25, 134.20
];

// ===== 시선 추적 설정 =====
// 카메라 속 얼굴 위치 → 화면 위 좌표로 옮길 때의 배율 (1 = 카메라 프레임 = 화면 전체)
const GAIN_X = 1.6;
const GAIN_Y = 1.6;
const CAM_OFFSET_Y = 0;    // 카메라가 화면 위에 있어서 생기는 세로 치우침 보정 (px)
const VIEW_DIST = 900;     // 기본 시청 거리 (px 단위, 클수록 눈동자가 덜 움직임)
const REF_IOD = 0.1;       // 기본 거리일 때 카메라 속 두 눈 사이 거리 (정규화)
const SMOOTH = 0.18;       // 따라가는 부드러움 (0~1, 클수록 빠름)

// ===== 깜빡임 =====
const BLINK_LOW = 0.3;        // 이 점수 이하 = 완전히 뜬 눈
const BLINK_HIGH = 0.6;       // 이 점수 이상 = 완전히 감은 눈
const LID_CLOSE_SPEED = 0.6;  // 감는 속도 (0~1)
const LID_OPEN_SPEED = 0.3;   // 뜨는 속도 (0~1)
// 눈꺼풀 모양 (눈 중심 기준 px)
const LID_MEET_Y = 20;        // 감았을 때 만나는 선의 높이 (+ 가 아래)
const LID_MEET_SAG = 8;       // 만나는 선 가운데가 아래로 처지는 정도
const UPPER_LIFT_SIDE = 70;   // 다 떴을 때 윗눈꺼풀 양 끝이 올라가 있는 거리
const UPPER_LIFT_ARCH = 110;  // 〃 가운데가 추가로 더 올라가는 거리 (둥근 휨)
const LOWER_DROP_SIDE = 70;
const LOWER_DROP_ARCH = 80;
let lidClose = 0;             // 0 = 뜸, 1 = 감음
let manualBlinkUntil = 0;

// ===== 3D 눈알 =====
// 눈알을 반지름 SPHERE_R 의 구로 보고, 홍채·동공·하이라이트를 구 표면에 붙인 채 회전시킨다.
// (정사영이라 정면일 때는 원본 그래픽과 완전히 같고, 돌아갈수록 타원으로 눌리며 가장자리에서 잘림)
const GAZE_GAIN = 1.0;     // 시선 각도 배율 (클수록 눈알이 더 많이 돌아감)
const MAX_ANGLE = 55;      // 최대 회전 각도 (도)
let SPHERE_R;              // setup 에서 흰자 윤곽 평균 반지름으로 설정

// ===== 조명 =====
// 광원 방향은 "정면을 볼 때 각막 반사광이 원본 하이라이트 자리에 오도록" 역산한다.
const CORNEA_RATIO = 0.75; // 각막 구 반지름 / 눈알 반지름 (작을수록 각막이 볼록 → 하이라이트가 홍채를 더 따라감)
const WRAP = 0.35;         // 빛이 그림자 쪽으로 감싸 들어가는 정도 (0 = 딱딱한 경계)
const SHADE_STRENGTH = 0.72; // 그림자 진하기 (0~1)
const SHADE_GAMMA = 1.6;   // 클수록 밝은 면이 넓게 하얗게 유지됨
const SHADE_COLOR = [40, 10, 70]; // 그림자 색 (살짝 보랏빛)
const RIM_LIGHT = 0.18;    // 그림자 쪽 가장자리의 반사광 (구 윤곽을 살려줌)

let LIGHT;                 // 정규화된 광원 방향 [x, y, z]
let HALF;                  // (광원 + 시선) 하프벡터 → 각막 반사 위치
let CORNEA_R, CORNEA_Z;    // 각막 구 반지름, 눈알 중심에서 각막 중심까지 거리
let CORNEA_CAP;            // 각막이 덮는 범위 (시선축 기준 반각, rad)
const GLINT_BLEND = (6 * Math.PI) / 180; // 각막↔흰자 반사가 섞이는 각도 폭
let shadeImg;              // 구 음영 레이어 (한 번만 계산)

const eyes = [];
const target = { x: W / 2, y: H / 2, d: VIEW_DIST };
let showDebug = false;

function setup() {
  createCanvas(W, H);
  pixelDensity(2);
  noStroke();

  SPHERE_R = WHITE_PROFILE.reduce((a, b) => a + b, 0) / WHITE_PROFILE.length;
  setupLighting();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // g = 시선 방향 단위벡터 (z 가 화면 밖, 관객 쪽)
      eyes.push({ x: ORIGIN_X + c * PITCH_X, y: ORIGIN_Y + r * PITCH_Y, g: [0, 0, 1] });
    }
  }
}

function draw() {
  background(C_BG);
  updateTarget();

  fill(C_PANEL);
  drawSpikes();
  drawPanel();

  // 빨간 테두리를 먼저 모두 그려서, 위아래로 맞닿는 부분이 흰자 아래로 깔리게 함
  fill(C_RED);
  for (const e of eyes) drawProfile(e.x, e.y, RED_PROFILE);

  updateBlink();

  for (const e of eyes) {
    updateGaze(e);
    drawEye(e);
    if (lidClose > 0.001) drawLids(e, lidClose);
  }

  if (showDebug) drawDebug();
  drawCamPreview();
}

// ===== 오른쪽 위 카메라 미리보기 =====
// 눈 윤곽 랜드마크 (MediaPipe Face Mesh 인덱스)
const EYE_CONTOURS = [
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
];
const IRIS_RINGS = [
  [469, 470, 471, 472],
  [474, 475, 476, 477],
];

function drawCamPreview() {
  const box = document.getElementById('cam-preview');
  if (!box || box.classList.contains('hidden')) return;
  const cv = document.getElementById('cam-canvas');
  const cap = document.getElementById('cam-caption');
  const c = cv.getContext('2d');
  const t = window.faceTracker;
  const w = cv.width;
  const h = cv.height;

  c.fillStyle = '#111';
  c.fillRect(0, 0, w, h);

  if (!t || t.status === 'loading') {
    cap.textContent = '카메라 준비 중…';
    return;
  }
  if (t.status === 'error') {
    cap.textContent = '카메라 오류: ' + t.error;
    return;
  }

  // 거울처럼 좌우 반전
  if (t.video && t.video.readyState >= 2) {
    c.save();
    c.translate(w, 0);
    c.scale(-1, 1);
    c.drawImage(t.video, 0, 0, w, h);
    c.restore();
  }

  if (!t.found) {
    cap.textContent = '얼굴을 찾는 중…';
    return;
  }

  const lm = t.landmarks;
  const px = (p) => (1 - p.x) * w;
  const py = (p) => p.y * h;

  if (lm) {
    // 눈 윤곽
    c.strokeStyle = 'rgba(0, 169, 220, 0.9)';
    c.lineWidth = 2;
    for (const ring of EYE_CONTOURS) {
      c.beginPath();
      ring.forEach((i, k) => (k ? c.lineTo(px(lm[i]), py(lm[i])) : c.moveTo(px(lm[i]), py(lm[i]))));
      c.closePath();
      c.stroke();
    }
    // 홍채
    c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    for (const ring of IRIS_RINGS) {
      const ctr = lm[ring[0] - 1];
      const r = Math.hypot(px(lm[ring[0]]) - px(ctr), py(lm[ring[0]]) - py(ctr));
      c.beginPath();
      c.arc(px(ctr), py(ctr), r, 0, Math.PI * 2);
      c.stroke();
    }
  }

  // 추적 기준점 (두 눈 가운데)
  c.fillStyle = C_RED;
  c.beginPath();
  c.arc((1 - t.x) * w, t.y * h, 8, 0, Math.PI * 2);
  c.fill();

  const openPct = Math.round((1 - t.blink) * 100);
  const thresholdPct = Math.round((1 - (BLINK_LOW + BLINK_HIGH) / 2) * 100);
  const state = lidClose > 0.5 ? '감음' : '뜸';
  cap.textContent = `뜬 정도 ${openPct}% (기준 ${thresholdPct}% 아래면 감음) · ${state}`;
}

// ===== 깜빡임 =====
// 사용자의 눈 감김 점수(0~1) → 눈꺼풀 닫힘 정도. 점수가 BLINK_LOW 이하면 완전히 뜸,
// BLINK_HIGH 이상이면 완전히 감음 (MediaPipe 점수는 눈을 감아도 1까지 잘 안 올라가서 범위를 좁혀 씀)
function updateBlink() {
  const t = window.faceTracker;
  let goal = 0;
  if (t && t.found) {
    const k = constrain((t.blink - BLINK_LOW) / (BLINK_HIGH - BLINK_LOW), 0, 1);
    goal = k * k * (3 - 2 * k);
  }
  // 키보드 B: 카메라 없이 깜빡임 테스트
  if (manualBlinkUntil > millis()) goal = 1;

  // 감을 땐 빠르게, 뜰 땐 살짝 천천히
  lidClose = lerp(lidClose, goal, goal > lidClose ? LID_CLOSE_SPEED : LID_OPEN_SPEED);
}

// 눈꺼풀: 빨간 테두리 모양 안에서 위·아래 빨간 면이 곡선 경계를 따라 내려오고/올라와 만남
function drawLids(e, close) {
  const open = 1 - close;
  const ctx = drawingContext;
  ctx.save();
  tracePath(ctx, e.x, e.y, RED_PROFILE);
  ctx.clip();

  fill(C_RED);
  const span = 160;
  const N = 48;

  // 닫혔을 때 위·아래 눈꺼풀이 만나는 선 (가운데가 살짝 아래로 처진 곡선)
  const meet = (u) => e.y + LID_MEET_Y + LID_MEET_SAG * (1 - u * u);

  // 윗눈꺼풀: 열릴수록 위로 올라가며, 가운데가 더 많이 올라가 눈알 곡면을 따라 둥글게 휨
  beginShape();
  vertex(e.x - span, e.y - span);
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * 2 - 1;
    const lift = open * (UPPER_LIFT_SIDE + UPPER_LIFT_ARCH * (1 - u * u));
    vertex(e.x + u * span, meet(u) - lift);
  }
  vertex(e.x + span, e.y - span);
  endShape(CLOSE);

  // 아랫눈꺼풀
  beginShape();
  vertex(e.x - span, e.y + span);
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * 2 - 1;
    const drop = open * (LOWER_DROP_SIDE + LOWER_DROP_ARCH * (1 - u * u));
    vertex(e.x + u * span, meet(u) + drop);
  }
  vertex(e.x + span, e.y + span);
  endShape(CLOSE);

  ctx.restore();
}

function tracePath(ctx, cx, cy, radii) {
  const n = radii.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const px = cx + radii[i] * Math.cos(a);
    const py = cy + radii[i] * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// 사용자의 눈 위치(카메라) → 화면 앞 3D 공간의 한 점으로 변환
function updateTarget() {
  const t = window.faceTracker;
  let tx = W / 2;
  let ty = H / 2;
  let td = VIEW_DIST;

  if (t && t.found) {
    // 셀피 카메라라서 좌우 반전
    tx = W / 2 + (0.5 - t.x) * W * GAIN_X;
    ty = H / 2 + (t.y - 0.5) * H * GAIN_Y + CAM_OFFSET_Y;
    td = VIEW_DIST * (REF_IOD / max(t.iod, 0.02));
  }

  target.x = lerp(target.x, tx, SMOOTH);
  target.y = lerp(target.y, ty, SMOOTH);
  target.d = lerp(target.d, td, SMOOTH);
}

// 각 눈이 화면 앞 target 을 바라보는 3D 시선 방향 계산
function updateGaze(e) {
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const planar = Math.hypot(dx, dy);

  let theta = Math.atan2(planar, target.d) * GAZE_GAIN;
  theta = Math.min(theta, radians(MAX_ANGLE));

  const ux = planar > 1e-6 ? dx / planar : 0;
  const uy = planar > 1e-6 ? dy / planar : 0;
  const goal = [Math.sin(theta) * ux, Math.sin(theta) * uy, Math.cos(theta)];

  const g = e.g;
  for (let i = 0; i < 3; i++) g[i] = lerp(g[i], goal[i], SMOOTH);
  const n = Math.hypot(g[0], g[1], g[2]);
  for (let i = 0; i < 3; i++) g[i] /= n;
}

function drawEye(e) {
  fill(C_WHITE);
  drawProfile(e.x, e.y, WHITE_PROFILE);

  // 흰자 윤곽 밖으로는 아무것도 안 나가게 클리핑 (= 구 뒤로 넘어가는 부분이 잘림)
  const ctx = drawingContext;
  ctx.save();
  tracePath(ctx, e.x, e.y, WHITE_PROFILE);
  ctx.clip();

  // z축을 시선 방향 g 로 돌리는 최소 회전 → 구 표면의 접평면 기저 u, v
  const [a, b, c] = e.g;
  const k = 1 / (1 + c);
  const u = [1 - a * a * k, -a * b * k]; // 회전된 x축의 화면 투영
  const v = [-a * b * k, 1 - b * b * k]; // 회전된 y축의 화면 투영

  // 구 표면 위 원(반지름 r)은 중심에서 깊이 h = √(R² − r²) 인 평면에 놓임
  const R = SPHERE_R;
  const disc = (r, offX, offY, col) => {
    const h = Math.sqrt(Math.max(R * R - r * r - offX * offX - offY * offY, 0));
    push();
    applyMatrix(u[0], u[1], v[0], v[1], e.x + a * h, e.y + b * h);
    fill(col);
    circle(offX, offY, r * 2);
    pop();
  };

  disc(IRIS_R, 0, 0, C_BLUE);
  disc(PUPIL_R, 0, 0, C_PUPIL);

  // 구 음영: 광원이 고정이라 화면 위치마다 음영이 정해짐 → 미리 계산한 레이어를 덮음
  image(shadeImg, e.x - shadeImg.width / 2, e.y - shadeImg.height / 2);

  // 반사광: 반사점이 각막 위면 각막 반사(각막 중심 + 각막 반지름 × 하프벡터),
  // 각막을 벗어나면 흰자 구 반사(고정 위치). 경계 근처에선 부드럽게 섞음.
  // 반사광 크기는 곡률 반지름에 비례 → 흰자 반사가 조금 더 큼.
  const cosHG = HALF[0] * a + HALF[1] * b + HALF[2] * c;
  const angOff = Math.acos(Math.min(1, cosHG));
  const t = constrain((angOff - (CORNEA_CAP - GLINT_BLEND)) / (2 * GLINT_BLEND), 0, 1);
  const s = t * t * (3 - 2 * t);
  const corneaX = a * CORNEA_Z + CORNEA_R * HALF[0];
  const corneaY = b * CORNEA_Z + CORNEA_R * HALF[1];
  const scleraX = R * HALF[0];
  const scleraY = R * HALF[1];
  const hr = HL_R * lerp(1, R / CORNEA_R, s);
  fill(C_WHITE);
  circle(e.x + lerp(corneaX, scleraX, s), e.y + lerp(corneaY, scleraY, s), hr * 2);

  ctx.restore();
}

function setupLighting() {
  const R = SPHERE_R;

  // 각막: 홍채 테두리 원을 지나는 더 작은 구
  CORNEA_R = R * CORNEA_RATIO;
  const irisDepth = Math.sqrt(R * R - IRIS_R * IRIS_R);
  CORNEA_Z = irisDepth - Math.sqrt(CORNEA_R * CORNEA_R - IRIS_R * IRIS_R);
  CORNEA_CAP = Math.asin(IRIS_R / CORNEA_R);

  // 정면일 때 반사점이 (HL_X, HL_Y) 에 오도록 하프벡터 → 광원 방향 역산
  const hxN = HL_X / CORNEA_R;
  const hyN = HL_Y / CORNEA_R;
  HALF = [hxN, hyN, Math.sqrt(Math.max(1 - hxN * hxN - hyN * hyN, 0))];
  LIGHT = [2 * HALF[2] * HALF[0], 2 * HALF[2] * HALF[1], 2 * HALF[2] * HALF[2] - 1];

  // 구 음영 레이어
  const size = Math.ceil(Math.max(...WHITE_PROFILE)) * 2 + 4;
  const d = 2;
  shadeImg = createGraphics(size, size);
  shadeImg.pixelDensity(d);
  shadeImg.loadPixels();
  const P = size * d;
  const c = size / 2;
  for (let py = 0; py < P; py++) {
    for (let px = 0; px < P; px++) {
      let nx = ((px + 0.5) / d - c) / R;
      let ny = ((py + 0.5) / d - c) / R;
      let r2 = nx * nx + ny * ny;
      if (r2 > 1) {
        // 구 실루엣 밖(흰자 윤곽이 약간 더 큰 부분)은 가장자리 법선으로 처리
        const s = 1 / Math.sqrt(r2);
        nx *= s;
        ny *= s;
        r2 = 1;
      }
      const nz = Math.sqrt(1 - r2);

      const ndl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      const lit = Math.max(0, Math.min(1, (ndl + WRAP) / (1 + WRAP)));
      let dark = Math.pow(1 - lit, SHADE_GAMMA) * SHADE_STRENGTH;

      // 그림자 쪽 가장자리에 살짝 되비치는 빛
      const rim = Math.pow(1 - nz, 3) * Math.max(0, -ndl);
      dark *= 1 - RIM_LIGHT * rim * 3;

      const i = (py * P + px) * 4;
      shadeImg.pixels[i] = SHADE_COLOR[0];
      shadeImg.pixels[i + 1] = SHADE_COLOR[1];
      shadeImg.pixels[i + 2] = SHADE_COLOR[2];
      shadeImg.pixels[i + 3] = Math.max(0, dark) * 255;
    }
  }
  shadeImg.updatePixels();
}

function drawSpikes() {
  const vw = (V_SPIKE_TAPER * SPIKE_LEN) / 2;
  for (const x of SPIKE_XS) {
    triangle(x, V_SPIKE_TIP, x - vw, V_SPIKE_TIP + SPIKE_LEN, x + vw, V_SPIKE_TIP + SPIKE_LEN);
    triangle(x, H - V_SPIKE_TIP, x - vw, H - V_SPIKE_TIP - SPIKE_LEN, x + vw, H - V_SPIKE_TIP - SPIKE_LEN);
  }
  const hw = (H_SPIKE_TAPER * SPIKE_LEN) / 2;
  for (const y of SPIKE_YS) {
    triangle(H_SPIKE_TIP, y, H_SPIKE_TIP + SPIKE_LEN, y - hw, H_SPIKE_TIP + SPIKE_LEN, y + hw);
    triangle(W - H_SPIKE_TIP, y, W - H_SPIKE_TIP - SPIKE_LEN, y - hw, W - H_SPIKE_TIP - SPIKE_LEN, y + hw);
  }
}

const panelTop = (x) => PANEL_TOP + K_H * (x - PANEL_CX) ** 2;
const panelBottom = (x) => PANEL_BOTTOM - K_H * (x - PANEL_CX) ** 2;
const panelLeft = (y) => PANEL_LEFT + K_V * (y - PANEL_CY) ** 2;
const panelRight = (y) => PANEL_RIGHT - K_V * (y - PANEL_CY) ** 2;

let panelPts = null;

function drawPanel() {
  if (!panelPts) panelPts = buildPanel();
  beginShape();
  for (const [x, y] of panelPts) vertex(x, y);
  endShape(CLOSE);
}

function buildPanel() {
  // 좌상단 모서리 = 위 변과 왼쪽 변의 교점 (상하좌우 대칭이라 나머지는 반사)
  let cx = PANEL_LEFT;
  let cy = PANEL_TOP;
  for (let i = 0; i < 30; i++) {
    cy = panelTop(cx);
    cx = panelLeft(cy);
  }
  const x0 = cx, x1 = 2 * PANEL_CX - cx;
  const y0 = cy, y1 = 2 * PANEL_CY - cy;
  const pts = [];
  const NX = 200, NY = 120;
  for (let i = 0; i <= NX; i++) { const x = lerp(x0, x1, i / NX); pts.push([x, panelTop(x)]); }
  for (let i = 1; i <= NY; i++) { const y = lerp(y0, y1, i / NY); pts.push([panelRight(y), y]); }
  for (let i = NX - 1; i >= 0; i--) { const x = lerp(x0, x1, i / NX); pts.push([x, panelBottom(x)]); }
  for (let i = NY - 1; i > 0; i--) { const y = lerp(y0, y1, i / NY); pts.push([panelLeft(y), y]); }
  return pts;
}


// D 키: 웹캠 미리보기 + 추적 상태 표시
function keyPressed() {
  if (key === 'd' || key === 'D') showDebug = !showDebug;
  if (key === 'v' || key === 'V') document.getElementById('cam-preview').classList.toggle('hidden');
  if (key === 'b' || key === 'B') manualBlinkUntil = millis() + 150;
}

function drawDebug() {
  const t = window.faceTracker;
  push();
  fill(0, 255, 0);
  circle(target.x, target.y, 14);
  fill(0, 160, 0);
  textSize(16);
  const status = !t ? 'tracker 없음' : t.status === 'error' ? 'error: ' + t.error : t.status;
  text(`tracker: ${status}  face: ${t && t.found ? 'O' : 'X'}`, 20, 280);
  text(`blink score: ${t ? t.blink.toFixed(2) : '-'}  lid: ${lidClose.toFixed(2)}`, 20, 302);
  pop();
}

// 반지름 배열(1° 간격)로 닫힌 도형 그리기
function drawProfile(cx, cy, radii) {
  const n = radii.length;
  beginShape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    vertex(cx + radii[i] * cos(a), cy + radii[i] * sin(a));
  }
  endShape(CLOSE);
}

// =====================================================================
//  Your Eyes Make Me Happy — 모바일 세로 버전 (v2)
//  고정 그래픽은 assets/bg.png(원본 그대로), 움직이는 부분만 여기서 그림:
//   - 15개 눈알: 3D 구 회전 + 조명 + 깜빡임
//   - 아래 흰 박스: 전면 카메라 영상 + 눈 추적 표시
//  좌표는 모두 아트보드 단위 (ART_W × ART_H, eyes-data.js 참고)
// =====================================================================

// ===== 눈 내부 치수 (홍채 중심 기준, 원본에서 실측) =====
const IRIS_R = 56.5;
const PUPIL_R = 39.83;
const HL_X = 29.6;
const HL_Y = -33.7;
const HL_R = 14.95;

// ===== 색상 =====
const C_RED = '#DE004F';
const C_WHITE = '#FFFFFF';
const C_BLUE = '#00A9DC';
const C_PUPIL = '#000000';

// ===== 시선 추적 =====
const TRACK_RANGE = 2400;  // 카메라 프레임 끝에서 끝까지 = 아트보드 위 이만큼 (클수록 고개를 조금만 움직여도 많이 따라옴)
const CAM_OFFSET_Y = 0;    // 시선이 위아래로 어긋나 보이면 보정 (+ 가 아래)
const VIEW_DIST = 900;     // 기본 시청 거리 (클수록 눈동자가 덜 움직임)
const REF_IOD = 0.18;      // 폰을 평소 거리에 들었을 때 카메라 속 두 눈 사이 거리 (정규화)
const SMOOTH = 0.18;       // 따라가는 부드러움 (0~1, 클수록 빠름)

// ===== 3D 눈알 =====
const GAZE_GAIN = 1.0;     // 시선 각도 배율
const MAX_ANGLE = 55;      // 최대 회전 각도 (도)

// ===== 조명 =====
const CORNEA_RATIO = 0.75; // 각막 구 반지름 / 눈알 반지름
const WRAP = 0.35;
const SHADE_STRENGTH = 0.72;
const SHADE_GAMMA = 1.6;
const SHADE_COLOR = [40, 10, 70];
const RIM_LIGHT = 0.18;
const GLINT_BLEND = (6 * Math.PI) / 180;

// ===== 깜빡임 =====
const BLINK_LOW = 0.3;        // 이 점수 이하 = 완전히 뜬 눈
const BLINK_HIGH = 0.6;       // 이 점수 이상 = 완전히 감은 눈
const LID_CLOSE_SPEED = 0.6;
const LID_OPEN_SPEED = 0.3;
const LID_MEET_Y = 20;
const LID_MEET_SAG = 8;
const UPPER_LIFT_SIDE = 70;
const UPPER_LIFT_ARCH = 110;
const LOWER_DROP_SIDE = 70;
const LOWER_DROP_ARCH = 80;
const LID_BLEED = 1.5;        // 눈꺼풀이 흰자 윤곽보다 살짝 넓게 덮는 여백 (가장자리 흰 선 방지)

// ===== 카메라 박스 =====
const CAM_OVERLAY_DEFAULT = true; // 박스 안에 눈 윤곽 추적선 표시 (박스를 탭하면 켜기/끄기)

// ---------------------------------------------------------------------
let k = 1;                 // 아트보드 단위 → 화면(CSS px) 배율
let eyes = [];
let GRID_CX = 0, GRID_CY = 0;
const target = { x: 0, y: 0, d: VIEW_DIST };
let lidClose = 0;
let manualBlinkUntil = 0;
let showDebug = false;
let camOverlay = CAM_OVERLAY_DEFAULT;

let SPHERE_R, CORNEA_R, CORNEA_Z, CORNEA_CAP, HALF, LIGHT;
let shadeCanvas = null;
let boxBounds;

function stageSize() {
  const r = document.getElementById('stage').getBoundingClientRect();
  return { w: r.width, h: r.height };
}

function setup() {
  const s = stageSize();
  const cnv = createCanvas(s.w, s.h);
  cnv.parent('stage');
  pixelDensity(Math.min(window.devicePixelRatio || 1, 3));
  k = s.w / ART_W;
  noStroke();

  eyes = EYE_DATA.map((d) => ({
    x: d.x,
    y: d.y,
    white: d.white,
    R: d.white.reduce((a, b) => a + b, 0) / d.white.length,
    g: [0, 0, 1],
  }));
  GRID_CX = eyes.reduce((a, e) => a + e.x, 0) / eyes.length;
  GRID_CY = eyes.reduce((a, e) => a + e.y, 0) / eyes.length;
  target.x = GRID_CX;
  target.y = GRID_CY;

  SPHERE_R = eyes.reduce((a, e) => a + e.R, 0) / eyes.length;
  setupLighting();

  const xs = CAM_BOX.map((p) => p[0]);
  const ys = CAM_BOX.map((p) => p[1]);
  boxBounds = { x0: min(xs), x1: max(xs), y0: min(ys), y1: max(ys) };
}

function windowResized() {
  const s = stageSize();
  resizeCanvas(s.w, s.h);
  k = s.w / ART_W;
  buildShade();
}

function draw() {
  clear();
  updateTarget();
  updateBlink();
  updateStatus();

  push();
  scale(k);

  drawCamBox();

  for (const e of eyes) {
    updateGaze(e);
    drawEye(e);
    if (lidClose > 0.001) drawLids(e, lidClose);
  }

  if (showDebug) drawDebug();
  pop();
}

// ===== 시선 =====
function updateTarget() {
  const t = window.faceTracker;
  let tx = GRID_CX;
  let ty = GRID_CY;
  let td = VIEW_DIST;

  if (t && t.found) {
    const v = t.video;
    const aspect = v && v.videoWidth ? v.videoHeight / v.videoWidth : 0.75;
    // 셀피 카메라라서 좌우 반전
    tx = GRID_CX + (0.5 - t.x) * TRACK_RANGE;
    ty = GRID_CY + (t.y - 0.5) * TRACK_RANGE * aspect + CAM_OFFSET_Y;
    td = VIEW_DIST * (REF_IOD / max(t.iod, 0.03));
  }

  target.x = lerp(target.x, tx, SMOOTH);
  target.y = lerp(target.y, ty, SMOOTH);
  target.d = lerp(target.d, td, SMOOTH);
}

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

// ===== 눈알 =====
function drawEye(e) {
  const ctx = drawingContext;

  // 흰자 (원본 홍채를 덮음)
  fill(C_WHITE);
  drawProfile(e.x, e.y, e.white, 0);

  ctx.save();
  tracePath(ctx, e.x, e.y, e.white, 0);
  ctx.clip();

  const [a, b, c] = e.g;
  const kk = 1 / (1 + c);
  const u = [1 - a * a * kk, -a * b * kk];
  const v = [-a * b * kk, 1 - b * b * kk];
  const R = e.R;

  const disc = (r, col) => {
    const h = Math.sqrt(Math.max(R * R - r * r, 0));
    push();
    applyMatrix(u[0], u[1], v[0], v[1], e.x + a * h, e.y + b * h);
    fill(col);
    circle(0, 0, r * 2);
    pop();
  };
  disc(IRIS_R, C_BLUE);
  disc(PUPIL_R, C_PUPIL);

  // 구 음영
  if (shadeCanvas) {
    const sz = shadeCanvas.unitSize;
    ctx.drawImage(shadeCanvas, e.x - sz / 2, e.y - sz / 2, sz, sz);
  }

  // 반사광 (각막 ↔ 흰자)
  const cosHG = HALF[0] * a + HALF[1] * b + HALF[2] * c;
  const angOff = Math.acos(Math.min(1, cosHG));
  const t = constrain((angOff - (CORNEA_CAP - GLINT_BLEND)) / (2 * GLINT_BLEND), 0, 1);
  const s = t * t * (3 - 2 * t);
  const corneaX = a * CORNEA_Z + CORNEA_R * HALF[0];
  const corneaY = b * CORNEA_Z + CORNEA_R * HALF[1];
  const hr = HL_R * lerp(1, R / CORNEA_R, s);
  fill(C_WHITE);
  circle(e.x + lerp(corneaX, R * HALF[0], s), e.y + lerp(corneaY, R * HALF[1], s), hr * 2);

  ctx.restore();
}

function setupLighting() {
  const R = SPHERE_R;
  CORNEA_R = R * CORNEA_RATIO;
  const irisDepth = Math.sqrt(R * R - IRIS_R * IRIS_R);
  CORNEA_Z = irisDepth - Math.sqrt(CORNEA_R * CORNEA_R - IRIS_R * IRIS_R);
  CORNEA_CAP = Math.asin(IRIS_R / CORNEA_R);

  const hxN = HL_X / CORNEA_R;
  const hyN = HL_Y / CORNEA_R;
  HALF = [hxN, hyN, Math.sqrt(Math.max(1 - hxN * hxN - hyN * hyN, 0))];
  LIGHT = [2 * HALF[2] * HALF[0], 2 * HALF[2] * HALF[1], 2 * HALF[2] * HALF[2] - 1];
  buildShade();
}

// 구 음영 레이어: 화면 해상도에 맞춰 한 번만 계산 (크기 바뀌면 다시)
function buildShade() {
  const R = SPHERE_R;
  const maxR = Math.max(...eyes.map((e) => Math.max(...e.white)));
  const unitSize = Math.ceil(maxR) * 2 + 4;
  const res = k * pixelDensity();
  const P = Math.max(8, Math.ceil(unitSize * res));

  const cv = document.createElement('canvas');
  cv.width = P;
  cv.height = P;
  const c2 = cv.getContext('2d');
  const img = c2.createImageData(P, P);
  const px2u = unitSize / P;
  const half = unitSize / 2;

  for (let py = 0; py < P; py++) {
    for (let px = 0; px < P; px++) {
      let nx = ((px + 0.5) * px2u - half) / R;
      let ny = ((py + 0.5) * px2u - half) / R;
      let r2 = nx * nx + ny * ny;
      if (r2 > 1) {
        const sc = 1 / Math.sqrt(r2);
        nx *= sc;
        ny *= sc;
        r2 = 1;
      }
      const nz = Math.sqrt(1 - r2);
      const ndl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      const lit = Math.max(0, Math.min(1, (ndl + WRAP) / (1 + WRAP)));
      let dark = Math.pow(1 - lit, SHADE_GAMMA) * SHADE_STRENGTH;
      const rim = Math.pow(1 - nz, 3) * Math.max(0, -ndl);
      dark *= 1 - RIM_LIGHT * rim * 3;

      const i = (py * P + px) * 4;
      img.data[i] = SHADE_COLOR[0];
      img.data[i + 1] = SHADE_COLOR[1];
      img.data[i + 2] = SHADE_COLOR[2];
      img.data[i + 3] = Math.max(0, dark) * 255;
    }
  }
  c2.putImageData(img, 0, 0);
  cv.unitSize = unitSize;
  shadeCanvas = cv;
}

// ===== 깜빡임 =====
function updateBlink() {
  const t = window.faceTracker;
  let goal = 0;
  if (t && t.found) {
    const q = constrain((t.blink - BLINK_LOW) / (BLINK_HIGH - BLINK_LOW), 0, 1);
    goal = q * q * (3 - 2 * q);
  }
  if (manualBlinkUntil > millis()) goal = 1;
  lidClose = lerp(lidClose, goal, goal > lidClose ? LID_CLOSE_SPEED : LID_OPEN_SPEED);
}

// 눈꺼풀: 흰자 영역 위로 위·아래 빨간 면이 곡선 경계를 따라 닫힘
function drawLids(e, close) {
  const open = 1 - close;
  const ctx = drawingContext;
  ctx.save();
  tracePath(ctx, e.x, e.y, e.white, LID_BLEED);
  ctx.clip();

  fill(C_RED);
  const span = 160;
  const N = 48;
  const meet = (u) => e.y + LID_MEET_Y + LID_MEET_SAG * (1 - u * u);

  beginShape();
  vertex(e.x - span, e.y - span);
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * 2 - 1;
    vertex(e.x + u * span, meet(u) - open * (UPPER_LIFT_SIDE + UPPER_LIFT_ARCH * (1 - u * u)));
  }
  vertex(e.x + span, e.y - span);
  endShape(CLOSE);

  beginShape();
  vertex(e.x - span, e.y + span);
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * 2 - 1;
    vertex(e.x + u * span, meet(u) + open * (LOWER_DROP_SIDE + LOWER_DROP_ARCH * (1 - u * u)));
  }
  vertex(e.x + span, e.y + span);
  endShape(CLOSE);

  ctx.restore();
}

// ===== 카메라 박스 =====
// 눈 윤곽 랜드마크 (MediaPipe Face Mesh 인덱스)
const EYE_CONTOURS = [
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
];
const IRIS_RINGS = [
  [468, 469],
  [473, 474],
];

function drawCamBox() {
  const t = window.faceTracker;
  const v = t && t.video;
  if (!v || v.readyState < 2 || !v.videoWidth) return;

  const ctx = drawingContext;
  const { x0, x1, y0, y1 } = boxBounds;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const cx = (x0 + x1) / 2;

  // 박스를 꽉 채우도록(cover) 영상 크기·위치 계산
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  const sc = Math.max(bw / vw, bh / vh);
  const dw = vw * sc;
  const dh = vh * sc;
  const ox = x0 + (bw - dw) / 2;
  const oy = y0 + (bh - dh) / 2;

  ctx.save();
  ctx.beginPath();
  CAM_BOX.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.clip();

  // 거울처럼 좌우 반전
  ctx.save();
  ctx.translate(2 * cx, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(v, ox, oy, dw, dh);
  ctx.restore();

  if (camOverlay && t.found && t.landmarks) {
    const lm = t.landmarks;
    const px = (p) => 2 * cx - (ox + p.x * dw);
    const py = (p) => oy + p.y * dh;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C_BLUE;
    for (const ring of EYE_CONTOURS) {
      ctx.beginPath();
      ring.forEach((i, n) => (n ? ctx.lineTo(px(lm[i]), py(lm[i])) : ctx.moveTo(px(lm[i]), py(lm[i]))));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.strokeStyle = C_WHITE;
    for (const [ci, ei] of IRIS_RINGS) {
      const r = Math.hypot(px(lm[ei]) - px(lm[ci]), py(lm[ei]) - py(lm[ci]));
      ctx.beginPath();
      ctx.arc(px(lm[ci]), py(lm[ci]), r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 추적 기준점 (두 눈 가운데)
    ctx.fillStyle = C_RED;
    ctx.beginPath();
    ctx.arc(2 * cx - (ox + t.x * dw), oy + t.y * dh, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function updateStatus() {
  const el = document.getElementById('status');
  const t = window.faceTracker;
  let msg = '';
  if (!t || t.status === 'loading') msg = '카메라 준비 중…';
  else if (t.status === 'tap') msg = '화면을 눌러 카메라 시작';
  else if (t.status === 'error') msg = '카메라를 쓸 수 없어요\n' + t.error;
  if (el.textContent !== msg) el.textContent = msg;
}

// ===== 입력 =====
// 박스 탭: 추적선 켜기/끄기
function mousePressed() {
  const ux = mouseX / k;
  const uy = mouseY / k;
  const { x0, x1, y0, y1 } = boxBounds;
  if (ux >= x0 && ux <= x1 && uy >= y0 && uy <= y1) camOverlay = !camOverlay;
}

// 데스크톱 테스트용: D = 디버그, B = 깜빡임
function keyPressed() {
  if (key === 'd' || key === 'D') showDebug = !showDebug;
  if (key === 'b' || key === 'B') manualBlinkUntil = millis() + 150;
}

function drawDebug() {
  const t = window.faceTracker;
  fill(0, 255, 0);
  circle(target.x, target.y, 14);
  fill(0, 160, 0);
  textSize(18);
  const status = !t ? 'tracker 없음' : t.status === 'error' ? 'error: ' + t.error : t.status;
  text(`tracker: ${status}  face: ${t && t.found ? 'O' : 'X'}`, 20, 30);
  text(`blink: ${t ? t.blink.toFixed(2) : '-'}  lid: ${lidClose.toFixed(2)}  iod: ${t ? t.iod.toFixed(3) : '-'}`, 20, 54);
}

// ===== 도형 유틸 =====
function tracePath(ctx, cx, cy, radii, grow) {
  const n = radii.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const r = radii[i] + grow;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawProfile(cx, cy, radii, grow) {
  const n = radii.length;
  beginShape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const r = radii[i] + grow;
    vertex(cx + r * cos(a), cy + r * sin(a));
  }
  endShape(CLOSE);
}

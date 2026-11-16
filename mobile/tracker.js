// MediaPipe Face Landmarker로 전면 카메라 속 사용자의 눈 위치·깜빡임을 추적해서
// window.faceTracker 에 올려둔다. (모바일: iOS Safari / Android Chrome 대응)
import {
  FaceLandmarker,
  FilesetResolver,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// 홍채 중심 랜드마크 (refined landmarks 478개 중)
const IRIS_A = 468;
const IRIS_B = 473;

const tracker = {
  status: 'loading', // loading | tap | ready | error
  error: null,
  found: false,
  x: 0.5,   // 두 눈 중간점 (카메라 이미지 기준 0~1, 미러링 전)
  y: 0.5,
  iod: 0.18, // 두 눈 사이 거리 (정규화) → 얼마나 가까이 있는지
  blink: 0,  // 눈 감김 정도 0(뜸) ~ 1(감음), 두 눈 중 더 감긴 쪽
  landmarks: null,
  video: null,
};
window.faceTracker = tracker;

// iOS 에서 자동재생이 막히면 화면을 한 번 터치했을 때 재생
function playVideo(video) {
  return video.play().catch(
    () =>
      new Promise((resolve) => {
        tracker.status = 'tap';
        const go = () => {
          window.removeEventListener('pointerdown', go);
          video.play().then(resolve, resolve);
        };
        window.addEventListener('pointerdown', go);
      })
  );
}

async function createLandmarker(fileset, delegate) {
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true, // eyeBlinkLeft / eyeBlinkRight 점수
  });
}

async function start() {
  try {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.playsInline = true;
    video.muted = true;
    // iOS 는 DOM 에 붙어 있어야 안정적으로 프레임이 들어옴 (화면엔 안 보이게)
    video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(video);
    tracker.video = video;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;
    await playVideo(video);

    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    let landmarker;
    try {
      landmarker = await createLandmarker(fileset, 'GPU');
    } catch (e) {
      console.warn('GPU delegate 실패, CPU 로 전환', e);
      landmarker = await createLandmarker(fileset, 'CPU');
    }

    tracker.status = 'ready';
    let lastTime = -1;

    const loop = () => {
      if (video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        const res = landmarker.detectForVideo(video, performance.now());
        const lm = res.faceLandmarks && res.faceLandmarks[0];
        if (lm && lm.length > IRIS_B) {
          const a = lm[IRIS_A];
          const b = lm[IRIS_B];
          tracker.x = (a.x + b.x) / 2;
          tracker.y = (a.y + b.y) / 2;
          tracker.iod = Math.hypot(a.x - b.x, a.y - b.y);
          tracker.landmarks = lm;
          tracker.found = true;

          const shapes = res.faceBlendshapes && res.faceBlendshapes[0];
          if (shapes) {
            let l = 0;
            let r = 0;
            for (const cat of shapes.categories) {
              if (cat.categoryName === 'eyeBlinkLeft') l = cat.score;
              else if (cat.categoryName === 'eyeBlinkRight') r = cat.score;
            }
            tracker.blink = Math.max(l, r);
          }
        } else {
          tracker.found = false;
          tracker.blink = 0;
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  } catch (err) {
    console.error(err);
    tracker.status = 'error';
    tracker.error = err.message || String(err);
  }
}

start();

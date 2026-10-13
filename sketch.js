let bgm;
let audioContext;
let analyser;
let frequencies;
let previousBass = 0;
let beatPulse = 0;
let motionPulse = 0;
let shakeX = 0;
let shakeY = 0;

function setup() {
  const canvas = createCanvas(720, 480);
  canvas.parent('canvas-container');
  angleMode(DEGREES);
  describe('米色画布上的撞色立体几何图形。音乐未播放或暂停时所有图形保持静止，播放音乐后所有图形一起随低频鼓点震动，背景始终静止。');
  bgm = document.getElementById('bgm');
  bgm.addEventListener('play', connectMusic);
  bgm.addEventListener('playing', () => loop());
  for (const event of ['pause', 'ended', 'waiting', 'emptied', 'error']) {
    bgm.addEventListener(event, stopMotion);
  }
  // The initial frame is static; rendering resumes only with music playback.
  noLoop();
}

function draw() {
  background('#F6F0E8');
  updateBeat();
  // A gently smoothed pulse follows each drum onset without rapid jitter.
  shakeX = motionPulse * 1.2;
  shakeY = -motionPulse * 4;
  const shapes = [drawSquare, drawRectangle, drawEye, drawDiagonal, drawTriangle, drawQuad];
  for (let i = 0; i < shapes.length; i++) {
    push();
    translate(shakeX, 40 + shakeY);
    noStroke();
    shapes[i]();
    pop();
  }
}

async function connectMusic() {
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      const source = audioContext.createMediaElementSource(bgm);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      frequencies = new Uint8Array(analyser.frequencyBinCount);
    }
    previousBass = 0;
    beatPulse = 0;
    motionPulse = 0;
    await audioContext.resume();
    if (!bgm.paused && !bgm.ended && bgm.readyState >= 3) loop();
  } catch (error) {
    console.warn('无法启动音乐分析：', error);
  }
}

function updateBeat() {
  const seconds = Math.min(deltaTime, 100) / 1000;
  beatPulse *= Math.exp(-9 * seconds);
  if (!bgm || bgm.paused || bgm.ended || bgm.readyState < 3 || !analyser || audioContext.state !== 'running') {
    beatPulse = 0;
    motionPulse = 0;
    previousBass = 0;
    return;
  }
  analyser.getByteFrequencyData(frequencies);
  const binHz = audioContext.sampleRate / analyser.fftSize;
  const first = Math.max(1, Math.ceil(40 / binHz));
  const last = Math.min(frequencies.length - 1, Math.floor(180 / binHz));
  let bass = 0;
  for (let i = first; i <= last; i++) bass += frequencies[i] / 255;
  bass /= Math.max(1, last - first + 1);
  // React to a rise in bass energy, so sustained notes don't keep shaking.
  const onset = bass - previousBass;
  if (bass > 0.18 && onset > 0.035) {
    beatPulse = Math.max(beatPulse, Math.min(1, onset * 5 + bass * 0.35));
  }
  previousBass = bass;
  const smoothing = 1 - Math.exp(-20 * seconds);
  motionPulse += (beatPulse - motionPulse) * smoothing;
}

function stopMotion() {
  beatPulse = 0;
  motionPulse = 0;
  previousBass = 0;
  shakeX = 0;
  shakeY = 0;
  noLoop();
  redraw();
}

function drawSquare() {
  // Orange square: darker sides and a warm, bright front.
  fill('#B84A20');
  quad(120, 20, 132, 32, 132, 132, 120, 120);
  fill('#D15B22');
  quad(20, 120, 120, 120, 132, 132, 32, 132);
  beginShadow();
  fill('#FF8438');
  square(20, 20, 100);
  endShadow();
  stroke('#FFC48B');
  strokeWeight(3);
  line(24, 24, 115, 24);
  line(24, 24, 24, 115);
  noStroke();
}

function drawRectangle() {
  // Blue-violet rectangle still overlaps the square, as in the original.
  fill('#30268E');
  quad(300, 40, 312, 52, 312, 152, 300, 140);
  fill('#4030AA');
  quad(100, 140, 300, 140, 312, 152, 112, 152);
  beginShadow();
  fill('#6750E8');
  rect(100, 40, 200, 100);
  endShadow();
  stroke('#B7A8FF');
  strokeWeight(3);
  line(104, 44, 295, 44);
  line(104, 44, 104, 135);
  noStroke();
}

function drawEye() {
  // Eye: a shaded rim, a blue pupil and a small reflected highlight.
  fill('#CC6B27');
  ellipse(544, 108, 300, 100);
  beginShadow();
  fill('#FFF1CD');
  ellipse(540, 100, 300, 100);
  endShadow();
  fill('#312786');
  circle(560, 103, 88);
  fill('#6750E8');
  circle(554, 96, 76);
  fill('#211B52');
  circle(560, 100, 43);
  fill('#FFFFFF');
  circle(546, 87, 17);
  fill('#C8BDFF');
  circle(574, 115, 6);
  fill('#FFAD32');
  arc(540, 100, 300, 100, 180, 360, CHORD);
  noFill();
  stroke('#FFD783');
  strokeWeight(3);
  arc(540, 98, 286, 88, 192, 340);
  noStroke();
}

function drawDiagonal() {
  // Keep the diagonal line, with a darker edge for slight depth.
  strokeCap(ROUND);
  strokeWeight(8);
  stroke('#BA522C');
  line(24, 204, 204, 354);
  stroke('#FF8438');
  line(20, 200, 200, 350);
  strokeWeight(2);
  stroke('#FFD0A0');
  line(19, 197, 199, 347);
  noStroke();
}

function drawTriangle() {
  // Yellow triangle: two shaded facets suggest a small pyramid.
  beginShadow();
  fill('#FFC83D');
  triangle(250, 350, 350, 200, 450, 350);
  endShadow();
  fill('#FFE694');
  triangle(250, 350, 350, 200, 350, 350);
  fill('#E99925');
  triangle(350, 200, 450, 350, 350, 305);
}

function drawQuad() {
  // Violet quadrilateral: offset lower edges give it a raised surface.
  fill('#35268C');
  quad(500, 250, 650, 350, 660, 362, 510, 262);
  fill('#4935AC');
  quad(650, 350, 700, 300, 710, 312, 660, 362);
  beginShadow();
  fill('#6750E8');
  quad(500, 250, 550, 200, 700, 300, 650, 350);
  endShadow();
  fill('#8872F4');
  triangle(500, 250, 550, 200, 650, 350);
  stroke('#C3B6FF');
  strokeWeight(3);
  line(504, 249, 550, 204);
  line(550, 204, 695, 300);
  noStroke();
}


// A soft cast shadow adds depth without changing the original layout.
function beginShadow() {
  drawingContext.save();
  drawingContext.shadowColor = 'rgba(42, 25, 75, 0.22)';
  drawingContext.shadowBlur = 12;
  drawingContext.shadowOffsetX = 5;
  drawingContext.shadowOffsetY = 8;
}

function endShadow() {
  drawingContext.restore();
}

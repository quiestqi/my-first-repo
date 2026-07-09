// Mandelbrot Canvas
// Semi-full / semi-zoom composition
// Ornate version: pale fantasy palette + fewer variable-width ribbons
// p5.js static 2D canvas

const canvasW = 720;
const canvasH = 400;
const cellSize = 2;

//
const xmin = -2.25;
const xmax = 0.45;
const ymin = -1.18;
const ymax = 1.18;

const maxIterations = 90;

// drawing progress
let currentRow = 0;
let rowsPerFrame = 3;

// palette
const bgColor = [244, 239, 230];   // warm ivory
const lightLav = [210, 201, 225];  // pale lavender
const mistBlue = [145, 156, 186];  // misty blue
const smokeBlue = [86, 94, 118];   // smoky blue-gray
const deepInk = [23, 21, 28];      // ink black
const paleGold = [199, 168, 109];  // soft gold
const roseGray = [188, 176, 188];  // muted rose-gray

function setup() {
createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  background(bgColor[0], bgColor[1], bgColor[2]);
  noStroke();

  randomSeed(12);
  noiseSeed(12);
}

function draw() {
  for (let r = 0; r < rowsPerFrame; r++) {
    let py = currentRow * cellSize;

    if (py >= height) {
      addWatercolorWash();
      addRibbonLines();
      addGoldenDust();
      addPaperGrain();
      addFrame();
      noLoop();
      return;
    }

    for (let px = 0; px < width; px += cellSize) {
      const a0 = map(px, 0, width, xmin, xmax);
      const b0 = map(py, 0, height, ymin, ymax);

      let a = 0;
      let b = 0;
      let iteration = 0;

      for (let i = 0; i < maxIterations; i++) {
        const aa = a * a - b * b + a0;
        const bb = 2 * a * b + b0;

        a = aa;
        b = bb;

        if (a * a + b * b > 16) {
          break;
        }

        iteration++;
      }

      let col;

      if (iteration >= maxIterations - 1) {
        // Mandelbrot interior
        col = color(deepInk[0], deepInk[1], deepInk[2]);
      } else {
        let t = iteration / maxIterations;

        // multi-step palette interpolation
        if (t < 0.22) {
          col = lerpColor(
            color(bgColor[0], bgColor[1], bgColor[2]),
            color(lightLav[0], lightLav[1], lightLav[2]),
            map(t, 0, 0.22, 0, 1)
          );
        } else if (t < 0.5) {
          col = lerpColor(
            color(lightLav[0], lightLav[1], lightLav[2]),
            color(mistBlue[0], mistBlue[1], mistBlue[2]),
            map(t, 0.22, 0.5, 0, 1)
          );
        } else if (t < 0.82) {
          col = lerpColor(
            color(mistBlue[0], mistBlue[1], mistBlue[2]),
            color(smokeBlue[0], smokeBlue[1], smokeBlue[2]),
            map(t, 0.5, 0.82, 0, 1)
          );
        } else {
          col = lerpColor(
            color(smokeBlue[0], smokeBlue[1], smokeBlue[2]),
            color(deepInk[0], deepInk[1], deepInk[2]),
            map(t, 0.82, 1.0, 0, 1)
          );
        }

        // gold aura near boundary
        if (iteration > maxIterations * 0.70 && iteration < maxIterations * 0.95) {
          col = lerpColor(col, color(paleGold[0], paleGold[1], paleGold[2]), 0.28);
        }

        // subtle rosy softness
        if (iteration > maxIterations * 0.35 && iteration < maxIterations * 0.65) {
          col = lerpColor(col, color(roseGray[0], roseGray[1], roseGray[2]), 0.10);
        }

        // watercolor variation
        let n1 = noise(px * 0.01, py * 0.01);
        let n2 = noise(px * 0.03 + 100, py * 0.03 + 100);

        let rr = red(col) + map(n1, 0, 1, -10, 8);
        let gg = green(col) + map(n2, 0, 1, -8, 6);
        let bb2 = blue(col) + map(n1, 0, 1, -6, 12);

        col = color(
          constrain(rr, 0, 255),
          constrain(gg, 0, 255),
          constrain(bb2, 0, 255)
        );
      }

      fill(col);
      rect(px, py, cellSize, cellSize);
    }

    currentRow++;
  }
}

function addWatercolorWash() {
  push();
  noStroke();
  blendMode(MULTIPLY);

  // lavender wash
  for (let i = 0; i < 18; i++) {
    fill(205, 194, 224, 10);
    ellipse(
      width * 0.58 + random(-30, 30),
      height * 0.48 + random(-20, 20),
      180 + i * 26,
      90 + i * 14
    );
  }

  // misty blue layer
  for (let i = 0; i < 14; i++) {
    fill(140, 152, 182, 8);
    ellipse(
      width * 0.42 + random(-20, 20),
      height * 0.55 + random(-20, 20),
      220 + i * 20,
      70 + i * 12
    );
  }

  pop();
}

function addRibbonLines() {
  push();
  blendMode(BLEND);
  noFill();

  // fewer main golden ribbons with changing thickness
  for (let k = 0; k < 4; k++) {
    let baseWeight = random(1.5, 4.8);
    let yBase = map(k, 0, 3, height * 0.22, height * 0.78);

    let prevX = -80;
    let prevY =
      yBase +
      sin(prevX * 0.012 + k * 1.1) * 34 +
      sin(prevX * 0.031 + k * 2.4) * 18;

    for (let x = -60; x <= width + 80; x += 14) {
      let y =
        yBase +
        sin(x * 0.012 + k * 1.1) * 34 +
        sin(x * 0.031 + k * 2.4) * 18;

      let w = baseWeight + sin(x * 0.02 + k) * 1.8;
      w = constrain(w, 0.8, 6.0);

      stroke(214, 178, 96, 120);
      strokeWeight(w);
      line(prevX, prevY, x, y);

      prevX = x;
      prevY = y;
    }
  }

  // fewer pale ribbons with subtle thickness changes
  for (let k = 0; k < 5; k++) {
    let baseWeight = random(0.6, 2.2);
    let yBase = random(height * 0.18, height * 0.82);

    let prevX = -80;
    let prevY =
      yBase +
      sin(prevX * 0.018 + k * 1.4) * 24 +
      cos(prevX * 0.04 + k * 0.8) * 12;

    for (let x = -60; x <= width + 80; x += 12) {
      let y =
        yBase +
        sin(x * 0.018 + k * 1.4) * 24 +
        cos(x * 0.04 + k * 0.8) * 12;

      let w = baseWeight + cos(x * 0.03 + k * 2.0) * 0.9;
      w = constrain(w, 0.4, 3.0);

      stroke(255, 245, 220, 70);
      strokeWeight(w);
      line(prevX, prevY, x, y);

      prevX = x;
      prevY = y;
    }
  }

  // only a few vertical drifting strands
  for (let k = 0; k < 3; k++) {
    let baseWeight = random(0.8, 2.8);
    let xBase = random(width * 0.22, width * 0.78);

    let prevY = -80;
    let prevX =
      xBase +
      sin(prevY * 0.018 + k * 1.7) * 28 +
      cos(prevY * 0.035 + k) * 16;

    for (let y = -60; y <= height + 80; y += 14) {
      let x =
        xBase +
        sin(y * 0.018 + k * 1.7) * 28 +
        cos(y * 0.035 + k) * 16;

      let w = baseWeight + sin(y * 0.025 + k) * 1.0;
      w = constrain(w, 0.5, 3.8);

      stroke(185, 150, 82, 85);
      strokeWeight(w);
      line(prevX, prevY, x, y);

      prevX = x;
      prevY = y;
    }
  }

  pop();
}

function addGoldenDust() {
  push();
  noStroke();
  blendMode(SCREEN);

  // gold dust
  for (let i = 0; i < 1200; i++) {
    let x = random(width);
    let y = random(height);

    fill(220, 182, 92, random(28, 80));
    circle(x, y, random(0.7, 2.2));
  }

  // brighter star-like points
  for (let i = 0; i < 110; i++) {
    let x = random(width);
    let y = random(height);

    fill(255, 235, 190, random(70, 135));
    circle(x, y, random(1.2, 3.4));
  }

  pop();
}

function addPaperGrain() {
  push();
  noStroke();
  blendMode(BLEND);

  for (let i = 0; i < 3000; i++) {
    let x = random(width);
    let y = random(height);

    if (random() < 0.5) {
      fill(255, random(4, 10));
    } else {
      fill(60, 50, 70, random(3, 10));
    }

    rect(x, y, 1, 1);
  }

  pop();
}

function addFrame() {
  push();
  noFill();
  blendMode(BLEND);

  stroke(60, 52, 70, 40);
  strokeWeight(1.2);
  rect(18, 18, width - 36, height - 36);

  stroke(215, 205, 185, 50);
  strokeWeight(0.8);
  rect(24, 24, width - 48, height - 48);

  pop();
}
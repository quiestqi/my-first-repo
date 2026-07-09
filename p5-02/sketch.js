// Urchin Pattern Grid - Enriched Version (Refined)
// Interactive / animated 2D canvas
// Full 4 rows + variable block sizes + variable urchin sizes
// Reduced background ornaments + deeper blue background

let bgColor = "#263f9a";        // new deeper blue background
let outlineColor = "#e8dfc8";   // warm cream outline

// tile / block colors
let tilePalette = [
  "#111111", // black
  "#1a1a1a", // soft black
  "#b33a2b", // brick red
  "#d7652f", // orange red
  "#5d2a2e", // dark wine
  "#2e3a30", // dark green
  "#3d3144", // deep muted violet
  "#1f347f", // deep blue
  "#263f9a"  // new blue
];

// urchin body colors
let bodyPalette = [
  "#f1e8cf", // cream
  "#4e6fd8", // cobalt blue
  "#b06ad8", // violet
  "#e5b63d", // golden yellow
  "#e48642", // orange
  "#d98aa3"  // dusty pink
];

// spike / accent colors
let accentPalette = [
  "#f1e8cf", // cream
  "#c7b26a", // straw gold
  "#6f8d3f", // olive green
  "#3d60c8", // strong blue
  "#8d56b2", // purple
  "#d54a2f", // red orange
  "#1d1d1b"  // black ink
];

let seed;
let motionScale = 0.018;

const rowCount = 4;
const baseUnits = 12; // each row fills 12 units across
let rowH;
let unitW;

let cells = [];
let edgeUrchins = [];

function setup() {
createCanvas(windowWidth, windowHeight);
  strokeJoin(ROUND);
  rectMode(CORNER);

  seed = random(1000);

  rowH = height / rowCount;
  unitW = width / baseUnits;

  generateCells();
  generateEdgeUrchins();
}

function draw() {
  background(bgColor);
  randomSeed(seed);

  drawCellBackgrounds();
  addBackgroundOrnaments();

  for (let i = 0; i < cells.length; i++) {
    let c = cells[i];
    if (!c.empty) {
      drawUrchinCell(c, i);
    } else {
      drawEmptyCellMark(c);
    }
  }

  drawEdgeUrchins();
  addPuzzleLines();
  addFrame();
}

function mousePressed() {
  seed = random(1000);
  generateCells();
  generateEdgeUrchins();
}

function generateCells() {
  cells = [];

  for (let row = 0; row < rowCount; row++) {
    let usedUnits = 0;
    let y = row * rowH;

    while (usedUnits < baseUnits) {
      let remaining = baseUnits - usedUnits;

      let spanChoices = [1, 1, 2, 2, 3];
      let span = random(spanChoices);

      if (span > remaining) {
        span = remaining;
      }

      let w = span * unitW;
      let h = rowH;
      let x = usedUnits * unitW;

      let tileColor = randomTileColor();
      let secondaryColor = randomBodyColor();
      let accentColor = randomAccentColor();

      let empty = random() < 0.14;
      let sizePreset = random(["small", "small", "medium", "medium", "large"]);

      cells.push({
        x,
        y,
        w,
        h,
        cx: x + w / 2,
        cy: y + h / 2,
        row,
        span,
        tileColor,
        secondaryColor,
        accentColor,
        empty,
        selector: floor(random(6)),
        rotationSeed: random(TWO_PI),
        pulseSeed: random(1000),
        movementOffset: random(1000),
        sizePreset,
        textureSeed: floor(random(100000)),
        beadCount: floor(random(14, 24)),
        rayCount: floor(random(10, 18)),
        dotCount: floor(random(16, 32))
      });

      usedUnits += span;
    }
  }
}

function generateEdgeUrchins() {
  edgeUrchins = [];
  randomSeed(seed + 2024);

  let count = 5;
  for (let i = 0; i < count; i++) {
    let side = random(["left", "right", "top", "bottom"]);
    let s = random(32, 82);
    let x, y;

    if (side === "left") {
      x = random(-s * 2.0, -s * 0.55);
      y = random(height);
    } else if (side === "right") {
      x = random(width + s * 0.55, width + s * 2.0);
      y = random(height);
    } else if (side === "top") {
      x = random(width);
      y = random(-s * 2.0, -s * 0.55);
    } else {
      x = random(width);
      y = random(height + s * 0.55, height + s * 2.0);
    }

    edgeUrchins.push({
      x,
      y,
      size: s,
      selector: floor(random(6)),
      bodyColor: randomBodyColor(),
      accentColor: randomAccentColor(),
      rotationSeed: random(TWO_PI),
      movementOffset: random(1000),
      textureSeed: floor(random(100000)),
      beadCount: floor(random(14, 22)),
      rayCount: floor(random(10, 18)),
      dotCount: floor(random(16, 28))
    });
  }
}

function drawCellBackgrounds() {
  for (let c of cells) {
    stroke(outlineColor);
    strokeWeight(2);
    fill(c.tileColor);
    rect(c.x, c.y, c.w, c.h);

    noFill();
    stroke(232, 223, 200, 70);
    strokeWeight(0.8);
    rect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
  }
}

function drawUrchinCell(c, index) {
  let hover = getHoverAmount(c.cx, c.cy, max(c.w, c.h));

  let movement = map(
    sin(frameCount * motionScale + c.movementOffset),
    -1,
    1,
    0.78,
    1.14
  );

  let scaleBoost = 1 + hover * 0.22;

  push();
  translate(c.cx, c.cy);
  rotate(sin(frameCount * 0.006 + c.rotationSeed) * 0.08);
  scale(movement * scaleBoost);

  let minDim = min(c.w, c.h);

  let sizeFactor;
  if (c.sizePreset === "small") {
    sizeFactor = random(0.18, 0.24);
  } else if (c.sizePreset === "medium") {
    sizeFactor = random(0.26, 0.33);
  } else {
    sizeFactor = random(0.34, 0.44);
  }

  if (c.w < 90 && c.sizePreset === "large") {
    sizeFactor *= 0.88;
  }

  let graphicSize = minDim * sizeFactor;

  drawOuterBeads(c, graphicSize, hover);
  drawBaseUrchin(c.selector, c, graphicSize, hover);
  drawInnerTexture(c, graphicSize, hover);

  pop();
}

function drawEdgeUrchins() {
  for (let e of edgeUrchins) {
    push();
    translate(e.x, e.y);
    rotate(sin(frameCount * 0.005 + e.rotationSeed) * 0.05);

    let movement = map(
      sin(frameCount * motionScale + e.movementOffset),
      -1,
      1,
      0.92,
      1.06
    );
    scale(movement);

    drawOuterBeads(e, e.size, 0.08);
    drawBaseUrchin(e.selector, e, e.size, 0.08);
    drawInnerTexture(e, e.size, 0.08);

    pop();
  }
}

function drawBaseUrchin(selector, data, graphicSize, hover) {
  if (selector === 0) {
    urchinSun(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  } else if (selector === 1) {
    urchinRing(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  } else if (selector === 2) {
    urchinLongSpikes(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  } else if (selector === 3) {
    urchinDotBody(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  } else if (selector === 4) {
    urchinCrown(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  } else {
    urchinStarBody(graphicSize, data.bodyColor || data.secondaryColor, data.accentColor, hover);
  }
}

function getHoverAmount(cx, cy, sizeRef) {
  let d = dist(mouseX, mouseY, cx, cy);
  return constrain(map(d, sizeRef * 1.15, 0, 0, 1), 0, 1);
}

function urchinSun(s, bodyCol, spikeCol, hover) {
  let outerR = s * 1.55;
  let innerR = s * 0.78;
  let spikes = 28;

  stroke(spikeCol);
  strokeWeight(2.2 + hover * 1.6);

  for (let i = 0; i < spikes; i++) {
    let a = TWO_PI * i / spikes;
    let r1 = innerR * 0.95;
    let r2 = outerR * (1 + hover * 0.18);
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  fill(bodyCol);
  stroke(outlineColor);
  strokeWeight(2);
  circle(0, 0, innerR * 2.2);

  fill(spikeCol);
  noStroke();
  circle(0, 0, innerR * 0.55);
}

function urchinRing(s, bodyCol, spikeCol, hover) {
  let r = s * 1.18;
  let spikes = 22;

  stroke(spikeCol);
  strokeWeight(2 + hover * 1.5);

  for (let i = 0; i < spikes; i++) {
    let a = TWO_PI * i / spikes;
    let r1 = r * 0.75;
    let r2 = r * (1.22 + hover * 0.2);
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  fill(bodyCol);
  stroke(outlineColor);
  strokeWeight(2);
  circle(0, 0, r * 1.7);

  fill(bgColor);
  stroke(outlineColor);
  strokeWeight(1.8);
  circle(0, 0, r * 0.75);

  fill(spikeCol);
  noStroke();
  circle(0, 0, r * 0.28);
}

function urchinLongSpikes(s, bodyCol, spikeCol, hover) {
  let coreR = s * 0.70;
  let spikes = 18;

  stroke(spikeCol);
  strokeWeight(3 + hover * 2);

  for (let i = 0; i < spikes; i++) {
    let a = TWO_PI * i / spikes;
    let r2 = s * 1.75 * (1 + hover * 0.2);
    line(cos(a) * coreR, sin(a) * coreR, cos(a) * r2, sin(a) * r2);
  }

  fill(bodyCol);
  stroke(outlineColor);
  strokeWeight(2);
  circle(0, 0, coreR * 2.2);

  fill(spikeCol);
  noStroke();
  circle(0, 0, coreR * 0.7);
}

function urchinDotBody(s, bodyCol, spikeCol, hover) {
  let r = s * 1.12;

  fill(bodyCol);
  stroke(outlineColor);
  strokeWeight(2);
  circle(0, 0, r * 2);

  stroke(spikeCol);
  strokeWeight(1.8 + hover * 1.2);

  let spikes = 24;
  for (let i = 0; i < spikes; i++) {
    let a = TWO_PI * i / spikes;
    let r1 = r * 0.9;
    let r2 = r * (1.22 + hover * 0.18);
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  fill(outlineColor);
  noStroke();
  circle(0, 0, r * 0.38);
}

function urchinCrown(s, bodyCol, spikeCol, hover) {
  let r = s * 0.98;
  let points = 12;

  fill(bodyCol);
  stroke(outlineColor);
  strokeWeight(2);

  beginShape();
  for (let i = 0; i < points * 2; i++) {
    let a = TWO_PI * i / (points * 2);
    let rr = i % 2 === 0 ? r * (1.3 + hover * 0.18) : r * 0.78;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);

  fill(spikeCol);
  noStroke();
  circle(0, 0, r * 0.9);

  fill(outlineColor);
  circle(0, 0, r * 0.32);
}

function urchinStarBody(s, bodyCol, spikeCol, hover) {
  let r = s * 1.02;
  let points = 16;

  stroke(spikeCol);
  strokeWeight(1.8 + hover * 1.5);
  fill(bodyCol);

  beginShape();
  for (let i = 0; i < points * 2; i++) {
    let a = TWO_PI * i / (points * 2);
    let rr = i % 2 === 0 ? r * (1.35 + hover * 0.16) : r * 0.72;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);

  fill(spikeCol);
  noStroke();
  circle(0, 0, r * 0.58);

  fill(outlineColor);
  circle(0, 0, r * 0.22);
}

function drawOuterBeads(data, s, hover) {
  randomSeed(data.textureSeed + 77);

  let count = data.beadCount || 18;
  let r = s * 1.55;

  noStroke();
  for (let i = 0; i < count; i++) {
    let a = TWO_PI * i / count + sin(frameCount * 0.01 + i) * 0.04;
    let beadR = r + sin(frameCount * 0.018 + i) * 2;
    let x = cos(a) * beadR;
    let y = sin(a) * beadR;
    let beadSize = random(2.0, 4.5) + hover * 0.8;

    fill(random([outlineColor, data.accentColor, data.bodyColor || data.secondaryColor]));
    circle(x, y, beadSize);
  }
}

function drawInnerTexture(data, s, hover) {
  randomSeed(data.textureSeed);

  let bodyCol = data.bodyColor || data.secondaryColor;
  let accentCol = data.accentColor;

  noFill();
  stroke(outlineColor);
  strokeWeight(1.0 + hover * 0.5);
  circle(0, 0, s * 0.72);

  noFill();
  stroke(accentCol);
  strokeWeight(0.9 + hover * 0.5);
  circle(0, 0, s * 0.46);

  stroke(accentCol);
  strokeWeight(1.0 + hover * 0.5);
  let rayCount = data.rayCount || 14;
  for (let i = 0; i < rayCount; i++) {
    let a = TWO_PI * i / rayCount + random(-0.08, 0.08);
    let r1 = s * random(0.22, 0.34);
    let r2 = s * random(0.42, 0.58);
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  noStroke();
  let dotCount = data.dotCount || 22;
  for (let i = 0; i < dotCount; i++) {
    let a = random(TWO_PI);
    let rr = random(s * 0.12, s * 0.72);
    let d = random(2.0, 5.0) + hover * 0.4;
    fill(random([accentCol, bodyCol, outlineColor]));
    circle(cos(a) * rr, sin(a) * rr, d);
  }

  for (let i = 0; i < 8; i++) {
    let a = TWO_PI * i / 8;
    let rr = s * 0.16;
    fill(random([accentCol, outlineColor]));
    circle(cos(a) * rr, sin(a) * rr, 2.2 + hover * 0.2);
  }

  fill(accentCol);
  circle(0, 0, s * 0.20);
  fill(outlineColor);
  circle(0, 0, s * 0.08);
}

function drawEmptyCellMark(c) {
  push();
  translate(c.cx, c.cy);

  noFill();
  stroke(outlineColor);
  strokeWeight(1.4);
  circle(0, 0, min(c.w, c.h) * 0.12);

  stroke("#d9b24c");
  strokeWeight(1);
  line(-min(c.w, c.h) * 0.08, 0, min(c.w, c.h) * 0.08, 0);
  line(0, -min(c.w, c.h) * 0.08, 0, min(c.w, c.h) * 0.08);

  pop();
}

function randomTileColor() {
  return random(tilePalette);
}

function randomBodyColor() {
  return random(bodyPalette);
}

function randomAccentColor() {
  return random(accentPalette);
}

function addBackgroundOrnaments() {
  push();
  randomSeed(seed + 999);

  // 1. fewer random colored dots
  noStroke();
  let dotCount = floor(random(35, 65));
  for (let i = 0; i < dotCount; i++) {
    let x = random(width);
    let y = random(height);

    let c = random([
      "#d54a2f",
      "#e5b63d",
      "#f1e8cf",
      "#6f8d3f",
      "#8d56b2"
    ]);

    let s = random(2, 5);

    if (random() < 0.65) {
      fill(c);
    } else {
      fill(241, 232, 207, 180);
    }

    circle(x, y, s);

    if (random() < 0.18) {
      fill("#f1e8cf");
      circle(x, y, s * 0.38);
    }
  }

  // 2. fewer, more scattered flower clusters
  let clusterCount = floor(random(6, 12));
  for (let k = 0; k < clusterCount; k++) {
    let cx = random(width);
    let cy = random(height);

    let petals = floor(random(4, 7));
    let r = random(3, 7);

    fill(241, 232, 207, 220);

    for (let i = 0; i < petals; i++) {
      let a = TWO_PI * i / petals;
      circle(
        cx + cos(a) * r,
        cy + sin(a) * r,
        random(1.8, 3.2)
      );
    }

    fill("#d9b24c");
    circle(cx, cy, random(1.5, 3));
  }

  // 3. very few rings
  noFill();
  stroke(232, 223, 200, 120);
  strokeWeight(0.8);

  let ringCount = floor(random(4, 8));
  for (let i = 0; i < ringCount; i++) {
    let x = random(width);
    let y = random(height);
    circle(x, y, random(7, 14));
  }

  pop();
}

function addPuzzleLines() {
  push();
  noFill();
  stroke(255, 245, 220, 24);
  strokeWeight(0.7);

  for (let y = 0; y <= height; y += rowH / 2) {
    line(0, y, width, y);
  }

  for (let x = 0; x <= width; x += unitW) {
    line(x, 0, x, height);
  }

  pop();
}

function addFrame() {
  push();
  noFill();

  stroke("#2a241f");
  strokeWeight(3);
  rect(0, 0, width, height);

  stroke(outlineColor);
  strokeWeight(1);
  rect(10, 10, width - 20, height - 20);

  pop();
}
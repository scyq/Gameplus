// General Parameters
let backgroundColor = null;
let canvasWidth = 640;
let canvasHeight = 640;

// Game Control
let mode = "instructions";

// instruction
let showInstructions = true;

// Color
const palette = {
    faceColor: []
};

// Changeable Parameters
const Params = {
    eyesRadius: null,
    sculptureForce: 10,
    sculptureRadius: 50,
    faceNoise: true,
}

// Noise Parameters
let xoff = 0;
let yoff = 0;
let zoff = 0;

// Face Generation Parameters
let faceAngleStep = 0.01;
let facePointCounts = null;
let faceBaseRadius = 120;
let faceRadius = [];

// Eyes Parameters
let halfEyesGap = null;
let eyesXAnchor = null;
let eyesYAnchor = null;
let eyesPositions = [];

// Mouth Parameters
let mouthXAnchor = null; // 嘴巴的最左侧
let mouthYAnchor = null;
let halfMouthWidth = null;
let mouthAnchorPosition = [];

// Mouse Control
let mousePressedTime = 0;
let continuesSculptThreshold = 1000;

function drawGradientBackground() {
    let circleRadius = 200;
    let baseMaxAlpha = 100;

    push();
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let distanceBetweenCenter = dist(i, j, width / 2, height / 2);
            // 绘制中心圆
            if (distanceBetweenCenter < circleRadius) {
                let alpha =
                    map(j, 0, height, baseMaxAlpha, 0);
                let pixelColor = color(
                    red(backgroundColor),
                    green(backgroundColor),
                    blue(backgroundColor),
                    alpha
                );
                fill(pixelColor);
                noStroke();
                ellipse(i, j, 1, 1);
            }
            // 绘制背景
            else {
                let alpha = map(j, 0, height, 0, baseMaxAlpha);
                let pixelColor = color(
                    red(backgroundColor),
                    green(backgroundColor),
                    blue(backgroundColor),
                    alpha
                );
                fill(pixelColor);
                noStroke();
                ellipse(i, j, 1, 1);
            }
        }
    }
    pop();
}

function grainFilter() {
    loadPixels();
    for (let i = 3; i < pixels.length; i += 4) {
        pixels[i] += randomGaussian(0, 20);
    }
    updatePixels();
}

function setup() {
    createCanvas(canvasWidth, canvasHeight);

    // 初始化种子
    let seed = new Date().getTime();
    randomSeed(seed);
    noiseSeed(seed);

    textAlign(CENTER);
    backgroundColor = color(random(255), random(255), random(255));

    // face
    facePointCounts = floor(2 * PI / faceAngleStep);
    palette.faceColor = [random(255), random(255), random(255), random(180, 220)];
    faceRadius.length = facePointCounts;
    faceRadius.fill(faceBaseRadius);

    // eyes
    halfEyesGap = random(25, 50);
    eyesXAnchor = width / 2;
    eyesYAnchor = height / 2 - 40;
    Params.eyesRadius = random(5, 40);
    eyesPositions = [
        [eyesXAnchor - halfEyesGap + 10 * randomGaussian(0, 1), eyesYAnchor + 10 * randomGaussian(0, 1)],
        [eyesXAnchor + halfEyesGap + 10 * randomGaussian(0, 1), eyesYAnchor + 10 * randomGaussian(0, 1)]
    ]

    // 找到眼睛中间高度
    let eyesMiddleHeight = (eyesPositions[0][1] + eyesPositions[1][1]) / 2;
    let gapBetweenEyesAndMouth = random(20, 100);

    mouthXAnchor = width / 2; // 嘴巴的最左侧
    mouthYAnchor = eyesMiddleHeight + gapBetweenEyesAndMouth;
    halfMouthWidth = random(20, 100);

    // 基于贝塞尔曲线画嘴，先定义两个锚点
    mouthAnchorPosition = [
        [mouthXAnchor - halfMouthWidth + 10 * randomGaussian(0, 1), mouthYAnchor + randomGaussian(0, 1)],
        [mouthXAnchor + halfMouthWidth + 10 * randomGaussian(0, 1), mouthYAnchor + randomGaussian(0, 1)]
    ]

    initGUI();
}

function draw() {
    // drawGradientBackground();
    background(255);

    if (mode == "instructions") {
        instructions();
        return;
    } else {
        drawFace();
        drawFacialFeatures();

        // 是否持续雕刻
        if (mouseIsPressed) {
            mousePressedTime += deltaTime;
            if (mousePressedTime > continuesSculptThreshold) {
                sculpt(Params.sculptureForce / 60);
            }
        }
    }

    // grainFilter();

    xoff += 0.005;
    yoff += 0.005;
    zoff += 0.005;
}


function instructions() {
    push();

    textSize(22);
    fill(255, 0, 0);
    let title = "Make a Monster";
    text(title, width / 2, height / 2);

    textSize(16);
    fill(0, 0, 0);
    let instructions = "Click to make a face";
    text(instructions, width / 2, height / 2 + 30);
    pop();
}

function drawFacialFeatures() {
    push();
    fill(0);

    // eyes
    circle(eyesPositions[0][0], eyesPositions[0][1], Params.eyesRadius);
    circle(eyesPositions[1][0], eyesPositions[1][1], Params.eyesRadius);

    // mouth
    stroke(0);
    noFill();
    strokeWeight(2);
    beginShape();
    let mouthCenterX = (mouthAnchorPosition[0][0] + mouthAnchorPosition[1][0]) / 2;
    let mouthCenterY = (mouthAnchorPosition[0][1] + mouthAnchorPosition[1][1]) / 2;
    vertex(mouthAnchorPosition[0][0], mouthAnchorPosition[0][1]);    // 起始锚点
    quadraticVertex(mouthCenterX + 20 * noise(xoff, yoff, zoff),
        mouthCenterY + 20 * noise(xoff, yoff, zoff),
        mouthAnchorPosition[1][0], mouthAnchorPosition[1][1]);    // 控制点和结束锚点

    endShape();
    noStroke();

    pop();
}

function drawFace() {
    push();
    noStroke();
    fill(color(...palette.faceColor));
    beginShape();
    let xCenter = width / 2;
    let yCenter = height / 2;
    let tightness = 0.5;

    for (let i = 0; i < facePointCounts; i++) {
        let theta = i * faceAngleStep;
        let r1, r2;
        if (theta < PI / 2) {
            r1 = cos(theta);
            r2 = 1;
        } else if (theta < PI) {
            r1 = 0;
            r2 = sin(theta);
        } else if (theta < 3 * PI / 2) {
            r1 = sin(theta);
            r2 = 0;
        } else {
            r1 = 1;
            r2 = cos(theta);
        }
        let faceNoise = Params.faceNoise ? faceRadius[i] * noise(tightness * r1, tightness * r2, xoff) : 0;
        let r = faceRadius[i] + faceNoise;
        let x = xCenter + r * cos(theta);
        let y = yCenter + r * sin(theta);
        curveVertex(x, y);
    }

    endShape(CLOSE);
    pop();
}

// 隆起函数, 0 outside [-1, 1], argmax = 0
function bump(x) {
    if (abs(x) < 1) {
        return (sin(PI * (x + 0.5)) + 1) / 2;
        // return (exp(-1 / (1 - x ** 2)));
    } else {
        return 0;
    }
}

function sculpt(force) {
    let v = createVector(mouseX - width / 2, mouseY - height / 2);
    let theta = map(v.heading(), -PI, PI, PI, 3 * PI);
    let idx = floor(theta / faceAngleStep);
    if (keyIsPressed) {
        force *= -1;
    }

    let i1 = floor(idx - Params.sculptureRadius / 2);
    let i2 = i1;

    if (i1 < 0) {
        i1 += facePointCounts;
    }

    while (i2 < idx + Params.sculptureRadius / 2) {
        let x = (2 * (i2 - idx)) / Params.sculptureRadius;
        let y = force * bump(x);
        if (faceRadius[i1] + y > 0) {
            faceRadius[i1] += y;
        }
        i1++;
        if (i1 >= facePointCounts) {
            i1 -= facePointCounts;
        }
        i2++;
    }
}

function initGUI() {
    const gui = new dat.GUI();

    let noiseFolder = gui.addFolder("Noise");
    noiseFolder.add(Params, "faceNoise").name("Face Noise");
    noiseFolder.open();

    let faceFolder = gui.addFolder("Face");
    faceFolder.addColor(palette, 'faceColor').name("Face Color");
    faceFolder.add(Params, 'eyesRadius', 5, 40).name("Eyes Radius");
    faceFolder.open();

    let sculptureFolder = gui.addFolder("Sculpture");
    sculptureFolder.add(Params, 'sculptureForce', 1, 20).name("Force");
    sculptureFolder.add(Params, 'sculptureRadius', 10, 100).name("Radius");
    sculptureFolder.open();

}


function mouseClicked() {

    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        if (mode == "instructions") {
            mode = "play";
            return;
        }

        sculpt(Params.sculptureForce);
    }
}

function keyPressed() {
    if (key == "s") {
        saveCanvas("MyMonster", "png");
    }
}

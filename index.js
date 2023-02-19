// Math
const Rad2Deg = 180 / Math.PI;
const Deg2Rad = Math.PI / 180;

// General Parameters
let backgroundColor = null;
let canvasWidth = 640;
let canvasHeight = 640;

// Game Control
let mode = "instructions";
let outerSculptureMode = true;
let gameStage = 0;
let gameStages = ["雕刻", "后处理"];

// instruction
let showInstructions = true;

// Color
const palette = {
	faceColor: [],
};
let colors = null;
let colors1 = "ed1c24-fdfffc-235789-f1d302-020100".split("-").map((a) => "#" + a);
let colors2 = "2b2d42-8d99ae-edf2f4-ef233c-d80032".split("-").map((a) => "#" + a);
let colors3 = "d6fff6-231651-4dccbd-2374ab-ff8484".split("-").map((a) => "#" + a);
let colors4 = "a9e5bb-fcf6b1-f7b32b-f72c25-2d1e2f".split("-").map((a) => "#" + a);
let colors5 = "ff8811-f4d06f-fff8f0-9dd9d2-392f5a".split("-").map((a) => "#" + a);
let colors6 = "c5d86d-261c15-f7f7f2-e4e6c3-f05d23".split("-").map((a) => "#" + a);
let colors7 = "ff6700-ebebeb-c0c0c0-3a6ea5-004e98".split("-").map((a) => "#" + a);
let colors8 = "020202-0d2818-04471c-058c42-16db65".split("-").map((a) => "#" + a);
let colors9 = "003049-d62828-f77f00-fcbf49-eae2b7".split("-").map((a) => "#" + a);
let colors10 = "00072d-001c55-0a2472-0e6ba8-a6e1fa".split("-").map((a) => "#" + a);
let colors11 = "6b2d5c-f0386b-ff5376-f8c0c8-e2c290".split("-").map((a) => "#" + a);
let colors12 = "fb8b24-d90368-820263-291720-04a777".split("-").map((a) => "#" + a);

// Changeable Parameters
const Params = {
	eyesRadius: null,
	sculptureForce: 10,
	sculptureRadius: 50,
	scale: 1.0,
	rotation: 0.0, // Degree
	faceNoise: true,
	halfMouthWidth: 100,
	mouthHeight: 100,
};

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
let mouthCategories = ["curve", "arc"];
let mouthCategory = null;
let mouthXAnchor = null; // 嘴巴的最左侧
let mouthYAnchor = null;
let mouthAnchorPosition = [];

// Mouse Control
let mousePressedTime = 0;
let continuesSculptThreshold = 1000;

// Parameters Panel
let gui = null;

// Background
let backgroundType;
let backgroundFunction = null;

function grainFilter() {
	loadPixels();
	for (let i = 3; i < pixels.length; i += 4) {
		pixels[i] += randomGaussian(0, 20);
	}
	updatePixels();
}

function checkMouseInCanvas() {
	return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

function randomBackgroundParams() {
	backgroundColor = color(random(255), random(255), random(255));
	backgroundType = random(["rect", "circle", "triangle", "strip", "wave"]);

	colors = random([
		colors1,
		colors2,
		colors3,
		colors4,
		colors5,
		colors6,
		colors7,
		colors8,
		colors9,
		colors10,
		colors11,
		colors12,
	]);
	colors = colors.sort((a, b) => (random() < 0.5 ? 1 : -1));
}

function setup() {
	createCanvas(canvasWidth, canvasHeight);

	// 初始化种子
	let seed = new Date().getTime();
	randomSeed(seed);
	noiseSeed(seed);

	textAlign(CENTER);
	randomBackgroundParams();

	// face
	facePointCounts = floor((2 * PI) / faceAngleStep);
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
		[eyesXAnchor + halfEyesGap + 10 * randomGaussian(0, 1), eyesYAnchor + 10 * randomGaussian(0, 1)],
	];

	// 找到眼睛中间高度
	let eyesMiddleHeight = (eyesPositions[0][1] + eyesPositions[1][1]) / 2;
	let gapBetweenEyesAndMouth = random(20, 100);

	// mouth
	// 先确定嘴巴的类型
	mouthCategory = random(mouthCategories);
	mouthXAnchor = width / 2; // 嘴巴的最左侧
	mouthYAnchor = eyesMiddleHeight + gapBetweenEyesAndMouth;
	Params.halfMouthWidth = random(20, 200);
	Params.mouthHeight = random(-200, 200);

	// 基于贝塞尔曲线画嘴，先定义两个锚点
	mouthAnchorPosition = [
		[mouthXAnchor - Params.halfMouthWidth + 10 * randomGaussian(0, 1), mouthYAnchor + randomGaussian(0, 1)],
		[mouthXAnchor + Params.halfMouthWidth + 10 * randomGaussian(0, 1), mouthYAnchor + randomGaussian(0, 1)],
	];

	initGUI();
}

function draw() {
	// drawGradientBackground();
	background(255);

	if (mode == "instructions") {
		instructions();
		return;
	} else {
		backgroundFunction ? backgroundFunction() : null;
		drawFace();
		drawFacialFeatures();

		// 是否持续雕刻
		if (checkMouseInCanvas() && mouseIsPressed) {
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

function polygon(x, y, radius, npoints) {
	let angle = TWO_PI / npoints;
	beginShape();
	for (let a = 0; a < TWO_PI; a += angle) {
		let sx = x + cos(a) * radius;
		let sy = y + sin(a) * radius;
		vertex(sx, sy);
	}
	endShape(CLOSE);
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

function generalTransform() {
	translate(width / 2, height / 2);
	scale(Params.scale);
	rotate(Params.rotation * Deg2Rad);
	translate(-width / 2, -height / 2);
}

function mapNoise(min, max) {
	return map(noise(xoff, yoff, zoff), 0, 1, min, max);
}

// TODO 需要完全重构，把所有的参数都放到一个对象里面，基于面向对象编程
// TODO 应该参考伴侣而不是利用噪声
function randomChild() {
	// 基于当前参数生成一个新的孩子
	let baseColor = palette.faceColor;
	let newColor = [
		baseColor[0] + mapNoise(-1, 1) * 50,
		baseColor[1] + mapNoise(-1, 1) * 50,
		baseColor[2] + mapNoise(-1, 1) * 50,
		baseColor[3] + mapNoise(-1, 1) * 50,
	];
	defineReactive(palette, "faceColor", newColor);
	// palette.faceColor = newColor;
	faceRadius = [];
	faceRadius.length = facePointCounts;
	faceBaseRadius += mapNoise(-1, 1) * 50;
	faceRadius.fill(faceBaseRadius);
	defineReactive(Params, "eyesRadius", Params.eyesRadius + mapNoise(-1, 1) * 50);
	defineReactive(Params, "halfMouthWidth", Params.halfMouthWidth + mapNoise(-1, 1) * 50);
	defineReactive(Params, "mouthHeight", Params.mouthHeight + mapNoise(-1, 1) * 50);
	// Params.eyesRadius = Params.eyesRadius + mapNoise(-1, 1) * 50;
	// Params.halfMouthWidth = Params.halfMouthWidth + mapNoise(-1, 1) * 50;
	// Params.mouthHeight = Params.mouthHeight + mapNoise(-1, 1) * 50;
}

function drawCurveMouth() {
	push();
	stroke(0);
	noFill();
	strokeWeight(2);
	beginShape();

	// 先更新嘴巴的锚点
	mouthAnchorPosition = [
		[mouthXAnchor - Params.halfMouthWidth, mouthYAnchor],
		[mouthXAnchor + Params.halfMouthWidth, mouthYAnchor],
	];

	let mouthCenterX = (mouthAnchorPosition[0][0] + mouthAnchorPosition[1][0]) / 2;
	let mouthCenterY = (mouthAnchorPosition[0][1] + mouthAnchorPosition[1][1]) / 2;
	vertex(mouthAnchorPosition[0][0], mouthAnchorPosition[0][1]); // 起始锚点
	quadraticVertex(
		mouthCenterX + 20 * noise(xoff, yoff, zoff),
		mouthCenterY + 20 * noise(xoff, yoff, zoff) + Params.mouthHeight,
		mouthAnchorPosition[1][0],
		mouthAnchorPosition[1][1]
	); // 控制点和结束锚点

	endShape();
	noStroke();
	pop();
}

function drawArcMouth() {
	push();
	fill(0);
	noStroke();

	// 先更新嘴巴的锚点
	mouthAnchorPosition = [
		[mouthXAnchor - Params.halfMouthWidth, mouthYAnchor],
		[mouthXAnchor + Params.halfMouthWidth, mouthYAnchor],
	];
	//TODO 噪声
	arc(mouthXAnchor, mouthYAnchor, 2 * Params.halfMouthWidth, Params.mouthHeight, 0, PI);
	pop();
}

function drawFacialFeatures() {
	push();
	fill(0);
	generalTransform();

	// eyes
	circle(eyesPositions[0][0], eyesPositions[0][1], Params.eyesRadius);
	circle(eyesPositions[1][0], eyesPositions[1][1], Params.eyesRadius);

	// mouth

	switch (mouthCategory) {
		case "curve":
			drawCurveMouth();
			break;
		case "arc":
			drawArcMouth();
		default:
			break;
	}

	pop();
}

function drawFace() {
	push();
	noStroke();
	generalTransform();
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
		} else if (theta < (3 * PI) / 2) {
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
	if (!outerSculptureMode) {
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

function observe(data) {
	if (!data || typeof data !== "object") {
		return;
	}
	// 取出所有属性遍历
	Object.keys(data).forEach(function (key) {
		defineReactive(data, key, data[key]);
	});
}

function defineReactive(data, key, val) {
	console.log("defineReactive", key, val);
	observe(val); // 监听子属性
	Object.defineProperty(data, key, {
		enumerable: false, // 可枚举
		configurable: true, // 能否再define
		get: function () {
			return val;
		},
		set: function (newVal) {
			console.log("1");
			val = newVal;
		},
	});
}

function initGUI() {
	gui = new dat.GUI();

	let generalFolder = gui.addFolder("General");
	generalFolder.add(Params, "scale", 0.1, 2.0).name("Scale");
	generalFolder.add(Params, "rotation", -180, 180).name("Rotation");
	generalFolder.open();

	let noiseFolder = gui.addFolder("Noise");
	noiseFolder.add(Params, "faceNoise").name("Face Noise");
	noiseFolder.open();

	let faceFolder = gui.addFolder("Face");
	faceFolder.addColor(palette, "faceColor").name("Face Color");
	faceFolder.add(Params, "eyesRadius", 5, 40).name("Eyes Radius");
	faceFolder.add(Params, "halfMouthWidth", 20, 200).name("Half Mouth Width");
	faceFolder.add(Params, "mouthHeight", -200, 200).name("Mouth Height");
	faceFolder.open();

	let sculptureFolder = gui.addFolder("Sculpture");
	sculptureFolder.add(Params, "sculptureForce", 1, 20).name("Force");
	sculptureFolder.add(Params, "sculptureRadius", 10, 100).name("Radius");
	sculptureFolder.open();

	gui.close();
}

function generateRandomGeometryBackground() {
	push();

	push();
	//bg
	fill(colors[3]);
	rect(0, 0, width, height);
	noStroke();
	pop();

	noStroke();
	let cir = 200;
	for (let y = -height / 2 - cir / 2; y < height / 2 + cir * 2; y += cir) {
		let xSpan = cir;
		if (backgroundType == "wave") {
			beginShape();
			y += cir;
			xSpan = 40;
		}
		for (let x = -width / 2 - cir / 2; x < width / 2 + cir * 2; x += xSpan) {
			fill(colors[4]);
			if (backgroundType == "rect") {
				rect(x, y, cir * 0.8, cir * 0.8);
			} else if (backgroundType == "strip") {
				rect(x, y, cir * 3, cir * 0.4);
			} else if (backgroundType == "triangle") {
				polygon(x, y, cir * 0.8, 3);
			} else if (backgroundType == "wave") {
				curveVertex(x, y + (sin(x / 100 + y + frameCount / (100 + sin(y / 50) * 50)) * cir) / 2);
			} else {
				ellipse(x, y, cir * 0.8, cir * 0.8);
			}
		}
		if (backgroundType == "wave") {
			stroke(colors[4]);
			noFill();
			strokeWeight(cir * 0.8);
			endShape();
		}
	}
	pop();
}

function generateColorBackground() {
	push();
	//bg
	background(backgroundColor);
	pop();
}

function generateGradientBackground() {
	let circleRadius = 200;
	let baseMaxAlpha = 100;

	push();
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			let distanceBetweenCenter = dist(i, j, width / 2, height / 2);
			// 绘制中心圆
			if (distanceBetweenCenter < circleRadius) {
				let alpha = map(j, 0, height, baseMaxAlpha, 0);
				let pixelColor = color(red(backgroundColor), green(backgroundColor), blue(backgroundColor), alpha);
				fill(pixelColor);
				noStroke();
				ellipse(i, j, 1, 1);
			}
			// 绘制背景
			else {
				let alpha = map(j, 0, height, 0, baseMaxAlpha);
				let pixelColor = color(red(backgroundColor), green(backgroundColor), blue(backgroundColor), alpha);
				fill(pixelColor);
				noStroke();
				ellipse(i, j, 1, 1);
			}
		}
	}
	pop();
}

function mouseClicked() {
	if (checkMouseInCanvas()) {
		if (mode == "instructions") {
			mode = "play";
			gui.open();
			return;
		}

		sculpt(Params.sculptureForce);
	}
}

function keyPressed() {
	if (key == "s") {
		saveCanvas("MyMonster", "png");
	}

	if (key == "q") {
		outerSculptureMode = !outerSculptureMode;
		document.getElementById("sculpt-mode").innerHTML = `当前模式: <span class="attention">${
			outerSculptureMode ? "外凸" : "内凹"
		} </span>`;
	}

	if (key == "n") {
		gameStage = (gameStage + 1) % gameStages.length;
		document.getElementById(
			"stage"
		).innerHTML = `当前阶段: <span class="attention"> ${gameStages[gameStage]} </span>`;
	}

	if (key == "b") {
		backgroundFunction = random([generateColorBackground, generateRandomGeometryBackground]);
		randomBackgroundParams();
	}

	if (key == "f") {
		randomChild();
	}
}

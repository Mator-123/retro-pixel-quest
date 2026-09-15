const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreLabel = document.getElementById('score');
const livesLabel = document.getElementById('lives');
const keysLabel = document.getElementById('keys');
const levelLabel = document.getElementById('level');
const message = document.getElementById('message');
const mathPanel = document.getElementById('mathPanel');
const mathQuestion = document.getElementById('mathQuestion');
const mathAnswer = document.getElementById('mathAnswer');
const successFade = document.getElementById('successFade');
const successPanel = document.getElementById('successPanel');
const nextWorldButton = document.getElementById('nextWorldButton');
const restartButton = document.getElementById('restartButton');
const startMenu = document.getElementById('startMenu');
const continueButton = document.getElementById('continueButton');
const firstLevelButton = document.getElementById('firstLevelButton');
const chooseLevelButton = document.getElementById('chooseLevelButton');
const levelSelect = document.getElementById('levelSelect');
const exitButton = document.getElementById('exitButton');

const world = {
	width: 2400,
	height: 540,
	gravity: 0.65,
	groundY: 470
};

const keys = { left: false, right: false };
const player = {
	x: 80,
	y: 428,
	width: 30,
	height: 42,
	velocityX: 0,
	velocityY: 0,
	speed: 3.8,
	jumpPower: -12.5,
	grounded: false,
	invulnerable: 0
};

const platforms = [
	{ x: 0, y: 470, width: 700, height: 70 },
	{ x: 790, y: 470, width: 620, height: 70 },
	{ x: 1490, y: 470, width: 910, height: 70 },
	{ x: 280, y: 365, width: 220, height: 30 },
	{ x: 515, y: 300, width: 220, height: 30 },
	{ x: 875, y: 360, width: 210, height: 30 },
	{ x: 1110, y: 275, width: 220, height: 30 },
	{ x: 1560, y: 350, width: 220, height: 30 },
	{ x: 1810, y: 285, width: 220, height: 30 },
	{ x: 2070, y: 370, width: 220, height: 30 }
];

const coins = [
	{ x: 330, y: 325, collected: false }, { x: 565, y: 260, collected: false },
	{ x: 925, y: 315, collected: false }, { x: 1165, y: 230, collected: false },
	{ x: 1610, y: 305, collected: false }, { x: 1860, y: 240, collected: false },
	{ x: 2120, y: 325, collected: false }, { x: 1370, y: 420, collected: false }
];

const keyholes = [
	{ x: 2290, y: 240, collected: false },
	{ x: 2320, y: 240, collected: false },
	{ x: 2350, y: 240, collected: false }
];

const boxes = [
	{ x: 330, y: 365, size: 30, used: false },
	{ x: 930, y: 360, size: 30, used: false },
	{ x: 1600, y: 350, size: 30, used: false }
];

const enemies = [
	{ x: 555, spawnX: 555, y: 425, width: 30, height: 45, start: 500, end: 670, direction: 1 },
	{ x: 1000, spawnX: 1000, y: 425, width: 30, height: 45, start: 820, end: 1260, direction: -1 },
	{ x: 1700, spawnX: 1700, y: 425, width: 30, height: 45, start: 1530, end: 2010, direction: 1 }
];

function buildLevel(level) {
	let seed = level * 7919;
	const random = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	const randomBetween = (minimum, maximum) => Math.floor(minimum + random() * (maximum - minimum + 1));
	const platformBlueprints = [
		{ x: 280, y: 365 }, { x: 515, y: 300 }, { x: 875, y: 360 },
		{ x: 1110, y: 275 }, { x: 1560, y: 350 }, { x: 1810, y: 285 }, { x: 2070, y: 370 }
	];
	const raisedPlatforms = [
		...platformBlueprints.map(platform => ({
			x: platform.x + randomBetween(-45, 45),
			y: Math.max(345, platform.y + randomBetween(-15, 15)),
			width: randomBetween(180, 260),
			height: 30
		}))
	];
	platforms.length = 0;
	platforms.push(
		{ x: 0, y: 470, width: 700, height: 70 },
		{ x: 790, y: 470, width: 620, height: 70 },
		{ x: 1490, y: 470, width: 910, height: 70 },
		...raisedPlatforms
	);

	coins.length = 0;
	raisedPlatforms.forEach(platform => {
		coins.push({
			x: platform.x + randomBetween(25, platform.width - 25),
			y: platform.y - randomBetween(35, 55),
			collected: false
		});
	});
	coins.push({ x: randomBetween(1260, 1380), y: randomBetween(390, 430), collected: false });

	boxes.length = 0;
	[randomBetween(0, 1), randomBetween(2, 3), randomBetween(4, 6)].forEach(platformIndex => {
		const platform = raisedPlatforms[platformIndex];
		boxes.push({
			x: platform.x + randomBetween(25, platform.width - 55),
			y: platform.y,
			size: 30,
			used: false
		});
	});

	keyholes.length = 0;
	[2290, 2320, 2350].forEach(x => keyholes.push({ x, y: 240, collected: false }));

	enemies.length = 0;
	[
		{ start: 500, end: 670 },
		{ start: 820, end: 1260 },
		{ start: 1530, end: 2010 }
	].forEach((enemy, index) => {
		const start = enemy.start + randomBetween(-30, 30);
		const end = enemy.end + randomBetween(-30, 30);
		const spawnX = randomBetween(start + 20, end - 20);
		enemies.push({
			x: spawnX,
			spawnX,
			y: 425,
			width: 30,
			height: 45,
			start,
			end,
			direction: (level + index) % 2 === 0 ? -1 : 1
		});
	});
	if (level % 3 === 0) {
		const start = 1100;
		const end = 1360;
		const spawnX = randomBetween(start + 20, end - 20);
		enemies.push({ x: spawnX, spawnX, y: 425, width: 30, height: 45, start, end, direction: -1 });
	}
}

let cameraX = 0;
let score = 0;
let lives = 3;
let keysCollected = 0;
let gameState = 'menu';
let lastTime = 0;
let activeChallenge = null;
let unlockElapsed = 0;
let worldNumber = 1;
const totalWorlds = 100;

for (let level = 1; level <= totalWorlds; level += 1) {
	const option = document.createElement('option');
	option.value = level;
	option.textContent = `Level ${level}`;
	levelSelect.appendChild(option);
}

buildLevel(worldNumber);

function startGame(level) {
	worldNumber = Math.max(1, Math.min(totalWorlds, level));
	localStorage.setItem('mathGameLastLevel', String(worldNumber));
	resetGame();
	startMenu.classList.add('hidden');
}

continueButton.addEventListener('click', () => {
	const savedLevel = Number(localStorage.getItem('mathGameLastLevel')) || 1;
	startGame(savedLevel);
});

firstLevelButton.addEventListener('click', () => startGame(1));
chooseLevelButton.addEventListener('click', () => startGame(Number(levelSelect.value)));

exitButton.addEventListener('click', () => {
	localStorage.setItem('mathGameLastLevel', String(worldNumber));
	gameState = 'menu';
	message.classList.remove('visible');
	mathPanel.classList.remove('visible');
	successFade.classList.remove('visible');
	successPanel.classList.remove('visible');
	startMenu.classList.remove('hidden');
});

function getGameZoom() {
	return Math.min(1.35, Math.max(1, canvas.clientHeight / 600));
}

function resizeCanvas() {
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	const bounds = canvas.getBoundingClientRect();
	canvas.width = Math.floor(bounds.width * pixelRatio);
	canvas.height = Math.floor(bounds.height * pixelRatio);
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function intersects(first, second) {
	return first.x < second.x + second.width && first.x + first.width > second.x &&
		first.y < second.y + second.height && first.y + first.height > second.y;
}

function jump() {
	if (gameState === 'won' || gameState === 'lost') {
		resetGame();
		return;
	}
	if (player.grounded) {
		player.velocityY = player.jumpPower;
		player.grounded = false;
	}
}

function resetPlayer() {
	player.x = 80;
	player.y = 428;
	player.velocityX = 0;
	player.velocityY = 0;
	player.invulnerable = 1000;
	cameraX = 0;
}

function resetGame() {
	score = 0;
	lives = 3;
	keysCollected = 0;
	gameState = 'playing';
	buildLevel(worldNumber);
	resetPlayer();
	message.classList.remove('visible');
	mathPanel.classList.remove('visible');
	successFade.classList.remove('visible');
	successFade.style.opacity = '0';
	successPanel.classList.remove('visible');
	activeChallenge = null;
	unlockElapsed = 0;
	updateHud();
}

function hurtPlayer() {
	if (player.invulnerable > 0) return;
	lives -= 1;
	if (lives <= 0) {
		gameState = 'lost';
		message.textContent = 'GAME OVER - PRESS R OR JUMP';
		message.classList.add('visible');
	} else {
		resetPlayer();
	}
	updateHud();
}

function updateHud() {
	scoreLabel.textContent = String(score).padStart(4, '0');
	livesLabel.textContent = lives;
	keysLabel.textContent = keysCollected;
	levelLabel.textContent = gameState === 'success' ? 'CLEAR' : `${worldNumber}-1`;
}

function createMathChallenge() {
	const type = Math.floor(Math.random() * 3);
	if (type === 0) {
		const denominator = 2 + Math.floor(Math.random() * 9);
		const first = 1 + Math.floor(Math.random() * (denominator - 1));
		const second = denominator - first;
		return { text: `${first}/${denominator} + ${second}/${denominator}`, answer: 1 };
	}
	const first = 1 + Math.floor(Math.random() * 12);
	const second = 1 + Math.floor(Math.random() * 12);
	if (type === 1) return { text: `${first} x ${second}`, answer: first * second };
	return { text: `${first * second} / ${first}`, answer: second };
}

function openMathChallenge() {
	activeChallenge = createMathChallenge();
	mathQuestion.textContent = activeChallenge.text;
	mathAnswer.value = '';
	gameState = 'math';
	mathPanel.classList.add('visible');
	mathAnswer.focus();
}

function parseAnswer(value) {
	const trimmed = value.trim();
	if (trimmed.includes('/')) {
		const parts = trimmed.split('/').map(Number);
		if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] !== 0) {
			return parts[0] / parts[1];
		}
	}
	const number = Number(trimmed);
	return Number.isFinite(number) ? number : NaN;
}

function finishMathChallenge() {
	const answer = parseAnswer(mathAnswer.value);
	if (answer === activeChallenge.answer) {
		keysCollected = Math.min(3, keysCollected + 1);
		score += 100;
		updateHud();
	}
	activeChallenge = null;
	mathPanel.classList.remove('visible');
	gameState = 'playing';
}

function startUnlockSequence() {
	gameState = 'unlocking';
	unlockElapsed = 0;
	player.velocityX = 0;
	keys.left = false;
	keys.right = false;
}

function finishUnlockSequence() {
	gameState = 'success';
	successFade.classList.add('visible');
	successFade.style.opacity = '1';
	successPanel.classList.add('visible');
	updateHud();
}

mathPanel.addEventListener('submit', event => {
	event.preventDefault();
	finishMathChallenge();
});

restartButton.addEventListener('click', resetGame);
nextWorldButton.addEventListener('click', () => {
	worldNumber = Math.min(totalWorlds, worldNumber + 1);
	localStorage.setItem('mathGameLastLevel', String(worldNumber));
	resetGame();
});

function update(delta) {
	if (gameState === 'unlocking') {
		unlockElapsed += delta;
		if (unlockElapsed >= 4600) finishUnlockSequence();
		return;
	}
	if (gameState !== 'playing') return;
	player.invulnerable = Math.max(0, player.invulnerable - delta);
	player.velocityX = (keys.left ? -player.speed : 0) + (keys.right ? player.speed : 0);
	player.velocityY += world.gravity;
	player.x += player.velocityX;
	player.y += player.velocityY;
	player.x = Math.max(0, Math.min(world.width - player.width, player.x));

	const previousBottom = player.y + player.height - player.velocityY;
	player.grounded = false;
	platforms.forEach(platform => {
		const fallingOntoPlatform = player.velocityY >= 0 && previousBottom <= platform.y &&
			player.y + player.height >= platform.y && player.x + player.width > platform.x && player.x < platform.x + platform.width;
		if (fallingOntoPlatform) {
			player.y = platform.y - player.height;
			player.velocityY = 0;
			player.grounded = true;
		}
	});

	coins.forEach(coin => {
		const coinBox = { x: coin.x - 10, y: coin.y - 14, width: 20, height: 28 };
		if (!coin.collected && intersects(player, coinBox)) {
			coin.collected = true;
			score += 100;
			updateHud();
		}
	});

	boxes.forEach(box => {
		const boxHitbox = { x: box.x, y: box.y, width: box.size, height: box.size };
		const hittingFromBelow = player.velocityY < 0 && player.y < box.y + box.size &&
			player.y + player.height > box.y && player.x + player.width > box.x && player.x < box.x + box.size;
		if (!box.used && hittingFromBelow && intersects(player, boxHitbox)) {
			box.used = true;
			player.velocityY = 0;
			openMathChallenge();
		}
	});

	enemies.forEach(enemy => {
		enemy.x += enemy.direction * 1.1;
		if (enemy.x <= enemy.start || enemy.x >= enemy.end) enemy.direction *= -1;
		if (intersects(player, enemy)) {
			if (player.velocityY > 0 && player.y + player.height - enemy.y < 20) {
				player.velocityY = player.jumpPower * 0.65;
				enemy.x = -100;
				score += 250;
				updateHud();
			} else {
				hurtPlayer();
			}
		}
	});

	if (player.y > world.height + 50) hurtPlayer();
	const finishZone = { x: 2260, y: 0, width: 120, height: world.groundY };
	if (keysCollected >= 3 && intersects(player, finishZone)) {
		startUnlockSequence();
	}
	cameraX += (player.x - cameraX - 220) * 0.08;
	cameraX = Math.max(0, Math.min(world.width - canvas.clientWidth / getGameZoom(), cameraX));
}

function drawBackground(width, height) {
	context.fillStyle = '#62c8d8';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#75d6df';
	for (let x = -((cameraX * 0.25) % 220) - 220; x < width + 220; x += 220) {
		context.beginPath();
		context.moveTo(x, 420);
		context.lineTo(x + 80, 330);
		context.lineTo(x + 170, 420);
		context.fill();
	}
	context.fillStyle = '#a6e4d3';
	for (let x = -((cameraX * 0.12) % 360) - 360; x < width + 360; x += 360) {
		context.fillRect(x, 410, 170, 60);
		context.fillRect(x + 110, 385, 180, 85);
	}
}

function drawWorld() {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const zoom = getGameZoom();
	const verticalOffset = Math.max(0, height - world.height * zoom);
	drawBackground(width, height);
	context.save();
	context.translate(-cameraX * zoom, verticalOffset);
	context.scale(zoom, zoom);

	const gaps = [{ x: 700, width: 90 }, { x: 1410, width: 80 }];
	gaps.forEach(gap => {
		context.fillStyle = '#248fa7';
		context.fillRect(gap.x, world.groundY, gap.width, world.height - world.groundY);
	});

	platforms.forEach(platform => {
		context.fillStyle = '#ad4a2f';
		context.fillRect(platform.x, platform.y, platform.width, platform.height);
		context.fillStyle = '#e7b74d';
		context.fillRect(platform.x, platform.y, platform.width, 8);
	});

	boxes.forEach(box => {
		if (box.used) {
			context.fillStyle = '#8d6b4a';
			context.fillRect(box.x, box.y, box.size, box.size);
			context.fillStyle = '#5e4635';
			context.fillRect(box.x + 4, box.y + 4, box.size - 8, 4);
			context.fillRect(box.x + 4, box.y + box.size - 8, box.size - 8, 4);
			return;
		}
		context.fillStyle = '#7b3f2a';
		context.fillRect(box.x, box.y, box.size, box.size);
		context.fillStyle = '#d86b28';
		context.fillRect(box.x + 3, box.y + 3, box.size - 6, box.size - 6);
		context.fillStyle = '#f29a38';
		context.fillRect(box.x + 6, box.y + 6, box.size - 12, 3);
		context.fillRect(box.x + 6, box.y + 6, 3, box.size - 12);
		context.fillStyle = '#8d4428';
		context.fillRect(box.x + 6, box.y + box.size - 9, box.size - 12, 3);
		context.fillRect(box.x + box.size - 9, box.y + 6, 3, box.size - 12);
		context.fillStyle = '#ffe08a';
		context.fillRect(box.x + 9, box.y + 9, box.size - 18, box.size - 18);
		context.fillStyle = '#7b3f2a';
		context.font = 'bold 23px monospace';
		context.fillText('?', box.x + 8, box.y + 24);
	});

	coins.forEach(coin => {
		if (coin.collected) return;
		context.fillStyle = '#fff0a3';
		context.fillRect(coin.x - 5, coin.y - 14, 10, 28);
		context.fillStyle = '#f2a82d';
		context.fillRect(coin.x - 9, coin.y - 9, 18, 18);
		context.fillStyle = '#ffe36e';
		context.fillRect(coin.x - 4, coin.y - 7, 4, 14);
	});

	enemies.forEach(enemy => {
		if (enemy.x < -50) return;
		context.fillStyle = '#633c83';
		context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
		context.fillStyle = '#f1c3a5';
		context.fillRect(enemy.x + 5, enemy.y + 7, 20, 14);
		context.fillStyle = '#27243d';
		context.fillRect(enemy.x + 7, enemy.y + 12, 4, 4);
		context.fillRect(enemy.x + 19, enemy.y + 12, 4, 4);
		context.fillRect(enemy.x - 2, enemy.y + enemy.height - 5, 12, 5);
		context.fillRect(enemy.x + 20, enemy.y + enemy.height - 5, 12, 5);
	});

	context.save();
	context.globalAlpha = 0.35;
	context.fillStyle = '#ffe36e';
	context.fillRect(2260, -80, 120, world.groundY + 80);
	context.restore();

	keyholes.forEach(keyhole => {
		if (keyhole.collected) return;
		context.save();
		context.globalAlpha = 0.9;
		context.fillStyle = '#9b5524';
		context.fillRect(keyhole.x - 6, keyhole.y - 13, 12, 8);
		context.fillRect(keyhole.x - 3, keyhole.y - 5, 6, 14);
		context.fillStyle = '#ffe36e';
		context.fillRect(keyhole.x - 4, keyhole.y - 11, 9, 5);
		context.fillRect(keyhole.x - 1, keyhole.y - 3, 3, 11);
		context.fillStyle = '#fff0a3';
		context.fillRect(keyhole.x - 3, keyhole.y - 10, 2, 2);
		context.restore();
	});

	if (gameState === 'unlocking') {
		const fadeProgress = Math.max(0, Math.min(1, (unlockElapsed - 2700) / 1900));
		const starts = [
			{ x: player.x + 8, y: player.y - 15 },
			{ x: player.x + 18, y: player.y - 28 },
			{ x: player.x + 28, y: player.y - 15 }
		];
		keyholes.forEach((keyhole, index) => {
			const flightProgress = Math.max(0, Math.min(1, (unlockElapsed - index * 450) / 1200));
			const start = starts[index];
			const keyX = start.x + (keyhole.x - start.x) * flightProgress;
			const keyY = start.y + (keyhole.y - start.y) * flightProgress;
			context.fillStyle = '#9b5524';
			context.fillRect(keyX - 5, keyY - 8, 10, 4);
			context.fillRect(keyX - 2, keyY - 4, 4, 13);
			context.fillStyle = '#ffe36e';
			context.fillRect(keyX - 3, keyY - 7, 6, 3);
			context.fillRect(keyX - 1, keyY - 3, 2, 10);
		});
		if (fadeProgress > 0) {
			context.fillStyle = `rgba(255, 255, 255, ${fadeProgress})`;
			context.fillRect(0, 0, width / zoom, height / zoom);
		}
	}

	if (player.invulnerable === 0 || Math.floor(player.invulnerable / 100) % 2 === 0) {
		context.fillStyle = '#ef5262';
		context.fillRect(player.x + 3, player.y, 24, 10);
		context.fillStyle = '#f1c3a5';
		context.fillRect(player.x + 7, player.y + 9, 17, 14);
		context.fillStyle = '#3a3157';
		context.fillRect(player.x + 5, player.y + 22, 20, 13);
		context.fillStyle = '#f5c451';
		context.fillRect(player.x + 2, player.y + 35, 11, 7);
		context.fillRect(player.x + 19, player.y + 35, 11, 7);
		context.fillStyle = '#27243d';
		context.fillRect(player.x + 20, player.y + 13, 4, 4);
	}
	context.restore();
}

function gameLoop(timestamp) {
	const delta = Math.min(32, timestamp - lastTime || 16);
	lastTime = timestamp;
	update(delta);
	drawWorld();
	requestAnimationFrame(gameLoop);
}

function setKey(key, value) {
	keys[key] = value;
}

window.addEventListener('keydown', event => {
	const movementKey = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right' }[event.code];
	if (movementKey || ['ArrowUp', 'KeyW', 'Space', 'KeyR'].includes(event.code)) event.preventDefault();
	if (movementKey) setKey(movementKey, true);
	if (['ArrowUp', 'KeyW', 'Space'].includes(event.code)) jump();
	if (event.code === 'KeyR') resetGame();
});

window.addEventListener('keyup', event => {
	const movementKey = { ArrowLeft: 'left', ArrowRight: 'right', KeyA: 'left', KeyD: 'right' }[event.code];
	if (movementKey) setKey(movementKey, false);
});

window.addEventListener('blur', () => {
	setKey('left', false);
	setKey('right', false);
});

document.querySelectorAll('[data-key]').forEach(button => {
	const key = button.dataset.key;
	button.addEventListener('pointerdown', event => {
		event.preventDefault();
		key === 'jump' ? jump() : setKey(key, true);
	});
	button.addEventListener('pointerup', () => { if (key !== 'jump') setKey(key, false); });
	button.addEventListener('pointerleave', () => { if (key !== 'jump') setKey(key, false); });
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateHud();
requestAnimationFrame(gameLoop);

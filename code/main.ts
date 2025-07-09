
import kaboom from "kaboom"
import { GameObj } from "kaboom";
import "kaboom/global"

// initialize context
kaboom({
	width: 3000,
	height: 1080,
	background: [0, 0, 0],
	scale: 1,
	stretch: true,
	letterbox: true,
});

// Set gravity for the game world
setGravity(1800);

// Load sprites
loadSprite("player", "./sprites/u.png", {
	sliceX: 8,
	sliceY: 9,
	anims: {
		idle: { from: 0, to: 5, loop: true },
		run: { from: 8, to: 15, loop: true },
		jump: { from: 51, to: 52, loop: false },
		fall: { from: 54, to: 54, loop: false },
		explode: { from: 64, to: 69 },
		attack: { from: 24, to: 28, speed: 16 },
	},
});
loadSprite("ground", "sprites/Backgrounds/path.png");
loadSprite("forest", "sprites/Backgrounds/forest.png");

// Game state
let currentLevel = 1;
let score = 0;
let coinsCollected = 0;

// Level configurations
const levels = {
	1: {
		coinsNeeded: 5,
		platforms: [
			{ x: 0, y: 950, width: 20 },
			{ x: 2500, y: 800, width: 5 },
			{ x: 4000, y: 700, width: 5 },
		],
		coins: [
			{ x: 1000, y: 800 },
			{ x: 1500, y: 700 },
			{ x: 2600, y: 600 },
			{ x: 4100, y: 500 },
			{ x: 5000, y: 850 },
		],
		background: "forest",
		nextLevel: 2
	},
	2: {
		coinsNeeded: 8,
		platforms: [
			{ x: 0, y: 950, width: 15 },
			{ x: 2000, y: 850, width: 3 },
			{ x: 3000, y: 750, width: 4 },
			{ x: 4500, y: 650, width: 3 },
			{ x: 6000, y: 550, width: 5 },
		],
		coins: [
			{ x: 800, y: 800 },
			{ x: 1200, y: 700 },
			{ x: 2100, y: 650 },
			{ x: 3100, y: 550 },
			{ x: 4600, y: 450 },
			{ x: 5500, y: 700 },
			{ x: 6100, y: 350 },
			{ x: 7000, y: 800 },
		],
		background: "forest",
		nextLevel: 3
	},
	3: {
		coinsNeeded: 10,
		platforms: [
			{ x: 0, y: 950, width: 10 },
			{ x: 1500, y: 900, width: 2 },
			{ x: 2500, y: 800, width: 2 },
			{ x: 3500, y: 700, width: 2 },
			{ x: 4500, y: 600, width: 2 },
			{ x: 5500, y: 500, width: 2 },
			{ x: 6500, y: 400, width: 2 },
			{ x: 7500, y: 300, width: 5 },
		],
		coins: [
			{ x: 500, y: 800 },
			{ x: 1000, y: 750 },
			{ x: 1600, y: 700 },
			{ x: 2600, y: 600 },
			{ x: 3600, y: 500 },
			{ x: 4600, y: 400 },
			{ x: 5600, y: 300 },
			{ x: 6600, y: 200 },
			{ x: 7600, y: 100 },
			{ x: 8000, y: 200 },
		],
		background: "forest",
		nextLevel: "win"
	}
};

function createLevel(levelNum: number) {
	const levelConfig = levels[levelNum];
	if (!levelConfig) return;

	// Reset collections for new level
	coinsCollected = 0;

	// Create background
	const forestSprites: GameObj[] = [];
	for (let i = 0; i < 10; i++) {
		const forestSprite = add([
			sprite("forest", {
				width: 1920,
				height: 1080,
			}),
			pos(i * 1920, 0),
			z(-1),
		]);
		forestSprites.push(forestSprite);
	}

	// Create platforms
	levelConfig.platforms.forEach(platform => {
		for (let i = 0; i < platform.width; i++) {
			add([
				sprite("ground"),
				pos(platform.x + (i * 1080), platform.y),
				area(),
				body({ isStatic: true }),
				"ground",
			]);
		}
	});

	// Create coins
	levelConfig.coins.forEach(coinPos => {
		add([
			circle(20),
			pos(coinPos.x, coinPos.y),
			area(),
			color(255, 215, 0), // Gold color
			outline(3, [255, 255, 0]), // Yellow outline
			"coin",
			{
				collected: false,
				bob: 0, // For bobbing animation
			}
		]);
	});

	// Create player
	const player = add([
		sprite("player"),
		pos(100, 500),
		scale(10),
		area(),
		body({ mass: 100, jumpForce: 1020 }),
		opacity(),
	]);

	// Create UI
	const levelLabel = add([
		text(`Level ${levelNum}`, { size: 48 }),
		pos(24, 24),
		fixed(),
		color(255, 255, 255),
	]);

	const scoreLabel = add([
		text(`Score: ${score}`, { size: 36 }),
		pos(24, 80),
		fixed(),
		color(255, 255, 255),
	]);

	const coinsLabel = add([
		text(`Coins: ${coinsCollected}/${levelConfig.coinsNeeded}`, { size: 36 }),
		pos(24, 120),
		fixed(),
		color(255, 215, 0),
	]);

	// Player controls
	onKeyDown("left", () => {
		player.move(-500, 0);
		player.flipX = true;
		if (player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyDown("right", () => {
		player.move(500, 0);
		player.flipX = false;
		if (player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump();
			player.play("jump");
		}
	});

	onKeyRelease("left", () => {
		if (!isKeyDown("right")) {
			player.play("idle");
		}
	});

	onKeyRelease("right", () => {
		if (!isKeyDown("left")) {
			player.play("idle");
		}
	});

	// Coin collection
	player.onCollide("coin", (coin) => {
		if (!coin.collected) {
			coin.collected = true;
			coin.destroy();
			coinsCollected++;
			score += 100;
			
			// Update UI
			scoreLabel.text = `Score: ${score}`;
			coinsLabel.text = `Coins: ${coinsCollected}/${levelConfig.coinsNeeded}`;
			
			// Check if level complete
			if (coinsCollected >= levelConfig.coinsNeeded) {
				if (levelConfig.nextLevel === "win") {
					go("gameComplete");
				} else {
					go("levelComplete", levelNum);
				}
			}
		}
	});

	// Coin animation
	onUpdate("coin", (coin) => {
		if (!coin.collected) {
			coin.bob += dt() * 3;
			coin.pos.y += Math.sin(coin.bob) * 0.5;
		}
	});

	// Player update
	let wasJumping = false;
	player.onUpdate(() => {
		if (player.pos && player.pos.x !== undefined && player.pos.y !== undefined) {
			camPos(player.pos.x, 540);

			// Update background for infinite scrolling
			forestSprites.forEach((forestSprite, index) => {
				if (forestSprite && forestSprite.pos) {
					const baseX = Math.floor(player.pos.x / 1920) * 1920;
					forestSprite.pos.x = baseX + (index - 2) * 1920;
				}
			});

			// Prevent going beyond x = 0
			if (player.pos.x < 0) {
				player.pos.x = 1;
				if (player.play) {
					player.play("idle");
				}
			}

			// Handle jump animations
			if (wasJumping && player.isGrounded && player.isGrounded() && player.curAnim && player.curAnim() === "jump") {
				if (player.play) {
					player.play("idle");
				}
				wasJumping = false;
			}
			if (player.isGrounded && !player.isGrounded()) {
				wasJumping = true;
			}

			// Play falling animation
			if (player.isGrounded && player.vel && player.vel.y !== undefined &&
				!player.isGrounded() && player.vel.y > 0 &&
				player.curAnim && player.curAnim() !== "fall") {
				if (player.play) {
					player.play("fall");
				}
			}

			// Reset if player falls too far
			if (player.pos.y > height() + 200) {
				go(`level${currentLevel}`);
			}
		}
	});
}

// Level scenes
scene("level1", () => {
	currentLevel = 1;
	createLevel(1);
});

scene("level2", () => {
	currentLevel = 2;
	createLevel(2);
});

scene("level3", () => {
	currentLevel = 3;
	createLevel(3);
});

// Level complete scene
scene("levelComplete", (completedLevel) => {
	add([
		text("Level Complete!", { size: 64 }),
		pos(center()),
		anchor("center"),
		color(0, 255, 0),
	]);

	add([
		text(`Score: ${score}`, { size: 48 }),
		pos(center().x, center().y + 80),
		anchor("center"),
		color(255, 255, 255),
	]);

	add([
		text("Press SPACE for next level", { size: 36 }),
		pos(center().x, center().y + 140),
		anchor("center"),
		color(255, 255, 0),
	]);

	onKeyPress("space", () => {
		const nextLevel = completedLevel + 1;
		go(`level${nextLevel}`);
	});
});

// Game complete scene
scene("gameComplete", () => {
	add([
		text("Congratulations!", { size: 64 }),
		pos(center()),
		anchor("center"),
		color(0, 255, 0),
	]);

	add([
		text("You completed all levels!", { size: 48 }),
		pos(center().x, center().y + 80),
		anchor("center"),
		color(255, 255, 255),
	]);

	add([
		text(`Final Score: ${score}`, { size: 48 }),
		pos(center().x, center().y + 140),
		anchor("center"),
		color(255, 215, 0),
	]);

	add([
		text("Press R to restart", { size: 36 }),
		pos(center().x, center().y + 200),
		anchor("center"),
		color(255, 255, 0),
	]);

	onKeyPress("r", () => {
		score = 0;
		coinsCollected = 0;
		go("level1");
	});
});

// Main menu scene
scene("menu", () => {
	add([
		text("Coin Collector", { size: 72 }),
		pos(center()),
		anchor("center"),
		color(255, 215, 0),
	]);

	add([
		text("Collect all coins to advance!", { size: 36 }),
		pos(center().x, center().y + 100),
		anchor("center"),
		color(255, 255, 255),
	]);

	add([
		text("Use ARROW KEYS to move, SPACE to jump", { size: 24 }),
		pos(center().x, center().y + 150),
		anchor("center"),
		color(200, 200, 200),
	]);

	add([
		text("Press SPACE to start", { size: 48 }),
		pos(center().x, center().y + 220),
		anchor("center"),
		color(0, 255, 0),
	]);

	onKeyPress("space", () => {
		go("level1");
	});
});

console.log(`Game dimensions: ${width()} x ${height()}`);

go("menu");

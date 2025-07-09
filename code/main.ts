import kaboom from "kaboom"
import "kaboom/global"

// initialize context
kaboom({
	width: 1920,
	height: 1080,
	background: [0, 0, 0],
	scale: 1,
	stretch: true,
	letterbox: true,
});

// Load the background image
loadSprite("player", "./sprites/u.png", {
	sliceX: 8,
	sliceY: 9,
	anims: {
		idle: { from: 0, to: 7, loop: true },
		run: { from: 8, to: 13, loop: true },
		jump: { from: 51, to: 51, loop: true },
		fall: { from: 54, to: 54, loop: true },
		explode: { from: 64, to: 69 },
		attack: { from: 24, to: 28, speed: 16 },
	},
});
loadSprite("ground", "sprites/Backgrounds/path.png");
loadSprite("forest", "sprites/Backgrounds/forest.png");

// Add background as a repeating layer
scene('level1', () => {
	add([
		sprite("forest", {
			width: 1920,
			height: 1080,
			tiled: true
		}),
	]);
	for (let i = 0; i < 30; i++) {
		add([
			sprite("ground"),
			pos(i * 1080, 950), // y = 1000 is near the bottom of 1080px canvas
			area(),
		]);
	}
	const player = add([
		sprite("player"),
		pos(20, 450),
		scale(10),
		area({ shape: new Rect(vec2(0, 18), 12, 12) }),
		body({ mass: 100, jumpForce: 320 }),
		anchor('center'),
		opacity(),
	]);
	onKeyDown("left", () => {
		player.move(-200, 0);
		player.flipX = true;

		if (player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyDown("right", () => {
		player.move(200, 0);
		player.flipX = false;

		if (player.curAnim() !== "run") {
			player.play("run");
		}
	});

	onKeyPress("space", () => {
		if (player.curAnim() !== "run") {
			player.play("run");
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

	player.onUpdate(() => {
		// Prevent going beyond x = 0
		if (player.pos.x < 0) {
			player.pos.x = 0;
			player.play("idle");
			player.flipX = true;
		}
		if (player.pos.y > 450) {
			player.pos.y = 450;
			player.play("idle");
		}
	});


});


go('level1')
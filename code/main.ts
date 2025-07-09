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

// Set gravity for the game world
setGravity(1800);

// Load the background image
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

// Add background as a repeating layer
scene('level1', () => {

	for (let i = 0; i < 30; i++) {
		add([
			sprite("ground"),
			pos(i * 1080, 950),
			// Fixed spacing - ground sprites should be 64px wide
			area(),
			body({ isStatic: true }), // Make ground static so player can stand on it
			"ground", // Add tag for collision detection
		]);
		const forest = add([
			sprite("forest", {
				width: 1920 * i,
				height: 1080,
				tiled: true
			}),
		]);
	}
	const player = add([
		sprite("player"),
		pos(20, 500),
		scale(10),
		area(),
		body({ mass: 100, jumpForce: 1020 }),
		// anchor('center'),
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
	// Handle jump to idle transition in onUpdate
	let wasJumping = false;
	player.onUpdate(() => {
		// Make camera follow player (with safety check)
		if (player.pos) {
			camPos(player.pos.x, 1080);

			// Update forest background to create infinite scrolling effect

			// Prevent going beyond x = 0
			if (player.pos.x < 0) {
				player.pos.x = 500;
				player.play("idle");
				player.flipX = false;
			}

			// Handle jump to idle transition
			if (wasJumping && player.isGrounded() && player.curAnim() === "jump") {
				player.play("idle");
				wasJumping = false;
			}
			if (!player.isGrounded()) {
				wasJumping = true;
			}

			// Play falling animation when in air
		}
	});


});


go('level1')
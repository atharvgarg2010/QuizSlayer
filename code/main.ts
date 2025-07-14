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
let lives = 3;
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
loadSprite("player1", "sprites/sprite.png", {
	sliceX: 2, // change based on number of frames in a row
	sliceY: 1, // if it's a single row
	anims: {
		idle: { from: 0, to: 3, loop: true },
		run: { from: 4, to: 7, loop: true },
	},
});
loadSprite("ground", "sprites/Backgrounds/path.png");
loadSprite("path", "sprites/Backgrounds/ground.png");
loadSprite("forest", "sprites/Backgrounds/forest.png");
loadSprite("heart", "sprites/Heart.png");
loadSprite("skeleton", "/sprites/Skeleton enemy.png", {
	sliceX: 13, // number of columns in your sprite sheet
	sliceY: 7,
	// number of rows in your sprite sheet
	anims: {
		idle: {
			from: 0, to: 2, loop: true,
		},
		run: {
			from: 24, to: 31, loop: true,
		},
		attack: {
			from: 8, to: 15, loop: false,
		},
		hit: {
			from: 32, to: 35, loop: false,
		},
		death: {
			from: 0, to: 5, loop: false,
		}
	},
})
loadSprite("coin", "sprites/coin.png", {
	sliceX: 8,
	anims: {
		spin: {
			from: 0,
			to: 7,
			loop: true,
			speed: 10, // adjust speed as needed
		},
	},
});


// Add background as a repeating layer
scene('level1', () => {
	addLevel([
		"                             ",
		"            /   ___             ",
		"     ?      __             ",
		"                           ",
		"                           ",
		"                          ",
		"===========================",
	], {
		// define the size of tile block
		tileWidth: 320,
		tileHeight: 320,
		// define what each symbol means, by a function returning a component list (what will be passed to add())
		tiles: {
			"=": () => [
				sprite("ground"),
				area(),
				body({ isStatic: true }),
				pos(0, -9),

			],
			"$": () => [
				sprite("coin", { anim: 'spin' }),
				area(),
				pos(0, -9),
				'coin'
			],

			"/": () => [
				sprite("coin", { anim: 'spin' }),
				area(),
				body(),
				pos(0, -9),
				'coin'
			],
			"_": () => [
				sprite("path"),
				area(),
				body({ isStatic: true }),
				pos(0, -9),
			],
			"?": () => [
				sprite("skeleton", { anim: "idle" }),
				area(),
				body(),
				pos(0, -9),
				scale(-10,10),

				'skeleton'
			]
		}
	})
	// Create multiple forest background sprites for infinite scrolling
	const forestSprites: GameObj[] = [];
	// Create 5 forest sprites to ensure seamless infinite scrolling
	for (let i = 0; i < 5; i++) {
		const forestSprite = add([
			sprite("forest", {
				width: 1920,
				height: 1080,
			}),
			pos(i * 1920, 0),
			z(-1), // Put it behind other objects
		]);
		forestSprites.push(forestSprite);
	}


	// Create ground platforms
	for (let i = 0; i < 30; i++) {
		add([
			sprite("ground"),
			pos(i * 1080, 950),
			area(),
			body({ isStatic: true }), // Make ground static so player can stand on it
			"ground", // Add tag for collision detection
		]);
	}
	const player = add([
		sprite("player"),
		pos(1, 500),
		scale(vec2(7.92, 10)),
		area({
			shape: new Rect(vec2(20, 10), 24, 38) // offset and custom size
		}),
		body({ mass: 200, jumpForce: 1220 }),
		// anchor('center'),
		opacity(),
	]);
	player.height = 40

	let score = 0
	const ScoreLabel = add([
		text("Score: " + score, { size: 48 }),
		pos(24, 60),
		fixed(),

	]);

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
	let jumpCount = 0
	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump();
			player.play("jump");
			jumpCount += 1
		} else {
			jumpCount++
			if (jumpCount <= 2) {
				player.jump(600)
				player.play('jump')

			}
		}
		console.log(player.width, player.height)
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
	onKeyRelease("space", () => {
		if (!isKeyDown("left")) {
			player.play("idle");
		}
	});

	// Handle jump to idle transition in onUpdate
	let wasJumping = false;
	player.onUpdate(() => {
		// Make camera follow player (with safety check)
		if (player.pos && player.pos.x !== undefined && player.pos.y !== undefined) {
			camPos(player.pos.x, 540); // Center camera vertically at screen center

			// Update forest background sprites for infinite scrolling
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
				// player.flipX = false;
			}

			// Handle jump to idle transition
			if (wasJumping && player.isGrounded && player.isGrounded() && player.curAnim && player.curAnim() === "jump") {
				if (player.play) {
					player.play("idle");
					jumpCount = 0
				}
				wasJumping = false;
			}
			if (player.isGrounded && !player.isGrounded()) {
				wasJumping = true;
			}


			// Play falling animation when in air (with safety checks)
			if (player.isGrounded && player.vel && player.vel.y !== undefined &&
				!player.isGrounded() && player.vel.y > 0 &&
				player.curAnim && player.curAnim() !== "fall") {
				if (player.play) {
					player.play("fall");
				}
			}
		}
	});
	player.onCollide("coin", (coin) => {
		destroy(coin)
		score += 1
		ScoreLabel.text = "Score: " + score


	});
	player.onCollide("skeleton", (skel) => {
		add([
			text("Ouch! Watch where you're going!\nThe only way you can pass me is through this equation....", { size: 32 }),
			pos(player.pos.x, player.pos.y - 50),
			color(255, 255, 255),
			anchor("center"),
			lifespan(5),
		])

		// Wait 5 seconds, then go to "equation" scene
		wait(5, () => {
			go("equation")
		})
	})

	})
});





const questions = [
	{
		question: "3 + 5 = ?",
		options: ["6", "8", "9", "7"],
		correct: "8"
	},
	{
		question: "12 ÷ 4 = ?",
		options: ["3", "2", "4", "6"],
		correct: "3"
	},
	{
		question: "7 × 6 = ?",
		options: ["42", "36", "48", "40"],
		correct: "42"
	}
]

scene('equation', () =>{
	const q = choose(questions) // pick a random question

	add([
		text(q.question, { size: 36 }),
		pos(100, 60),
		color(255, 255, 255),
	])
} )

// Log the current screen dimensions
console.log(`Game dimensions: ${width()} x ${height()}`);

go('level1')
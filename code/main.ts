import kaboom from "kaboom"
import { GameObj } from "kaboom";
import "kaboom/global"

// initialize context
const questions = [
	
]
let score = 0

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
			from: 8, to: 13, loop: true,
		},
		hit: {
			from: 32, to: 35, loop: false,
		},
		death: {
			from: 15, to: 25, loop: false,
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
	let questionShown = false
	addLevel([
		"                             ",
		"            /                ",
		"     ?  ?      __          ",
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
			showQuestionFrame(skel)

		})
	})

	function showQuestionFrame(skel) {
		console.log("showQuestionFrame called")
		const q = {
			question: "What is 5 × 6?",
			options: ["25", "30", "35", "40"],
			correct: "30",
		}

		const frame = add([
			rect(1000, 400),
			pos(player.pos.add(vec2(0, -200))),
			color(255, 255, 200),
			outline(4, rgb(80, 50, 10)),
			anchor("center"),
			z(10),
		])

		const questionText = add([
			text(q.question, { size: 48 }),
			pos(center().x, center().y - 150),
			anchor("center"),
			color(0, 0, 0),
			z(11),
		])

		// Add options (2x2 grid)
		const optionWidth = 240
		const optionHeight = 80
		const spacingX = 60
		const spacingY = 40
		const startX = center().x - optionWidth - spacingX / 2
		const startY = center().y - 20

		q.options.forEach((opt, i) => {
			const row = Math.floor(i / 2)
			const col = i % 2
			const x = startX + col * (optionWidth + spacingX)
			const y = startY + row * (optionHeight + spacingY)

			const btn = add([
				rect(optionWidth, optionHeight, { radius: 12 }),
				pos(x, y),
				color(255, 230, 180),
				outline(3, rgb(100, 100, 100)),
				area(),
				anchor("center"),
				"option",
				z(11),
				{ value: opt },
			])

			add([
				text(opt, { size: 32 }),
				pos(x, y),
				anchor("center"),
				color(0, 0, 0),
				z(12),
			])
		})

		onClick("option", (btn) => {
			if (btn.value === q.correct) {
				const correctmsg = add([
					text("✅ Correct!", { size: 40 },"correct"),
					pos(center().x, center().y + 150),
					color(0, 180, 0),
					anchor("center"),
					z(12),
				])
				wait(2, () =>{
					destroy(correctmsg)
					destroyAll("option")
					destroy(frame)
					player.play("attack")
					skel.play("death")
					wait(1,()=>{
						
					player.play("idle")
					})
					wait(1,()=>{
						score += 2
						ScoreLabel.text = "Score: " + score
						destroy(skel) // allow to pass
					})
				})
			} else {
				const wrong=add([
					text("❌ Wrong!", { size: 40 }),
					pos(center().x, center().y + 150),
					color(200, 0, 0),
					anchor("center"),
					z(12),
				])
				wait(2, () =>{
					destroyAll("option")
					destroy(frame)
					destroy(wrong)
					wait(0,()=>{
						skel.play("attack")
						player.play("explode")
						wait(0,()=>{
							skel.play("idle")
							
						})
					})
					go("gameover")
				})
			}
			// Optional: disable further input or close frame after
		})
	}
});

loadSprite("ebg", "/sprites/wooden-floor-background.jpg");



// scene("equation", () => {
// 	// Background
// 	add([
// 		sprite("ebg"),
// 		scale(2),
// 		pos(0, 0),
// 		z(-1),
// 	]);

// 	// Question data
// 	const q = {
// 		question: "7 × 6 = ?",
// 		options: ["42", "36", "48", "40"],
// 		correct: "42"
// 	};

// 	// Main frame box (like in your image)
// 	const frameWidth = 1000;
// 	const frameHeight = 700;

// 	add([
// 		rect(frameWidth, frameHeight),
// 		pos(center()),
// 		outline(4, rgb(230, 220, 160)),  // soft golden border
// 		anchor("center"),
// 		z(0),
// 	]);

// 	// Equation line
// 	add([
// 		text(q.question, {
// 			size: 60,
// 			width: frameWidth - 100,
// 			font: "sink",
// 		}),
// 		pos(center().x, center().y - frameHeight / 2 + 70),
// 		color(0, 0, 0),
// 		anchor("center"),
// 		z(1),
// 	]);

// 	// Grid layout inside the box
// 	const optionWidth = 260;
// 	const optionHeight = 100;
// 	const spacingX = 80;
// 	const spacingY = 60;

// 	const baseX = center().x - optionWidth / 2 - spacingX / 2;
// 	const baseY = center().y - 40;

// 	q.options.forEach((opt, i) => {
// 		const row = Math.floor(i / 2);
// 		const col = i % 2;

// 		const x = baseX + col * (optionWidth + spacingX);
// 		const y = baseY + row * (optionHeight + spacingY);

// 		const btn = add([
// 			rect(optionWidth, optionHeight, { radius: 12 }),
// 			pos(x, y),
// 			color(255, 250, 220),
// 			outline(3, rgb(100, 100, 100)),
// 			area(),
// 			anchor("center"),
// 			"option",
// 			{ value: opt },
// 		]);

// 		// Hover highlight
		

// 		// Option text
// 		add([
// 			text(opt, { size: 36, font: "sink" }),
// 			pos(x, y),
// 			color(0, 0, 0),
// 			anchor("center"),
// 		]);
// 	});

// 	// On click show result
// 	onClick("option", (btn) => {
// 		destroyAll("option");

// 		add([
// 			text(
// 				btn.value === q.correct ? "✅ Correct!" : `❌ Wrong! Answer: ${q.correct}`,
// 				{ size: 48 }
// 			),
// 			pos(center().x, center().y + frameHeight / 2 - 60),
// 			color(btn.value === q.correct ? rgb(0, 150, 0) : rgb(180, 0, 0)),
// 			anchor("center"),
// 		]);
// 		wait(2, () => {
// 			go("level1");
// 		})
// 	});
// });

scene("gameover", () => {
	// Add a background
	add([
		sprite("ebg"), // Assuming you have a suitable background sprite
		scale(width() / 1920, height() / 1080), // Scale to fit screen
		fixed(),      // Keep the background fixed during camera movement
		z(-1),        // Ensure it's behind other elements
	]);

	// Game Over text
	add([
		text("Game Over!", {
			size: 120,
			font: "sink",
		}),
		pos(width() / 2, height() / 2 - 150),
		anchor("center"),
		color(255, 0, 0),
		outline(8),
	]);

	// Display the final score
	add([
		text(`Final Score: ${score}`, {
			size: 64,
			font: "sink",
		}),
		pos(width() / 2, height() / 2),
		anchor("center"),
		color(255, 255, 255),
		outline(4),
	]);

	// Play Again button
	const playAgainButton = add([
		rect(320, 80, { radius: 12 }),
		pos(width() / 2, height() / 2 + 150),
		anchor("center"),
		color(0, 128, 255),
		outline(4),
		area(),
		"playAgainButton", // Tag for event handling
	]);

	add([
		text("Play Again", {
			size: 48,
			font: "sink",
		}),
		pos(width() / 2, height() / 2 + 150),
		anchor("center"),
		color(255, 255, 255),
	]);

	// Event handler for the "Play Again" button
	onClick("playAgainButton", () => {
		lives = 3;
		score = 0;
		go("level1"); // Restart the game
	});
});
// Log the current screen dimensions
console.log(`Game dimensions: ${width()} x ${height()}`);

go('level1')
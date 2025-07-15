import kaboom from "kaboom"
import { GameObj } from "kaboom";
import "kaboom/global"

let score = 0
let lives = 4;
let defeatedSkeletons = 0;
const totalSkeletons = 10;
let isQuestion = false
kaboom({
	width: 3000,
	height: 1080,
	background: [0, 0, 0],
	scale: 1,
	stretch: true,
	letterbox: true,
});

scene("gameover", () => {
	console.log(lives)
	add([
		text("💀 GAME OVER 💀", { size: 72 }),
		pos(center()),
		anchor("center"),
	]);
});

setGravity(1800);


loadSound("coinsfx", "/sounds/coin.mp3")
loadSound("roarsfx", "/sounds/roar.mp3")
loadSound("lifesfx", "/sounds/life.mp3")
loadSound("bgsfx", "/sounds/bg.mp3")
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
	sliceX: 2, 
	sliceY: 1, 
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
	sliceX: 13, 
	sliceY: 7,

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
			speed: 10,
		},
	},
});



scene('level1', () => {
	play("bgsfx", { loop: true })
	const questions = fetch('/code/question.json')
		.then(response => {
			if (!response.ok) {
				throw new Error("Network response was not ok " + response.statusText);
			}
			return response.json(); 
		})
		.then(data => {
			console.log(data);
			return data
		})
		.catch(error => {
			console.error("Fetch error: ", error);
		});
	let questionShown = false
	addLevel([
		"                    /                                                                 ",
		"            /   /   _____        /  ?//          //                            ///                     ",
		"     ?         __             ___________  ?    _____  ? ________       ?         ___________                                    ",
		"                                                                  ___________              ",
		"                                                                               ",
		"                                                                                ",
		"=================================================================================",
	], {
		
		tileWidth: 320,
		tileHeight: 320,
	
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
				scale(-10, 10),

				'skeleton'
			]
		}
	})
	
	const forestSprites: GameObj[] = [];
	
	for (let i = 0; i < 5; i++) {
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


	
	for (let i = 0; i < 30; i++) {
		add([
			sprite("ground"),
			pos(i * 1080, 950),
			area(),
			body({ isStatic: true }), 
			"ground",
		]);
	}
	const player = add([
		sprite("player"),
		pos(1, 500),
		scale(vec2(7.92, 10)),
		area({
			shape: new Rect(vec2(20, 10), 24, 38)
		}),
		body({ mass: 200, jumpForce: 1220 }),
	
		opacity(),
	]);
	player.height = 40


	const ScoreLabel = add([
		text("Score: " + score, { size: 48 }),
		pos(24, 60),
		fixed(),

	]);
	let LifeLabel = add([
		text("Life: " + (lives), { size: 48 }),
		pos(24, 120),
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


	let wasJumping = false;
	player.onUpdate(() => {
		if (lives <= 0) {
			alert("gameover")
		}
	
		if (player.pos && player.pos.x !== undefined && player.pos.y !== undefined) {
			camPos(player.pos.x, 540); 
		
			forestSprites.forEach((forestSprite, index) => {
				if (forestSprite && forestSprite.pos) {
					const baseX = Math.floor(player.pos.x / 1920) * 1920;
					forestSprite.pos.x = baseX + (index - 2) * 1920;
				}
			});


			if (player.pos.x < 0) {
				player.pos.x = 1;
				if (player.play) {
					player.play("idle");
				}
			
			}

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

		play("coinsfx")
		destroy(coin)
		score += 1
		ScoreLabel.text = "Score: " + score


	});
	player.onCollide("skeleton", (skel) => {
		player.isStatic = true
	
		player.paused = true;
		add([
			text("Ouch! Watch where you're going!\nThe only way you can pass me is through this equation....", { size: 32 }),
			pos(skel.pos.x, skel.pos.y - 50),
			color(255, 255, 255),
			anchor("center"),
			lifespan(5),
		])

		
		wait(5, () => {
			questions.then(questionsData => {
				const q = choose(questionsData)
				if (isQuestion == false) {
					showQuestionFrame(skel, q)
				}
			})
		})

		function showQuestionFrame(skel, q) {
			isQuestion = true

			console.log(q)
			console.log("showQuestionFrame called")


			const frame = add([
				rect(2200, 500),
				pos(player.pos.add(vec2(0, 200))),
				color(255, 255, 200),
				outline(4, rgb(80, 50, 10)),
				anchor("center"),
				z(10),
			])

			const questionText = add([
				text(q.question, { size: 48 }),
				pos(frame.pos.x, frame.pos.y - 150),
				anchor("center"),
				color(0, 0, 0),
				z(11),
			])

		
			const optionWidth = 240
			const optionHeight = 80
			const spacingX = 60
			const spacingY = 40
			const startX = frame.pos.x - optionWidth - spacingX / 2
			const startY = frame.pos.y - 20

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
					"option-text"
				])
			})

			onClick("option", (btn) => {
				isQuestion = false
				player.paused = false;
				player.isStatic = false
				if (btn.value === q.answer) {
					console.log("Correct")
					const correctmsg = add([
						text("Correct!", { size: 80 }),
						pos(frame.pos.x, frame.pos.y + 200),
						color(0, 180, 0),
						anchor("center"),
						z(12),
						lifespan(5),
					])
					wait(3, () => {
						destroy(correctmsg)
						destroyAll("correct")
						destroyAll("option")
						destroy(frame)
						destroy(btn)
						destroy(questionText)
						destroyAll("option-text")
						player.play("attack")
						skel.play("death")
						volume(0.5)
						play("roarsfx", {
							volume: 0.8,
							detune: rand(-1200, 1200),
						})
						wait(1, () => {
							skel.destroy()
							score += 2
							ScoreLabel.text = "Score: " + score
							player.play("idle")
						})
					})

				} else {
					console.log("Wrong")
					const wrong = add([
						text("Wrong!", { size: 80 }),
						pos(frame.pos.x, frame.pos.y + 200),
						color(200, 0, 0),
						anchor("center"),
						z(12),
						lifespan(5),
						'wrong'
					])
					wait(1, () => {
						lives -=1
						console.log(lives)
						LifeLabel.text = "Life: " + (lives)
						destroyAll("option")
						destroyAll("wrong")
						destroy(frame)
						destroy(wrong)
						destroy(btn)
						destroy(questionText)
						destroyAll("option-text")
						skel.play("attack")
						play("lifesfx")
						player.play("explode")
						


						wait(1, ()=>{
						if (lives > 0){
							skel.play("idle")
							player.pos = vec2(player.pos.x - 50, player.pos.y);
							player.play("idle")	
						}
							
						})
					})


				}

			})
		}
	});
})

loadSprite("ebg", "/sprites/wooden-floor-background.jpg");
go('level1')
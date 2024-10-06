const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game variables
let player, enemies, platforms, ladders, barrels, score, level, gameOver, keys, powerUps, prize;

// Initialize game
function init() {
    player = {
        x: 50,
        y: canvas.height - 150,
        width: 30,
        height: 50,
        speed: 5,
        dx: 0,
        dy: 0,
        onGround: false,
        climbing: false,
        frame: 0,
        spriteCounter: 0,
        direction: 'right',
        jumpCount: 0,
        hasHammer: false,
        hammerTimer: 0,
    };
    enemies = [];
    platforms = [];
    ladders = [];
    barrels = [];
    powerUps = [];
    score = 0;
    level = 1;
    gameOver = false;
    keys = {};

    createLevel();
    loop();
}

// Create level elements
function createLevel() {
    // Clear existing elements
    platforms = [];
    ladders = [];
    powerUps = [];
    enemies = [];

    // Platforms (Weave pattern)
    let platWidth = canvas.width * 0.8;
    let gap = 100;
    let xOffset = (canvas.width - platWidth) / 2;
    let yOffset = canvas.height - 100;

    for (let i = 0; i < 5; i++) {
        let startX, endX;
        let slant = -1; // All platforms slant downwards

        if (i % 2 === 0) {
            // Even index platforms slant from left to right
            startX = xOffset + 40;
            endX = xOffset + platWidth - gap * 2 + 40;
        } else {
            // Odd index platforms slant from right to left
            startX = xOffset + platWidth - gap * 2;
            endX = xOffset;
        }

        platforms.push({
            x1: startX,
            y1: yOffset - i * 120,
            x2: endX,
            y2: yOffset - i * 120 + 50 * slant, // Slanting downwards
            slope: ((yOffset - i * 120 + 50 * slant) - (yOffset - i * 120)) / (endX - startX),
        });

        // Add hammers to every platform except the bottom one
        if (i > 0 && i < 5) {
            let hammerX = (startX + endX) / 2;
            let hammerY = getYOnLine(startX, yOffset - i * 120, endX, yOffset - i * 120 + 50 * slant, hammerX) - 30;
            powerUps.push({
                type: 'hammer',
                x: hammerX,
                y: hammerY,
                width: 30,
                height: 30,
                collected: false,
            });
        }
    }

    // Ladders
    for (let i = 0; i < 4; i++) {
        let plat1 = platforms[i];
        let plat2 = platforms[i + 1];
        let ladderX;

        if (i % 2 === 0) {
            // Ladders on the right
            ladderX = Math.max(plat1.x1, plat1.x2) - 50;
        } else {
            // Ladders on the left
            ladderX = Math.min(plat1.x1, plat1.x2) + 10;
        }

        let ladderHeight = plat1.y1 - plat2.y1;
        ladders.push({
            x: ladderX,
            y: plat2.y1,
            width: 40,
            height: ladderHeight,
        });
    }

    // Prize (Red Heart) at the top, on top of a ladder
    let topPlatform = platforms[platforms.length - 1];
    let lastLadder = ladders[ladders.length - 1];
    prize = {
        x: 1100, // Centered on the ladder
        y: 200,
        width: 50,
        height: 50,
        collected: false,
    };

    // Enemy (Donkey Kong) placed on the right side, near the heart
    enemies.push({
        x: prize.x + 80, // Positioned to the right of the heart
        y: prize.y - 30,
        width: 80,
        height: 80,
    });

    // Adjust player starting position near the first ladder
    let firstLadder = ladders[0];
    player.x = firstLadder.x - player.width / 2 + firstLadder.width / 2;
    player.y = canvas.height - player.height - 10;
}

// Game loop
function loop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(loop);
    } else {
        drawGameOver();
    }
}

// Update game state
function update() {
    // Player movement
    if (keys['ArrowLeft']) {
        player.dx = -player.speed;
        player.direction = 'left';
    } else if (keys['ArrowRight']) {
        player.dx = player.speed;
        player.direction = 'right';
    } else {
        player.dx = 0;
    }

    if (keys[' '] && player.jumpCount < 1 && !player.climbing) {
        player.dy = -12; // Jump strength
        player.onGround = false;
        player.jumpCount++;
    }

    if (keys['ArrowUp'] && player.climbing) {
        player.dy = -player.speed;
    } else if (keys['ArrowDown'] && player.climbing) {
        player.dy = player.speed;
    } else if (!player.onGround && !player.climbing) {
        player.dy += 0.5; // Gravity
    } else if (!player.climbing) {
        player.dy = 0;
    }

    player.x += player.dx;
    player.y += player.dy;

    // Collision detection
    player.onGround = false;
    let wasClimbing = player.climbing;
    player.climbing = false;

    // Check ladders first
    for (let ladder of ladders) {
        let ladderCenter = ladder.x + ladder.width / 2;
        let playerCenter = player.x + player.width / 2;
        if (
            Math.abs(playerCenter - ladderCenter) < ladder.width &&
            player.y + player.height > ladder.y &&
            player.y < ladder.y + ladder.height
        ) {
            player.climbing = true;
            player.onGround = true;
            player.jumpCount = 0;
            break;
        }
    }

    if (!player.climbing) {
        // Platforms collision
        for (let plat of platforms) {
            if (lineRectCollision(plat.x1, plat.y1, plat.x2, plat.y2, player)) {
                player.onGround = true;
                player.dy = 0;
                player.jumpCount = 0;
                break;
            }
        }
    } else {
        if (!wasClimbing) {
            player.dx = 0; // Stop horizontal movement when starting to climb
        }
    }

    // Prevent jumping through platforms from below
    if (player.dy < 0) {
        for (let plat of platforms) {
            if (lineRectCollisionBelow(plat.x1, plat.y1, plat.x2, plat.y2, player)) {
                player.dy = 0;
                break;
            }
        }
    }

    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.onGround = true;
        player.jumpCount = 0;
    }

    // Update animation frame
    if (player.dx !== 0 || player.dy !== 0) {
        player.spriteCounter++;
        if (player.spriteCounter % 5 === 0) {
            player.frame = (player.frame + 1) % 4;
        }
    } else {
        player.frame = 0;
        player.spriteCounter = 0;
    }

    // Update power-up (Hammer)
    for (let powerUp of powerUps) {
        if (!powerUp.collected && checkCollision(player, powerUp)) {
            if (powerUp.type === 'hammer') {
                powerUp.collected = true;
                player.hasHammer = true;
                player.hammerTimer = 300; // Hammer lasts for 300 frames (~5 seconds at 60fps)
            }
        }
    }

    if (player.hasHammer) {
        player.hammerTimer--;
        if (player.hammerTimer <= 0) {
            player.hasHammer = false;
        }
    }

    // Check for collecting the prize
    if (!prize.collected && checkCollision(player, prize)) {
        prize.collected = true;
        // You can add code here to proceed to the next level or win the game
        gameOver = true;
        alert('You Win!');
    }

    // Spawn barrels (Slower rate)
    if (Math.random() < 0.005) { // Reduced spawn rate
        barrels.push({
            x: enemies[0].x + enemies[0].width / 2,
            y: enemies[0].y + enemies[0].height,
            width: 30,
            height: 30,
            dx: 0,
            dy: 0,
            onPlatform: false,
        });
    }

    // Update barrels
    for (let barrel of barrels) {
        // Reset onPlatform status at the beginning
        barrel.onPlatform = false;

        // Apply gravity if not on platform
        if (!barrel.onPlatform) {
            barrel.dy += 0.5; // Gravity
        }

        // Move barrel
        barrel.x += barrel.dx;
        barrel.y += barrel.dy;

        // Barrel-platform collision
        for (let plat of platforms) {
            if (lineRectCollision(plat.x1, plat.y1, plat.x2, plat.y2, barrel)) {
                barrel.onPlatform = true;

                // Adjust barrel position to be on top of the platform
                let barrelCenterX = barrel.x + barrel.width / 2;
                let platformYAtBarrelX = getYOnLine(plat.x1, plat.y1, plat.x2, plat.y2, barrelCenterX);
                barrel.y = platformYAtBarrelX - barrel.height;

                // Calculate barrel's movement along the platform's slope
                let angle = Math.atan2(plat.y2 - plat.y1, plat.x2 - plat.x1);
                let speed = 2; // Barrel speed
                barrel.dx = -speed * Math.cos(angle);
                barrel.dy = speed * Math.sin(angle);
                break;
            }
        }

        // Barrel-player collision
        if (checkCollision(player, barrel)) {
            if (player.hasHammer) {
                // Destroy barrel
                barrels.splice(barrels.indexOf(barrel), 1);
                score += 100;
            } else {
                gameOver = true;
            }
        }
    }

    // Remove off-screen barrels
    barrels = barrels.filter((barrel) => barrel.y < canvas.height + 50);

    // Update score or other game logic here
}

// Collision detection between slanted platform (line) and rectangle (player or barrel)
function lineRectCollision(x1, y1, x2, y2, rect) {
    // Simplified collision detection for platforms
    // Check if rect is on top of the line segment
    let rectCenterX = rect.x + rect.width / 2;
    let rectBottomY = rect.y + rect.height;

    // Get Y on platform at rect's X position
    let platformYAtRectX = getYOnLine(x1, y1, x2, y2, rectCenterX);

    if (
        rectCenterX > Math.min(x1, x2) &&
        rectCenterX < Math.max(x1, x2) &&
        rectBottomY >= platformYAtRectX - 5 &&
        rectBottomY <= platformYAtRectX + 5 &&
        rect.dy >= 0
    ) {
        rect.y = platformYAtRectX - rect.height;
        return true;
    }
    return false;
}

// Prevent jumping through platforms from below
function lineRectCollisionBelow(x1, y1, x2, y2, rect) {
    let rectTopY = rect.y;

    // Get Y on platform at rect's X position
    let platformYAtRectX = getYOnLine(x1, y1, x2, y2, rect.x + rect.width / 2);

    if (
        rect.x + rect.width / 2 > Math.min(x1, x2) &&
        rect.x + rect.width / 2 < Math.max(x1, x2) &&
        rectTopY <= platformYAtRectX + 5 &&
        rectTopY >= platformYAtRectX - 5 &&
        rect.dy < 0
    ) {
        rect.y = platformYAtRectX;
        return true;
    }
    return false;
}

// Get Y coordinate on line at a given X coordinate
function getYOnLine(x1, y1, x2, y2, x) {
    let m = (y2 - y1) / (x2 - x1);
    let b = y1 - m * x1;
    return m * x + b;
}

// Simple rectangle collision detection
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 10;
    for (let plat of platforms) {
        ctx.beginPath();
        ctx.moveTo(plat.x1, plat.y1);
        ctx.lineTo(plat.x2, plat.y2);
        ctx.stroke();
    }

    // Draw ladders
    drawLadders();

    // Draw player
    drawPlayer();

    // Draw enemies
    ctx.fillStyle = '#FFFFFF';
    for (let enemy of enemies) {
        ctx.fillRect(enemy.x + 1000, enemy.y - 100, enemy.width, enemy.height);
    }

    // Draw barrels
    drawBarrels();

    // Draw power-ups
    drawPowerUps();

    // Draw prize
    if (!prize.collected) {
        drawPrize();
    }

    // Draw score
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);

    // Draw hammer icon if player has hammer
    if (player.hasHammer) {
        drawHammer(75, 55, 30, 40);
    }
}

// Draw player with basic animation
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    if (player.direction === 'left') {
        ctx.scale(-1, 1);
    }
    ctx.fillStyle = '#00F';

    // Simple animated sprite (rectangle changing shape)
    if (player.climbing) {
        // Climbing animation
        ctx.beginPath();
        ctx.rect(-player.width / 2, -player.height / 2, player.width, player.height);
        ctx.fill();
    } else if (player.onGround) {
        if (player.dx !== 0) {
            // Walking animation
            ctx.beginPath();
            ctx.ellipse(0, 0, player.width / 2 + (player.frame % 2) * 2, player.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standing
            ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        }
    } else {
        // Jumping
        ctx.beginPath();
        ctx.moveTo(-player.width / 2, player.height / 2);
        ctx.lineTo(0, -player.height / 2);
        ctx.lineTo(player.width / 2, player.height / 2);
        ctx.closePath();
        ctx.fill();
    }

    // Draw hammer if player has it
    if (player.hasHammer) {
        drawHammer(0, -player.height / 2, 20, 40);
    }

    ctx.restore();
}

// Draw ladders with rungs
function drawLadders() {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 5;
    for (let ladder of ladders) {
        // Draw sides
        ctx.beginPath();
        ctx.moveTo(ladder.x, ladder.y);
        ctx.lineTo(ladder.x, ladder.y + ladder.height);
        ctx.moveTo(ladder.x + ladder.width, ladder.y);
        ctx.lineTo(ladder.x + ladder.width, ladder.y + ladder.height);
        ctx.stroke();

        // Draw rungs
        let numRungs = Math.floor(ladder.height / 20);
        for (let i = 0; i <= numRungs; i++) {
            let rungY = ladder.y + (i * ladder.height) / numRungs;
            ctx.beginPath();
            ctx.moveTo(ladder.x, rungY);
            ctx.lineTo(ladder.x + ladder.width, rungY);
            ctx.stroke();
        }
    }
}

// Draw barrels to look like barrels
function drawBarrels() {
    for (let barrel of barrels) {
        ctx.save();
        ctx.translate(barrel.x + barrel.width / 2, barrel.y + barrel.height / 2);
        ctx.fillStyle = '##FFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, barrel.width / 2, barrel.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw barrel details
        ctx.strokeStyle = '#FF000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, barrel.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-barrel.width / 2, -barrel.height / 4);
        ctx.lineTo(barrel.width / 2, -barrel.height / 4);
        ctx.moveTo(-barrel.width / 2, barrel.height / 4);
        ctx.lineTo(barrel.width / 2, barrel.height / 4);
        ctx.stroke();

        ctx.restore();
    }
}

// Draw power-ups
function drawPowerUps() {
    for (let powerUp of powerUps) {
        if (!powerUp.collected) {
            if (powerUp.type === 'hammer') {
                drawHammer(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            }
        }
    }
}

// Function to draw a hammer
function drawHammer(x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#A9A9A9'; // Handle color

    // Draw handle
    ctx.fillRect(-width / 8, -height / 2, width / 4, height);

    // Draw head
    ctx.fillStyle = '#FFD700'; // Head color
    ctx.fillRect(-width / 2, -height / 2, width, height / 4);

    ctx.restore();
}

// Draw prize (Red Heart)
function drawPrize() {
    ctx.save();
    ctx.translate(prize.x + prize.width / 2, prize.y + prize.height / 2);
    ctx.fillStyle = 'Pink';
    ctx.beginPath();
    ctx.moveTo(0, prize.height / 4);
    ctx.bezierCurveTo(prize.width / 2, -prize.height / 4, prize.width / 2, prize.height / 2, 0, prize.height / 2);
    ctx.bezierCurveTo(-prize.width / 2, prize.height / 2, -prize.width / 2, -prize.height / 4, 0, prize.height / 4);
    ctx.fill();
    ctx.restore();
}

// Game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameOver && prize.collected ? 'You Win!' : 'Game Over', canvas.width / 2, canvas.height / 2);

    ctx.font = '30px Arial';
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

// Handle keyboard input
window.addEventListener('keydown', function (e) {
    keys[e.key] = true;

    if (gameOver && e.key === 'Enter') {
        gameOver = false;
        init();
    }
});

window.addEventListener('keyup', function (e) {
    keys[e.key] = false;
});

// Start the game
init();

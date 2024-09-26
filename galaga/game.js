// Get Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game Variables
let score = 0;
let lives = 3;
let gameOver = false;
let currentLevel = 1;
const maxLevel = 10;

// Power-Up Variables
let currentPowerUp = null;
let powerUpTimer = 0;
const powerUpDuration = 10000; // 10 seconds
let powerUpCount = 0; // Number of power-ups collected (max 4 for rate doubling)

// Audio Elements
const fireSound = document.getElementById('fireSound');
const deathSound = document.getElementById('deathSound');
const explosionSound = document.getElementById('explosionSound');

// Player Variables
const playerWidth = 40;
const playerHeight = 30;
const playerSpeed = 5;
let playerX = (canvas.width - playerWidth) / 2;
let playerY = canvas.height - playerHeight - 20;
let shootInterval = 500; // milliseconds
let lastShotTime = 0;
let shootingMode = 'single'; // 'single', 'continuous', 'triangular', 'plasma'

// Bullet Variables
const bulletWidth = 4;
const bulletHeight = 10;
const bulletSpeed = 7;
let bullets = [];
let plasmaBullets = [];

// Enemy Variables
const enemyWidth = 40;
const enemyHeight = 30;
const enemySpeedBase = 1.5;
let enemies = [];
let enemyDirection = 1; // 1: right, -1: left

// Bomb and Explosion Variables
let bombs = []; // Array to hold bomb objects
let explosions = []; // Array to hold explosion objects

// Power-Up Types
const powerUpTypes = ['triangular', 'plasma']; // Excluding 'continuous' as it's handled via power-up count
let powerUps = [];

// Key Controls
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

// Enemy Patterns Definitions
const enemyPatterns = {
    1: () => {
        // Pattern 1: Grid Formation
        const rows = 3;
        const cols = 7;
        const offsetTop = 60;
        const offsetLeft = (canvas.width - (cols * (enemyWidth + 20) - 20)) / 2;
        enemies = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemyX = offsetLeft + col * (enemyWidth + 20);
                const enemyY = offsetTop + row * (enemyHeight + 20);
                enemies.push({
                    x: enemyX,
                    y: enemyY,
                    alive: true,
                    direction: 1
                });
            }
        }
    },
    2: () => {
        // Pattern 2: Zig-Zag Formation
        const rows = 4;
        const cols = 5;
        const offsetTop = 60;
        const offsetLeft = 100;
        enemies = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemyX = offsetLeft + col * (enemyWidth + 30) + (row % 2) * 15;
                const enemyY = offsetTop + row * (enemyHeight + 20);
                enemies.push({
                    x: enemyX,
                    y: enemyY,
                    alive: true,
                    direction: row % 2 === 0 ? 1 : -1
                });
            }
        }
    },
    3: () => {
        // Pattern 3: Diamond Formation
        const centerX = canvas.width / 2;
        const centerY = 80;
        enemies = [];
        const positions = [
            { x: centerX, y: centerY },
            { x: centerX - 60, y: centerY + 40 },
            { x: centerX + 60, y: centerY + 40 },
            { x: centerX - 120, y: centerY + 80 },
            { x: centerX + 120, y: centerY + 80 }
        ];
        positions.forEach(pos => {
            enemies.push({
                x: pos.x,
                y: pos.y,
                alive: true,
                direction: 1
            });
        });
    },
    4: () => {
        // Pattern 4: Column Formation
        const cols = 5;
        const rows = 6;
        const offsetLeft = 150;
        const offsetTop = 60;
        enemies = [];
        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < rows; row++) {
                const enemyX = offsetLeft + col * (enemyWidth + 40);
                const enemyY = offsetTop + row * (enemyHeight + 20);
                enemies.push({
                    x: enemyX,
                    y: enemyY,
                    alive: true,
                    direction: 1
                });
            }
        }
    },
    5: () => {
        // Pattern 5: Random Scattered Formation
        enemies = [];
        for (let i = 0; i < 20; i++) {
            const enemyX = Math.random() * (canvas.width - enemyWidth);
            const enemyY = Math.random() * 200;
            enemies.push({
                x: enemyX,
                y: enemyY,
                alive: true,
                direction: Math.random() < 0.5 ? 1 : -1
            });
        }
    },
    6: () => {
        // Pattern 6: Circular Formation
        const centerX = canvas.width / 2;
        const centerY = 100;
        const radius = 100;
        enemies = [];
        const total = 12;
        for (let i = 0; i < total; i++) {
            const angle = (2 * Math.PI / total) * i;
            const enemyX = centerX + radius * Math.cos(angle);
            const enemyY = centerY + radius * Math.sin(angle);
            enemies.push({
                x: enemyX,
                y: enemyY,
                alive: true,
                direction: 1
            });
        }
    },
    7: () => {
        // Pattern 7: Double Rows
        const rows = 2;
        const cols = 10;
        const offsetTop = 60;
        const offsetLeft = (canvas.width - (cols * (enemyWidth + 15) - 15)) / 2;
        enemies = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemyX = offsetLeft + col * (enemyWidth + 15);
                const enemyY = offsetTop + row * (enemyHeight + 20);
                enemies.push({
                    x: enemyX,
                    y: enemyY,
                    alive: true,
                    direction: row % 2 === 0 ? 1 : -1
                });
            }
        }
    },
    8: () => {
        // Pattern 8: V-Formation
        const centerX = canvas.width / 2;
        const startY = 60;
        enemies = [];
        const depth = 5;
        for (let i = 0; i < depth; i++) {
            enemies.push({
                x: centerX - i * 40,
                y: startY + i * 40,
                alive: true,
                direction: 1
            });
            enemies.push({
                x: centerX + i * 40,
                y: startY + i * 40,
                alive: true,
                direction: 1
            });
        }
    },
    9: () => {
        // Pattern 9: Checkerboard Formation
        const rows = 4;
        const cols = 8;
        const offsetTop = 60;
        const offsetLeft = (canvas.width - (cols * (enemyWidth + 10) - 10)) / 2;
        enemies = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row + col) % 2 === 0) { // Checkerboard pattern
                    const enemyX = offsetLeft + col * (enemyWidth + 10);
                    const enemyY = offsetTop + row * (enemyHeight + 20);
                    enemies.push({
                        x: enemyX,
                        y: enemyY,
                        alive: true,
                        direction: 1
                    });
                }
            }
        }
    },
    10: () => {
        // Pattern 10: Spiral Formation
        const centerX = canvas.width / 2;
        const centerY = 100;
        const radius = 80;
        enemies = [];
        const total = 20;
        for (let i = 0; i < total; i++) {
            const angle = (2 * Math.PI / total) * i + (i * 0.1);
            const enemyX = centerX + radius * Math.cos(angle);
            const enemyY = centerY + radius * Math.sin(angle);
            enemies.push({
                x: enemyX,
                y: enemyY,
                alive: true,
                direction: 1
            });
        }
    }
};

// Initialize Enemies Based on Current Level
function loadLevel(level) {
    if (level > maxLevel) {
        level = maxLevel;
    }
    currentLevel = level;
    document.getElementById('level').innerText = `Level: ${currentLevel}`;
    enemyPatterns[currentLevel]();
    // Reset enemy direction for new level
    enemyDirection = 1;
}

// Handle Level Progression
function checkLevelCompletion() {
    const allDead = enemies.every(enemy => !enemy.alive);
    if (allDead) {
        if (currentLevel < maxLevel) {
            loadLevel(currentLevel + 1);
        } else {
            // Game Completed
            gameOver = true;
            ctx.fillStyle = 'white';
            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CONGRATULATIONS!', canvas.width / 2, canvas.height / 2);
        }
    }
}

// Handle Power-Up Effects (Rate of Fire)
function handlePowerUpEffects() {
    if (powerUpCount > 0 && powerUpCount <= 4) {
        // Each power-up collected halves the shootInterval
        shootInterval = 500 / Math.pow(2, powerUpCount);
    } else if (powerUpCount > 4) {
        // After 4 power-ups, set shooting to continuous
        shootingMode = 'continuous';
    }
}

// Initialize First Level
loadLevel(currentLevel);

// Handle Keyboard Input
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'Space') keys.space = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'Space') keys.space = false;
});

// Player Movement
function movePlayer() {
    if (keys.left && playerX > 0) {
        playerX -= playerSpeed;
    }
    if (keys.right && playerX < canvas.width - playerWidth) {
        playerX += playerSpeed;
    }
    if (keys.up && playerY > 0) {
        playerY -= playerSpeed;
    }
    if (keys.down && playerY < canvas.height - playerHeight) {
        playerY += playerSpeed;
    }
}

// Shoot Bullets Based on Shooting Mode and Power-Up Count
function shoot(currentTime) {
    // Handle rate of fire based on power-up count
    if (powerUpCount > 0 && powerUpCount <= 4) {
        shootInterval = 500 / Math.pow(2, powerUpCount);
    } else if (powerUpCount > 4) {
        shootingMode = 'continuous';
    }

    if (shootingMode === 'single') {
        if (keys.space && currentTime - lastShotTime > shootInterval) {
            const bullet = {
                x: playerX + playerWidth / 2 - bulletWidth / 2,
                y: playerY,
                active: true
            };
            bullets.push(bullet);
            lastShotTime = currentTime;
            playSound(fireSound);
        }
    } else if (shootingMode === 'continuous') {
        if (currentTime - lastShotTime > shootInterval) {
            const bullet = {
                x: playerX + playerWidth / 2 - bulletWidth / 2,
                y: playerY,
                active: true
            };
            bullets.push(bullet);
            lastShotTime = currentTime;
            playSound(fireSound);
        }
    } else if (shootingMode === 'triangular') {
        if (keys.space && currentTime - lastShotTime > shootInterval) {
            const centerBullet = {
                x: playerX + playerWidth / 2 - bulletWidth / 2,
                y: playerY,
                active: true
            };
            const leftBullet = {
                x: playerX + playerWidth / 2 - bulletWidth / 2 - 10,
                y: playerY + 5,
                angle: -0.2, // Radians
                active: true
            };
            const rightBullet = {
                x: playerX + playerWidth / 2 - bulletWidth / 2 + 10,
                y: playerY + 5,
                angle: 0.2,
                active: true
            };
            bullets.push(centerBullet, leftBullet, rightBullet);
            lastShotTime = currentTime;
            playSound(fireSound);
        }
    } else if (shootingMode === 'plasma') {
        if (keys.space && currentTime - lastShotTime > shootInterval * 2) {
            const plasma = {
                x: playerX + playerWidth / 2 - bulletWidth,
                y: playerY,
                width: bulletWidth * 2,
                height: bulletHeight * 2,
                active: true
            };
            plasmaBullets.push(plasma);
            lastShotTime = currentTime;
            playSound(fireSound);
        }
    }
}

// Utility Function to Play Sound
function playSound(sound) {
    sound.currentTime = 0; // Reset to start
    sound.play();
}

// Move Bullets
function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        // Remove bullets that are off-screen
        if (bullet.y < -bulletHeight) {
            bullets.splice(index, 1);
        }
        // Handle angled bullets
        if (bullet.angle) {
            bullet.x += Math.sin(bullet.angle) * 2;
            // Remove bullets that go off-screen horizontally
            if (bullet.x < 0 || bullet.x > canvas.width) {
                bullets.splice(index, 1);
            }
        }
    });
}

// Move Plasma Bullets
function movePlasmaBullets() {
    plasmaBullets.forEach((plasma, index) => {
        plasma.y -= bulletSpeed * 2;
        if (plasma.y < -plasma.height) {
            plasmaBullets.splice(index, 1);
        }
    });
}

// Move Enemies
function moveEnemies() {
    let changeDirection = false;
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemySpeedBase * enemy.direction;
            // Change direction if hitting canvas edges
            if (enemy.x + enemyWidth > canvas.width - 20 || enemy.x < 20) {
                changeDirection = true;
            }
        }
    });
    if (changeDirection) {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += enemyHeight / 2;
                enemy.direction *= -1;
            }
        });
    }
}

// Enemy Shooting (Random Shooter)
function enemyShoot(currentTime) {
    enemies.forEach(enemy => {
        if (enemy.alive && Math.random() < 0.001) { // Adjust probability as needed
            const bullet = {
                x: enemy.x + enemyWidth / 2 - bulletWidth / 2,
                y: enemy.y + enemyHeight,
                active: true,
                fromEnemy: true
            };
            bullets.push(bullet);
        }

        // Enemies can also drop bombs with a separate probability
        if (enemy.alive && Math.random() < 0.0005) { // Adjust probability as needed
            const bomb = {
                x: enemy.x + enemyWidth / 2 - 5,
                y: enemy.y + enemyHeight,
                active: true,
                speed: 3
            };
            bombs.push(bomb);
        }
    });
}

// Move Enemy Bullets
function moveEnemyBullets() {
    bullets.forEach((bullet, index) => {
        if (bullet.fromEnemy) {
            bullet.y += bulletSpeed * 1.5;
            if (bullet.y > canvas.height) {
                bullets.splice(index, 1);
            }
        }
    });
}

// Collision Detection
function detectCollisions() {
    // Bullets hitting enemies
    bullets.forEach((bullet, bIndex) => {
        if (!bullet.fromEnemy) {
            enemies.forEach((enemy, eIndex) => {
                if (enemy.alive &&
                    bullet.x < enemy.x + enemyWidth &&
                    bullet.x + (bullet.width || bulletWidth) > enemy.x &&
                    bullet.y < enemy.y + enemyHeight &&
                    bullet.y + (bullet.height || bulletHeight) > enemy.y) {
                        enemies[eIndex].alive = false;
                        bullets.splice(bIndex, 1);
                        score += 10;
                        document.getElementById('score').innerText = `Score: ${score}`;
                        // Chance to drop a power-up
                        if (Math.random() < 0.3) { // 30% chance
                            dropPowerUp(enemy.x + enemyWidth / 2, enemy.y + enemyHeight);
                        }
                }
            });
        } else {
            // Enemy bullets hitting player
            if (
                bullet.x < playerX + playerWidth &&
                bullet.x + bulletWidth > playerX &&
                bullet.y < playerY + playerHeight &&
                bullet.y + bulletHeight > playerY
            ) {
                bullets.splice(bIndex, 1);
                lives -= 1;
                document.getElementById('lives').innerText = `Lives: ${lives}`;
                playSound(deathSound);
                if (lives <= 0) {
                    gameOver = true;
                }
            }
        }
    });

    // Plasma bullets hitting enemies
    plasmaBullets.forEach((plasma, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (enemy.alive &&
                plasma.x < enemy.x + enemyWidth &&
                plasma.x + plasma.width > enemy.x &&
                plasma.y < enemy.y + enemyHeight &&
                plasma.y + plasma.height > enemy.y) {
                    enemies[eIndex].alive = false;
                    plasmaBullets.splice(pIndex, 1);
                    score += 20;
                    document.getElementById('score').innerText = `Score: ${score}`;
                    // Chance to drop a power-up
                    if (Math.random() < 0.3) { // 30% chance
                        dropPowerUp(enemy.x + enemyWidth / 2, enemy.y + enemyHeight);
                    }
            }
        });
    });

    // Bombs colliding with player
    bombs.forEach((bomb, bIndex) => {
        // Check collision with player
        if (
            bomb.x < playerX + playerWidth &&
            bomb.x + 10 > playerX &&
            bomb.y < playerY + playerHeight &&
            bomb.y + 10 > playerY
        ) {
            bombs.splice(bIndex, 1);
            lives -= 1;
            document.getElementById('lives').innerText = `Lives: ${lives}`;
            playSound(deathSound);
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });

    // Explosions affecting the player
    explosions.forEach((explosion, eIndex) => {
        const dist = Math.hypot(
            (explosion.x - (playerX + playerWidth / 2)),
            (explosion.y - (playerY + playerHeight / 2))
        );
        if (dist < explosion.radius) {
            explosions.splice(eIndex, 1);
            lives -= 1;
            document.getElementById('lives').innerText = `Lives: ${lives}`;
            playSound(deathSound);
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });

    // Power-ups colliding with player
    powerUps.forEach((powerUp, puIndex) => {
        if (
            powerUp.x < playerX + playerWidth &&
            powerUp.x + powerUp.size > playerX &&
            powerUp.y < playerY + playerHeight &&
            powerUp.y + powerUp.size > playerY
        ) {
            collectPowerUp(powerUp.type);
            powerUps.splice(puIndex, 1);
        }
    });

    // Check if enemies reach the player
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemyHeight >= playerY) {
            gameOver = true;
            playSound(deathSound);
        }
    });

    // Check for Level Completion
    checkLevelCompletion();
}

// Drop a Power-Up at Specific Location
function dropPowerUp(x, y) {
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({
        x: x - 10,
        y: y,
        size: 20,
        type: type,
        speed: 2
    });
}

// Move Power-Ups
function movePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

// Collect Power-Up
function collectPowerUp(type) {
    if (powerUpCount < 4) {
        powerUpCount++;
        handlePowerUpEffects();
    } else if (powerUpCount >= 4) {
        // Switch shooting mode to the new power-up type
        shootingMode = type;
        // Reset shootInterval to default since 'continuous' is removed
        shootInterval = 500 / Math.pow(2, 4); // Assuming powerUpCount is 4
    }

    // Apply Power-Up Type Effects
    if (type === 'triangular') {
        shootingMode = 'triangular';
    } else if (type === 'plasma') {
        shootingMode = 'plasma';
    }

    // Update Power-Up Display
    let displayText = `Power-Ups: ${powerUpCount}`;
    if (powerUpCount >= 4) {
        displayText = `Power-Up: Continuous`;
    }
    document.getElementById('powerUp').innerText = displayText;

    // Reset Power-Up Timer if already active
    if (currentPowerUp) {
        powerUpTimer = Date.now();
    } else {
        currentPowerUp = type;
        powerUpTimer = Date.now();
    }
}

// Handle Power-Up Effects (Rate of Fire)
function handlePowerUpEffects() {
    if (powerUpCount > 0 && powerUpCount <= 4) {
        // Each power-up collected halves the shootInterval
        shootInterval = 500 / Math.pow(2, powerUpCount);
    } else if (powerUpCount > 4) {
        // After 4 power-ups, set shooting to continuous
        shootingMode = 'continuous';
    }
}

// Handle Power-Up Expiration
function handlePowerUpExpiration() {
    if (powerUpCount > 4 && shootingMode === 'continuous') {
        // Continuous mode stays until a new power-up is collected
        return;
    }

    if (currentPowerUp && Date.now() - powerUpTimer > powerUpDuration) {
        // Revert shooting mode based on power-up count
        if (powerUpCount > 0 && powerUpCount <= 4) {
            shootingMode = 'single';
        } else if (powerUpCount > 4) {
            shootingMode = 'continuous';
        }
        currentPowerUp = null;
        document.getElementById('powerUp').innerText = powerUpCount > 0 ? `Power-Ups: ${powerUpCount}` : `Power-Up: None`;
    }
}

// Drop a Bomb from Enemy
function dropBomb(bomb) {
    // Create an explosion when bomb hits the ground
    const explosion = {
        x: bomb.x + 5, // Center of the bomb
        y: canvas.height - 10, // Ground level
        radius: 0,
        maxRadius: 50,
        speed: 2
    };
    explosions.push(explosion);
    playSound(explosionSound);
}

// Create Explosion at Bomb's Position
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 50,
        speed: 2
    });
    playSound(explosionSound);
}

// Move Bombs
function moveBombs() {
    bombs.forEach((bomb, index) => {
        bomb.y += bomb.speed;
        // Check collision with ground
        if (bomb.y >= canvas.height - 10) {
            bombs.splice(index, 1);
            dropBomb(bomb);
        }
        // Check collision with player
        if (
            bomb.x < playerX + playerWidth &&
            bomb.x + 10 > playerX &&
            bomb.y < playerY + playerHeight &&
            bomb.y + 10 > playerY
        ) {
            bombs.splice(index, 1);
            lives -= 1;
            document.getElementById('lives').innerText = `Lives: ${lives}`;
            playSound(deathSound);
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });
}

// Move Explosions
function moveExplosions() {
    explosions.forEach((explosion, index) => {
        explosion.radius += explosion.speed;
        if (explosion.radius > explosion.maxRadius) {
            explosions.splice(index, 1);
        }
    });
}

// Create Explosion upon Bomb Impact with Ground or Player
function handleBombExplosion(x, y) {
    createExplosion(x, y);
}

// Draw Player with Improved Graphics
function drawPlayer() {
    ctx.save();
    ctx.translate(playerX, playerY);

    // Draw ship body
    const gradient = ctx.createLinearGradient(0, 0, 0, playerHeight);
    gradient.addColorStop(0, 'lime');
    gradient.addColorStop(1, 'green');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, playerHeight);
    ctx.lineTo(playerWidth / 2, 0);
    ctx.lineTo(playerWidth, playerHeight);
    ctx.closePath();
    ctx.fill();

    // Draw window
    ctx.fillStyle = 'black';
    ctx.fillRect(playerWidth / 4, playerHeight / 3, playerWidth / 2, playerHeight / 3);

    ctx.restore();
}

// Draw Enemies with Improved Graphics
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);

            // Draw enemy ship
            const gradient = ctx.createLinearGradient(0, 0, 0, enemyHeight);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1, 'darkred');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, enemyHeight);
            ctx.lineTo(enemyWidth / 2, 0);
            ctx.lineTo(enemyWidth, enemyHeight);
            ctx.closePath();
            ctx.fill();

            // Draw enemy window
            ctx.fillStyle = 'black';
            ctx.fillRect(enemyWidth / 4, enemyHeight / 3, enemyWidth / 2, enemyHeight / 3);

            ctx.restore();
        }
    });
}

// Draw Bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.fromEnemy ? 'yellow' : 'white';
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bullet.height || bulletHeight);
    });
}

// Draw Plasma Bullets
function drawPlasmaBullets() {
    plasmaBullets.forEach(plasma => {
        const gradient = ctx.createRadialGradient(
            plasma.x + plasma.width / 2,
            plasma.y + plasma.height / 2,
            0,
            plasma.x + plasma.width / 2,
            plasma.y + plasma.height / 2,
            plasma.width
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            plasma.x + plasma.width / 2,
            plasma.y + plasma.height / 2,
            plasma.width / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

// Draw Bombs
function drawBombs() {
    bombs.forEach(bomb => {
        ctx.fillStyle = 'brown';
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw Explosions
function drawExplosions() {
    explosions.forEach(explosion => {
        const gradient = ctx.createRadialGradient(
            explosion.x,
            explosion.y,
            0,
            explosion.x,
            explosion.y,
            explosion.radius
        );
        gradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)'); // Orange
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw Power-Ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);

        if (powerUp.type === 'triangular') {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(0, 20);
            ctx.lineTo(20, 20);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText('T', 7, 15);
        } else if (powerUp.type === 'plasma') {
            ctx.fillStyle = 'purple';
            ctx.beginPath();
            ctx.arc(10, 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText('P', 6, 15);
        }

        ctx.restore();
    });
}

// Draw Everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawPlasmaBullets();
    drawBombs();
    drawExplosions();
    drawPowerUps();
}

// Game Loop
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        if (currentLevel > maxLevel) {
            ctx.fillText('CONGRATULATIONS!', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
        return;
    }

    const currentTime = Date.now();

    movePlayer();
    shoot(currentTime);
    moveBullets();
    movePlasmaBullets();
    moveEnemies();
    enemyShoot(currentTime);
    moveEnemyBullets();
    moveBombs();
    moveExplosions();
    movePowerUps();
    detectCollisions();
    handlePowerUpExpiration();
    draw();

    requestAnimationFrame(gameLoop);
}

// Start Game Loop
gameLoop();

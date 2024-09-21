const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let player, bullets, enemies, powerUps, explosions;
let keys = {};
let score = 0;
let gameOver = false;

// Load sounds
const shootSound = new Audio('sounds/shoot.wav');
const explosionSound = new Audio('sounds/explosion.wav');
const powerUpSound = new Audio('sounds/powerup.wav');

// Starry background
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2
    });
}

// Event listeners for key presses
document.addEventListener('keydown', function (e) {
    keys[e.code] = true;
});
document.addEventListener('keyup', function (e) {
    keys[e.code] = false;
});

// Added variables for power-up tracking and continuous firing
let fireRate = 500; // Initial cooldown between shots in milliseconds
let powerUpCount = 0; // Counts the number of fire rate power-ups collected
let isTriangularWeaponActive = false; // Flag to check if triangular weapon is active
let continuousFireInterval; // Holds the interval for continuous firing

// Game initialization
function init() {
    player = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        width: 40,
        height: 20,
        speed: 5
    };

    bullets = [];
    enemies = [];
    powerUps = [];
    explosions = [];

    // Spawn initial enemies
    for (let i = 0; i < 5; i++) {
        spawnEnemy();
    }

    // Spawn power-up every 5 seconds
    setInterval(() => {
        if (enemies.length > 0) {
            const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
            spawnPowerUp(randomEnemy.x + randomEnemy.width / 2, randomEnemy.y + randomEnemy.height);
        }
    }, 5000);

    requestAnimationFrame(gameLoop);
}

// Enemy spawner
function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 20,
        speed: 2
    };
    enemies.push(enemy);
}

// Modified spawnPowerUp to accept position
function spawnPowerUp(x, y) {
    const powerUp = {
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 3,
        type: 'fireRate' // Power-up type
    };
    powerUps.push(powerUp);
}

// Game loop
function gameLoop() {
    if (gameOver) {
        displayGameOver();
        return;
    }

    update();
    render();

    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Move player
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Shooting
    if (!isTriangularWeaponActive && keys['Space']) {
        shoot();
    }

    // Big bomb
    if (keys['AltLeft']) {
        deployBomb();
    }

    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx || 0; // For angled bullets
        bullet.y -= bullet.speed;
        if (bullet.y < 0 || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }
    });

    // Update enemies
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            spawnEnemy();
        }
    });

    // Update power-ups
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });

    // Collision detection
    checkCollisions();

    // Update explosions
    explosions.forEach((explosion, index) => {
        explosion.frame++;
        if (explosion.frame > 20) {
            explosions.splice(index, 1);
        }
    });
}

// Modified shoot function to use fireRate
let lastShotTime = 0;
function shoot() {
    const now = Date.now();
    if (now - lastShotTime > fireRate) {
        // Single bullet for normal weapon
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        });
        shootSound.play();
        lastShotTime = now;
    }
}

// **New function for triangular shooting**
function triangularShoot() {
    // Fire three bullets at different angles
    bullets.push(
        {
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7,
            dx: -2 // Left diagonal
        },
        {
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7,
            dx: 0 // Straight up
        },
        {
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7,
            dx: 2 // Right diagonal
        }
    );
    shootSound.play();
}

// Deploy big bomb
let bombAvailable = true;
function deployBomb() {
    if (bombAvailable) {
        enemies = [];
        explosions.push({
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            frame: 0
        });
        explosionSound.play();
        bombAvailable = false;
    }
}

// Collision detection
function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isColliding(bullet, enemy)) {
                bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                explosions.push({
                    x: enemy.x,
                    y: enemy.y,
                    width: enemy.width,
                    height: enemy.height,
                    frame: 0
                });
                explosionSound.play();
                score += 10;
                spawnEnemy();
            }
        });
    });

    enemies.forEach((enemy) => {
        if (isColliding(enemy, player)) {
            gameOver = true;
            clearInterval(continuousFireInterval); // Stop continuous firing if game over
        }
    });

    // Updated power-up collision logic
    powerUps.forEach((powerUp, pIndex) => {
        if (isColliding(powerUp, player)) {
            powerUps.splice(pIndex, 1);
            powerUpSound.play();

            if (powerUp.type === 'fireRate') {
                powerUpCount++;
                if (powerUpCount < 5) {
                    // Halve the fireRate to double the firing speed
                    fireRate = Math.max(fireRate / 2, 50); // Minimum fireRate of 50 ms
                } else if (powerUpCount === 5) {
                    // Activate triangular continuous firing weapon
                    activateTriangularWeapon();
                }
            }

            // Implement other power-up effects if any
        }
    });
}

// **Function to activate the triangular weapon**
function activateTriangularWeapon() {
    isTriangularWeaponActive = true;

    // Stop any existing continuous firing interval
    if (continuousFireInterval) {
        clearInterval(continuousFireInterval);
    }

    // Start continuous firing
    continuousFireInterval = setInterval(() => {
        triangularShoot();
    }, 200); // Firing interval in milliseconds
}

// Collision detection helper
function isColliding(a, b) {
    return !(
        a.x + a.width < b.x ||
        a.x > b.x + b.width ||
        a.y + a.height < b.y ||
        a.y > b.y + b.height
    );
}

// Render game state
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'white';
    stars.forEach((star) => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw player
    drawShip(player.x, player.y, player.width, player.height, 'green');

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    enemies.forEach((enemy) => {
        drawShip(enemy.x, enemy.y, enemy.width, enemy.height, 'red');
    });

    // Render power-ups as shiny balls
    powerUps.forEach((powerUp) => {
        // Create a radial gradient for the shiny effect
        const gradient = ctx.createRadialGradient(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 8,
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 2
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, 'gold');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
    });

    // Draw explosions
    explosions.forEach((explosion) => {
        ctx.fillStyle = `rgba(255, 165, 0, ${1 - explosion.frame / 20})`;
        ctx.beginPath();
        ctx.arc(
            explosion.x + explosion.width / 2,
            explosion.y + explosion.height / 2,
            explosion.frame * 5,
            0,
            2 * Math.PI
        );
        ctx.fill();
    });

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
}

// Draw ship with pseudo-3D effect
function drawShip(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y - height / 2);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();

    // Shading for 3D effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y - height / 2);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width / 2, y + height / 2);
    ctx.closePath();
    ctx.fill();
}

// Display Game Over
function displayGameOver() {
    ctx.fillStyle = 'red';
    ctx.font = '50px Arial';
    ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
}

// Start the game
init();

// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let score = 0;
let lives = 3;
let level = 1;
let gameInterval;
let gamePaused = false;

// Maze variables
const tileSize = 20;
const map = [
  // 23 rows x 28 columns (indexing from 0)
  // Legend: 0 - empty, 1 - wall, 2 - pellet, 3 - power pellet
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 2
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 1
  [1,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1], // Row 2
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 3
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 4
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 5
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 6
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 7
  [1,2,2,2,2,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,2,2,2,2,2,1], // Row 8
  [1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1], // Row 9
  [1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1], // Row 12
  [1,2,3,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,3,2,1], // Row 11
  [1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1], // Row 12
  [1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1], // Row 13
  [1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1], // Row 14
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 15
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 16
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 17
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 18
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 19
  [1,2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,2,1], // Row 22
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 21
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 22
];

// Copy of the original map for resetting
const originalMap = JSON.parse(JSON.stringify(map));

const directions = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

// Player (Pacmi)
const player = {
    x: (13 * tileSize) - tileSize,
    y: (17 * tileSize) - tileSize,
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0,
    speed: 2,
    radius: tileSize/2 - 2,
    mouthAngle: 0,
    mouthOpening: true,
    angle: 0,
  };

// Ghosts
class Ghost {
  constructor(x, y, color) {
    this.x = x * tileSize;
    this.y = y * tileSize;
    this.dx = 0;
    this.dy = 0;
    this.speed = 2;
    this.radius = tileSize/2 - 2;
    this.color = color;
    this.mode = 'normal'; // 'normal', 'frightened', 'eaten'
    this.frightenedTimer = 0;
  }

  update() {
    if (this.mode === 'frightened') {
      this.frightenedTimer--;
      if (this.frightenedTimer <= 0) {
        this.mode = 'normal';
      }
    }

    // Change direction only when aligned with the grid
    if (Math.floor(this.x % tileSize) === 0 && Math.floor(this.y % tileSize) === 0) {
      const possibleDirections = [];
      for (const dir in directions) {
        const { dx, dy } = directions[dir];
        const newX = this.x + dx * tileSize;
        const newY = this.y + dy * tileSize;
        if (!isCollisionWithWall(newX, newY) && !(dx === -this.dx / this.speed && dy === -this.dy / this.speed)) {
          possibleDirections.push({ dx, dy });
        }
      }
      if (possibleDirections.length > 0) {
        const randomDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        this.dx = randomDir.dx * this.speed;
        this.dy = randomDir.dy * this.speed;
      }
    }

    // Move ghost
    this.x += this.dx;
    this.y += this.dy;

    // Tunnel effect
    if (this.x < -tileSize) {
      this.x = canvas.width;
    } else if (this.x > canvas.width) {
      this.x = -tileSize;
    }

    // Collision with walls
    if (isCollisionWithWall(this.x, this.y)) {
      this.x -= this.dx;
      this.y -= this.dy;
      this.dx = 0;
      this.dy = 0;
    }
  }

  draw() {
    ctx.fillStyle = this.mode === 'frightened' ? 'blue' : this.color;
    ctx.beginPath();
    ctx.arc(
      this.x + tileSize,
      this.y + tileSize,
      this.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

const ghosts = [
  new Ghost(13, 11, 'red'),
  new Ghost(14, 11, 'pink'),
  new Ghost(13, 13, 'cyan'),
  new Ghost(14, 13, 'orange'),
];

// Event Listeners
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (directions[key]) {
    changeDirection(key);
  } else if (key === 'Escape') {
    gamePaused = !gamePaused;
  }
});

function changeDirection(key) {
  const dir = directions[key];
  player.nextDx = dir.dx * player.speed;
  player.nextDy = dir.dy * player.speed;
}

function gameLoop() {
  if (!gamePaused) {
    update();
    draw();
  }
}

function update() {
  // Update player position
  const nextX = player.x + player.nextDx;
  const nextY = player.y + player.nextDy;

  if (!isCollisionWithWall(nextX, nextY)) {
    player.dx = player.nextDx;
    player.dy = player.nextDy;
  }

  player.x += player.dx;
  player.y += player.dy;

  // Tunnel effect
  if (player.x < -tileSize) {
    player.x = canvas.width;
  } else if (player.x > canvas.width) {
    player.x = -tileSize;
  }

  // Collision with walls
  if (isCollisionWithWall(player.x, player.y)) {
    player.x -= player.dx;
    player.y -= player.dy;
    player.dx = 0;
    player.dy = 0;
  }

  // Eat pellets
  eatPellet();

  // Update ghosts
  ghosts.forEach((ghost) => {
    ghost.update();

    // Check for collision with player
    if (
      Math.abs(player.x - ghost.x) < tileSize / 2 &&
      Math.abs(player.y - ghost.y) < tileSize / 2
    ) {
      if (ghost.mode === 'frightened') {
        ghost.mode = 'eaten';
        score += 200;
        updateScore();
        ghost.x = 13 * tileSize;
        ghost.y = 11 * tileSize;
      } else if (ghost.mode !== 'eaten') {
        loseLife();
      }
    }
  });

  // Win condition
  if (checkWin()) {
    levelUp();
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw maze
  drawMaze();

  // Draw pellets
  drawPellets();

  // Draw player
  drawPlayer();

  // Draw ghosts
  ghosts.forEach((ghost) => ghost.draw());
}

function drawMaze() {
  ctx.fillStyle = 'blue';
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 1) {
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }
  }
}

function drawPellets() {
  ctx.fillStyle = 'white';
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 2) {
        ctx.beginPath();
        ctx.arc(
          col * tileSize + tileSize / 2,
          row * tileSize + tileSize / 2,
          3,
          0,
          2 * Math.PI
        );
        ctx.fill();
      } else if (map[row][col] === 3) {
        drawCherry(col * tileSize, row * tileSize);
        // ctx.beginPath();
        // ctx.arc(
        //   col * tileSize + tileSize / 2,
        //   row * tileSize + tileSize / 2,
        //   6,
        //   0,
        //   2 * Math.PI
        // );
        // ctx.fill();
      }
    }
  }
}

function drawPlayer() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    const mouthSize = player.mouthOpening ? 0.2 : 0;
    ctx.moveTo(player.x + tileSize / 2, player.y + tileSize / 2);
    ctx.arc(
        player.x + tileSize / 2,
        player.y + tileSize / 2,
        player.radius,
      (mouthSize + player.angle) * Math.PI,
      (2 - mouthSize + player.angle) * Math.PI
    );
    ctx.closePath();
    ctx.fill();

  // Animate mouth
  if (player.mouthOpening) {
    player.mouthAngle += 0.05;
    if (player.mouthAngle > 0.2) {
      player.mouthOpening = false;
    }
  } else {
    player.mouthAngle -= 0.05;
    if (player.mouthAngle < 0) {
      player.mouthOpening = true;
    }
  }

  // Update angle based on direction
  if (player.dx > 0) player.angle = 0;
  if (player.dx < 0) player.angle = 1;
  if (player.dy > 0) player.angle = 0.5;
  if (player.dy < 0) player.angle = 1.5;
}

function isCollisionWithWall(x, y) {
    const col = Math.floor((x + tileSize / 2) / tileSize);
    const row = Math.floor((y + tileSize / 2) / tileSize);

  // Wrap around for tunnel effect
  const wrappedCol = (col + map[0].length) % map[0].length;

  // Ensure row and col are within bounds
  if (row < 0 || row >= map.length || wrappedCol < 0 || wrappedCol >= map[0].length) {
    return true;
  }

  return map[row][wrappedCol] === 1;
}

function eatPellet() {
    const col = Math.floor((player.x + tileSize / 2) / tileSize);
    const row = Math.floor((player.y + tileSize / 2) / tileSize);

  // Wrap around for tunnel effect
  const wrappedCol = (col + map[0].length) % map[0].length;

  // Ensure row and col are within bounds
  if (row < 0 || row >= map.length || wrappedCol < 0 || wrappedCol >= map[0].length) {
    return;
  }

  if (map[row][wrappedCol] === 2) {
    map[row][wrappedCol] = 0;
    score += 10;
    updateScore();
  } else if (map[row][wrappedCol] === 3) {
    map[row][wrappedCol] = 0;
    score += 50;
    updateScore();
    ghosts.forEach((ghost) => {
      ghost.mode = 'frightened';
      ghost.frightenedTimer = 300; // Frightened for 5 seconds
    });
  }
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

function loseLife() {
  lives--;
  document.getElementById('lives').textContent = lives;
  if (lives <= 0) {
    gameOver();
  } else {
    resetPositions();
  }
}

function resetPositions() {
    player.x = (13.5 * tileSize) - tileSize;
    player.y = (17 * tileSize) - tileSize;
    player.dx = 0;
    player.dy = 0;
    player.nextDx = 0;
    player.nextDy = 0;
    ghosts.forEach((ghost) => {
      ghost.x = 13 * tileSize;
      ghost.y = 11 * tileSize;
      ghost.dx = 0;
      ghost.dy = 0;
      ghost.mode = 'normal';
    });
  }

function checkWin() {
  for (let row = 0; row < map.length; row++) {
    if (map[row].includes(2) || map[row].includes(3)) {
      return false;
    }
  }
  return true;
}

function levelUp() {
  level++;
  document.getElementById('level').textContent = level;
  // Reset the map with pellets
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      map[row][col] = originalMap[row][col];
    }
  }
  resetPositions();
  // Increase ghost speed
  ghosts.forEach((ghost) => {
    ghost.speed += 0.5;
  });
}

function drawCherry(x, y) {
    // Draw cherry stems
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + tileSize / 2, y + tileSize / 2);
    ctx.lineTo(x + tileSize / 2, y + tileSize / 4);
    ctx.stroke();
  
    // Draw left cherry
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
      x + tileSize / 2 - tileSize / 6,
      y + tileSize / 2 + tileSize / 6,
      tileSize / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();
  
    // Draw right cherry
    ctx.beginPath();
    ctx.arc(
      x + tileSize / 2 + tileSize / 6,
      y + tileSize / 2 + tileSize / 6,
      tileSize / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  

function gameOver() {
  clearInterval(gameInterval);
  document.getElementById('gameOverScreen').classList.remove('hidden');
  document.getElementById('finalScore').textContent = score;
}

function startGame() {
  document.getElementById('startScreen').classList.add('hidden');
  resetPositions();
  gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
}

// Event listeners for Start and Restart buttons
document.getElementById('startButton').addEventListener('click', () => {
  startGame();
});

document.getElementById('restartButton').addEventListener('click', () => {
  document.getElementById('gameOverScreen').classList.add('hidden');
  score = 0;
  lives = 3;
  level = 1;
  updateScore();
  document.getElementById('lives').textContent = lives;
  document.getElementById('level').textContent = level;
  // Reset the map with pellets
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      map[row][col] = originalMap[row][col];
    }
  }
  startGame();
});

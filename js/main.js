//

function Tile(num, row, col) {
  this.id = this.count++;
  this.num = num;
  this.row = row;
  this.col = col;
}

function createGame() {
  const grid = Array.from({length: 4}, function () {
    const row = new Array(4);
    row.fill(null);
    return row;
  });
  return {
    genTile() {
      let row, col;
      do {
        row = Math.floor(Math.random() * 4);
        col = Math.floor(Math.random() * 4);
      } while (grid[row][col] !== null);
      const tile = new Tile(Math.random() * 10 < 1 ? 4 : 2, row, col);
      grid[row][col] = tile;
      return tile;
    }
  }
}

Tile.prototype.count = 0;

function freeze() {
  return freeze;
}

function createAppearUpdater(duration) {
  const start = Date.now();
  return function updater(attrib) {
    const delta = Math.min(Date.now() - start, duration);
    attrib.size = delta / duration * 100;
    return delta < duration ? updater : freeze;
  }
}

function createStageUpdater() {
  const tileMap = {};

  return {
    applyRendering() {
      for (const value of Object.values(tileMap)) {
        const {element, attributes, updater} = value;
        value.updater = updater(attributes);
        const {size, top, left} = attributes;
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
        element.style.width = element.style.height = element.style.lineHeight = `${size}px`;
        element.style.fontSize = `${size / 2}px`;
        element.style.margin = `${(100 - size) / 2}px`;
      }
    },
    addTile(tile) {
      const tileEl = document.createElement('div');
      tileEl.classList.add('p2-tile');
      tileEl.innerText = tile.num;
      document.querySelector('#p2-stage').appendChild(tileEl);

      tileMap[tile.id] = {
        element: tileEl,
        attributes: {
          size: 0,
          top: tile.row * 110 + 10,
          left: tile.col * 110 + 10,
        },
        updater: createAppearUpdater(100)
      };
    }
  }
}

function start() {
  const game = createGame();
  const updater = createStageUpdater();
  window.addEventListener('click', function () {
    updater.addTile(game.genTile());
  });
  let frameCounter = 0;
  requestAnimationFrame(function renderLoop() {
    updater.applyRendering();
    frameCounter += 1;
    requestAnimationFrame(renderLoop);
  });
  setInterval(function () {
    document.querySelector('#p2-fps').innerText = frameCounter.toString();
    frameCounter = 0;
  }, 1000);
}

start();

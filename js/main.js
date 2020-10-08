//

function Tile(num, row, col) {
  this.id = this.count++;
  this.num = num;
  this.row = row;
  this.col = col;
}

Tile.prototype.count = 0;

function freeze() {
  return freeze;
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

      let count = 0;
      const sizeStep = 100 / 60;

      tileMap[tile.id] = {
        element: tileEl,
        attributes: {
          size: 0,
          top: tile.row * 110 + 10,
          left: tile.col * 110 + 10,
        },
        updater: function updater(attrib) {
          attrib.size += sizeStep;
          return ++count < 60 ? updater : freeze;
        }
      };
    }
  }
}

function start() {
  const updater = createStageUpdater();
  updater.addTile(new Tile(32, 1, 2));
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

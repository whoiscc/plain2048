//

function Tile(num, row, col) {
  this.id = Tile.prototype.count++;
  this.num = num;
  this.row = row;
  this.col = col;
}

function createEmptyGrid() {
  return Array.from({length: 4}, function() {
    const row = new Array(4);
    row.fill(null);
    return row;
  });
}

function createGame() {
  let grid = createEmptyGrid();
  let gridT = createEmptyGrid();

  function genTile() {
    let row, col;
    do {
      row = Math.floor(Math.random() * 4);
      col = Math.floor(Math.random() * 4);
    } while (grid[row][col] !== null);
    const tile = new Tile(Math.random() * 10 < 1 ? 4 : 2, row, col);
    grid[row][col] = gridT[col][row] = tile;
    // console.log(tile);
    return tile;
  }

  return {
    reset() {
      grid = createEmptyGrid();
      gridT = createEmptyGrid();
      const tiles = [genTile(), genTile()];
      // console.log(grid, gridT);
      return function(updater) {
        updater.clear();
        updater.addTile(tiles[0]);
        updater.addTile(tiles[1]);
      };
    },
    isEnd() {
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          if (grid[row][col] === null) {
            return false;
          }
        }
      }
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          if (row < 3 && grid[row][col].num === grid[row + 1][col].num) {
            return false;
          }
          if (col < 3 && grid[row][col].num === grid[row][col + 1].num) {
            return false;
          }
        }
      }
      return true;
    },
    step(heading) {
      function squeeze(line, head, vector, action) {
        for (
          let current = head - vector;
          current * vector >= (4 - head - 1) * vector;
          current -= vector
        ) {
          if (line[current] === null) {
            continue;
          }
          let dst;
          for (dst = current + vector; dst !== head && line[dst] === null;
            dst += vector) {}
          if (line[dst] === null) {
            action.move(current, head);
          } else if (line[dst].num === line[current].num) {
            action.merge(current, dst);
          } else {
            if (dst !== current + vector) {
              action.move(current, dst - vector);
            }
          }
        }
      }

      const horizontal = heading === 'left' || heading === 'right';
      const lines = horizontal ? grid : gridT;
      const [head, vector] = heading === 'left' || heading === 'up'
        ? [0, -1]
        : [3, 1];
      const moveUpdates = [], mergeUpdates = [];
      for (let index = 0; index < 4; index += 1) {
        const line = lines[index];
        squeeze(line, head, vector, {
          move(src, dst) {
            line[dst] = line[src];
            line[src] = null;
            [line[dst].row, line[dst].col] =
              horizontal ? [index, dst] : [dst, index];
            moveUpdates.push(line[dst]);
          },
          merge(src, dst) {
            const anotherTile = line[dst];
            line[dst] = line[src];
            line[src] = null;
            [line[dst].row, line[dst].col] =
              horizontal ? [index, dst] : [dst, index];
            line[dst].num *= 2;
            mergeUpdates.push([line[dst], anotherTile]);
          },
        });
      }
      if (moveUpdates.length > 0 || mergeUpdates.length > 0) {
        for (let row = 0; row < 4; row += 1) {
          for (let col = 0; col < 4; col += 1) {
            if (horizontal) {
              gridT[col][row] = grid[row][col];
            } else {
              grid[row][col] = gridT[col][row];
            }
          }
        }
        const newTile = genTile();
        return function(updater) {
          for (const movedTile of moveUpdates) {
            updater.moveTile(movedTile);
          }
          for (const [mergedTile] of mergeUpdates) {
            updater.moveTile(mergedTile);
          }
          for (const [keptTile, disposedTile] of mergeUpdates) {
            updater.mergeTiles(keptTile, disposedTile);
          }
          updater.addTile(newTile);
        };
      } else {
        return function() {};
      }
    },
  };
}

Tile.prototype.count = 0;

function freeze() {
  return freeze;
}

function createAppearRenderer(duration) {
  const start = Date.now();
  return function renderer(attrib) {
    const delta = Math.min(Date.now() - start, duration);
    attrib.size = delta / duration * 100;
    return delta < duration ? renderer : freeze;
  };
}

function createMoveRenderer(duration, startTop, endTop, startLeft, endLeft) {
  const start = Date.now();
  const topStep = (endTop - startTop) / duration,
    leftStep = (endLeft - startLeft) / duration;
  return function renderer(attrib) {
    const delta = Math.min(Date.now() - start, duration);
    attrib.left = startLeft + leftStep * delta;
    attrib.top = startTop + topStep * delta;
    return delta < duration ? renderer : freeze;
  };
}

function createMergeRenderer(duration, maxSize) {
  const start = Date.now();
  return function renderer(attrib) {
    const delta = Math.min(Date.now() - start, duration);
    attrib.size = maxSize -
      (maxSize - 100) / (duration / 2) * Math.abs(delta - duration / 2);
    // console.log(attrib.size);
    return delta < duration ? renderer : freeze;
  };
}

function connectRenderers(firstRenderer, onSwitch) {
  let nextRenderer = firstRenderer;
  return function renderer(attrib) {
    nextRenderer = nextRenderer(attrib);
    if (nextRenderer !== freeze) {
      return renderer;
    }
    return onSwitch();
  };
}

function createStageUpdater() {
  let tileMap = {};

  return {
    applyRendering() {
      // console.log(tileMap);
      for (const value of Object.values(tileMap)) {
        const {element, attributes, renderer} = value;
        // console.log(renderer);
        value.renderer = renderer(attributes);
        const {size, top, left} = attributes;
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
        element.style.width = element.style.height = element.style.lineHeight = `${size}px`;
        element.style.fontSize = `${size / 2}px`;
        element.style.margin = `${(100 - size) / 2}px`;
      }
    },
    clear() {
      for (const {element} of Object.values(tileMap)) {
        element.remove();
      }
      tileMap = {};
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
        renderer: createAppearRenderer(100),
      };
    },
    moveTile(tile) {
      const {top: startTop, left: startLeft} = tileMap[tile.id].attributes;
      const endTop = tile.row * 110 + 10, endLeft = tile.col * 110 + 10;
      tileMap[tile.id].attributes.top = endTop;
      tileMap[tile.id].attributes.left = endLeft;
      // console.log(startTop, endTop, startLeft, endLeft);
      tileMap[tile.id].renderer = createMoveRenderer(
        100, startTop, endTop, startLeft, endLeft);
    },
    mergeTiles(keptTile, disposedTile) {
      // console.log(keptTile, disposedTile);
      tileMap[keptTile.id].renderer = connectRenderers(
        tileMap[keptTile.id].renderer,
        function() {
          tileMap[disposedTile.id].element.remove();
          tileMap[keptTile.id].element.innerText = keptTile.num.toString();
          return createMergeRenderer(100, 110);
        },
      );
    },
  };
}

function start() {
  const game = createGame();
  const updater = createStageUpdater();

  function onKeypress(event) {
    switch (event.key.toLowerCase()) {
      case 'w': {
        game.step('up')(updater);
        break;
      }
      case 'a': {
        game.step('left')(updater);
        break;
      }
      case 's': {
        game.step('down')(updater);
        break;
      }
      case 'd': {
        game.step('right')(updater);
        break;
      }
    }
    if (game.isEnd()) {
      window.removeEventListener('keypress', onKeypress);
      document.querySelector('#p2-game-over').hidden = false;
    }
  }

  game.reset()(updater);
  window.addEventListener('keypress', onKeypress);
  document.querySelector('#p2-reset').addEventListener('click', function() {
    game.reset()(updater);
    window.addEventListener('keypress', onKeypress);
    document.querySelector('#p2-game-over').hidden = true ;
  });

  let frameCounter = 0;
  requestAnimationFrame(function renderLoop() {
    updater.applyRendering();
    frameCounter += 1;
    requestAnimationFrame(renderLoop);
  });
  setInterval(function() {
    document.querySelector('#p2-fps').innerText = frameCounter.toString();
    frameCounter = 0;
  }, 1000);
}

start();

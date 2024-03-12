const shipDatas = [
  { size: 4, direction: "row", startX: -250, startY: 2 },
  { size: 3, direction: "row", startX: -250, startY: 45 },
  { size: 3, direction: "row", startX: -140, startY: 45 },
  { size: 2, direction: "row", startX: -250, startY: 88 },
  { size: 2, direction: "row", startX: -175, startY: 88 },
  { size: 2, direction: "row", startX: -100, startY: 88 },
  { size: 1, direction: "row", startX: -250, startY: 131 },
  { size: 1, direction: "row", startX: -208, startY: 131 },
  { size: 1, direction: "row", startX: -168, startY: 131 },
  { size: 1, direction: "row", startX: -126, startY: 131 },
];

class PreparationScene extends Scene {
  draggedShip = null;
  draggedOffsetX = 0;
  draggedOffestY = 0;

  removeEventListeners = [];

  init() {
    this.manually();
  }

  start() {
    const { player, opponent } = this.app;

    opponent.clear();
    player.removeAllShots();
    player.ships.forEach((ship) => (ship.killed = false));

    this.removeEventListeners = [];

    document
      .querySelectorAll("app-actions")
      .forEach((element) => element.classList.add("hidden"));

    document
      .querySelector("[data-scene='preparation']")
      .classList.remove("hidden");

    const manuallyButton = document.querySelector("[data-action='manually']");
    const randomizeButton = document.querySelector("[data-action='randomize']");

    const middleButton = document.querySelector("[data-computer='middle']");

    this.removeEventListeners.push(
      addEventListener(manuallyButton, "click", () => this.manually())
    );
    this.removeEventListeners.push(
      addEventListener(randomizeButton, "click", () => this.randomize())
    );

    this.removeEventListeners.push(
      addEventListener(middleButton, "click", () =>
        this.startComputer("middle")
      )
    );
  }

  stop() {
    for (const removeEventListener of this.removeEventListeners) {
      removeEventListener();
    }

    this.removeEventListeners = [];
  }

  update() {
    const { mouse, player } = this.app;

    // Potentially we want to start pulling the ship
    if (!this.draggedShip && mouse.left && !mouse.pLeft) {
      const ship = player.ships.find((ship) => ship.isUnder(mouse));

      if (ship) {
        const shipRect = ship.div.getBoundingClientRect();

        this.draggedShip = ship;
        this.draggedOffsetX = mouse.x - shipRect.left;
        this.draggedOffsetY = mouse.y - shipRect.top;

        ship.x = null;
        ship.y = null;
      }
    }

    // Pulling the ship
    if (mouse.left && this.draggedShip) {
      const { left, top } = player.root.getBoundingClientRect();
      const x = mouse.x - left - this.draggedOffsetX;
      const y = mouse.y - top - this.draggedOffsetY;

      this.draggedShip.div.style.left = `${x}px`;
      this.draggedShip.div.style.top = `${y}px`;
    }

    // Drop ship
    if (!mouse.left && this.draggedShip) {
      const ship = this.draggedShip;
      this.draggedShip = null;

      const { left, top } = ship.div.getBoundingClientRect();
      const { width, height } = player.cells[0][0].getBoundingClientRect();

      const point = {
        x: left + width / 2,
        y: top + height / 2,
      };

      const cell = player.cells
        .flat()
        .find((cell) => isUnderPoint(point, cell));

      if (cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        player.removeShip(ship);
        player.addShip(ship, x, y);
      } else {
        player.removeShip(ship);
        player.addShip(ship);
      }
    }

    // Rotate
    if (this.draggedShip && mouse.delta) {
      this.draggedShip.toggleDirection();
    }

    if (player.complete) {
      document.querySelector("[data-computer='middle']").disabled = false;
    } else {
      document.querySelector('[data-computer="middle"]').disabled = true;
    }
  }

  randomize() {
    const { player } = this.app;

    player.randomize(ShipView);

    for (let i = 0; i < 10; i++) {
      const ship = player.ships[i];
      ship.startX = shipDatas[i].startX;
      ship.startY = shipDatas[i].startY;
    }
  }

  manually() {
    const { player } = this.app;

    player.removeAllShips();

    for (const { size, direction, startX, startY } of shipDatas) {
      const ship = new ShipView(size, direction, startX, startY);
      player.addShip(ship);
    }
  }

  startComputer(level) {
    const matrix = this.app.player.matrix;
    const withoutShipItems = matrix.flat().filter((item) => !item.ship);
    let untouchables = [];

    if (level === "middle") {
      untouchables = getRandomSeveral(withoutShipItems, 40);
    }

    this.app.start("computer", untouchables);
  }
}

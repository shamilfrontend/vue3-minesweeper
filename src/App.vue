<template>
  <main :style="cssVars">
    <div class="status">
      <div>{{ bombsRemaining | addLeadingZeros }}</div>
      <button @click="resetGame">{{ gameStatus }}</button>
      <div>{{ secondsPassed | addLeadingZeros }}</div>
    </div>

    <div class="board">
      <div
        v-for="(tile, i) in tiles"
        :key="i"
        class="tile"
        :class="{
                revealed: tile.revealed,
                'wrong-pick': gameFailed &amp;&amp; ((tile.bomb &amp;&amp; tile.revealed) || (!tile.bomb &amp;&amp; tile.flagged))
              }"
        :data-surrounding-bombs="tile.surroundingBombs"
        @click="reveal(i)"
        @contextmenu.prevent="flag(i)"
      >
        <template v-if="tile.flagged">🔴</template>
        <template v-else-if="tile.revealed &amp;&amp; tile.bomb">💣</template>
        <template v-else-if="tile.revealed &amp;&amp; tile.surroundingBombs">{{ tile.surroundingBombs }}</template>
      </div>
    </div>
  </main>
</template>

<script>
const getIndex = (row, column, config) => {
  if (row < 0) return;
  if (column < 0) return;
  if (row >= config.height) return;
  if (column >= config.width) return;

  return row * config.width + column;
};

const getTileCoordinates = (index, config) => ({
  row: Math.floor(index / config.width),
  column: index % config.width
});

const generateTiles = (config) => {
  const bombs = Array.from({ length: config.width * config.height });

  let bombsPlanted = 0;

  while (bombsPlanted !== config.totalNumberOfBombs) {
    const index = Math.floor(Math.random() * config.width * config.height);

    if (!bombs[index]) {
      bombs[index] = true;
      bombsPlanted++;
    }
  }

  return bombs.map((bomb, i, array) => {
    const { row, column } = getTileCoordinates(i, config);

    let surroundingBombs = 0;
    if (array[getIndex(row - 1, column - 1, config)]) surroundingBombs++;
    if (array[getIndex(row - 1, column - 0, config)]) surroundingBombs++;
    if (array[getIndex(row - 1, column + 1, config)]) surroundingBombs++;
    if (array[getIndex(row - 0, column - 1, config)]) surroundingBombs++;
    if (array[getIndex(row - 0, column + 1, config)]) surroundingBombs++;
    if (array[getIndex(row + 1, column - 1, config)]) surroundingBombs++;
    if (array[getIndex(row + 1, column - 0, config)]) surroundingBombs++;
    if (array[getIndex(row + 1, column + 1, config)]) surroundingBombs++;

    return {
      bomb,
      flagged: false,
      revealed: false,
      surroundingBombs
    };
  });
};

export default {
  data() {
    return {
      config: {},
      tiles: [],
      secondsPassed: 0,
      timerIntervalID: undefined
    }
  },

  created() {
    this.setBeginnerDifficulty();
  },

  computed: {
    cssVars() {
      return {
        "--width": this.config.width,
        "--height": this.config.height,
        "--size": `${this.config.size}px`
      };
    },

    bombsRemaining() {
      const numberOfFlaggedTiles = this.tiles.filter((t) => t.flagged).length;
      return this.config.totalNumberOfBombs - numberOfFlaggedTiles;
    },

    gameIsProgress() {
      if (this.gameStatus === "😞" || this.gameStatus === "😎") return false;
      if (!this.tiles.find((tile) => tile.revealed)) return false;
      return true;
    },

    gameWon() {
      const numberOfRevealedTiles = this.tiles.filter((t) => t.revealed).length;

      const numberOfTilesThatNeedsToBeRevealed = this.config.width * this.config.height - this.config.totalNumberOfBombs;

      return numberOfRevealedTiles === numberOfTilesThatNeedsToBeRevealed;
    },

    gameFailed() {
      return this.tiles.find((tile) => tile.bomb && tile.revealed);
    },

    gameStatus() {
      if (this.gameFailed) return "😞";
      if (this.gameWon) return "😎";
      return "🙂";
    }
  },

  watch: {
    gameIsProgress(value) {
      if (value) {
        this.timerIntervalID = setInterval(() => {
          this.secondsPassed++;
        }, 1000);
      } else {
        clearInterval(this.timerIntervalID);
      }
    }
  },

  methods: {
    setBeginnerDifficulty() {
      this.config = {
        width: 8,
        height: 8,
        totalNumberOfBombs: 10,
        size: 44
      };

      this.resetGame();
    },

    resetGame() {
      this.tiles = generateTiles(this.config);

      this.secondsPassed = 0;
    },

    reveal(i) {
      if (this.gameFailed) return;

      if (i === undefined) return;

      const tile = this.tiles[i];

      if (tile.flagged) return;

      if (!tile.revealed) {
        tile.revealed = true;

        if (!tile.bomb && tile.surroundingBombs === 0) {
          const { row, column } = getTileCoordinates(i, this.config);

          this.reveal(getIndex(row - 1, column - 1, this.config)); // Reveal top left neighbour
          this.reveal(getIndex(row - 1, column - 0, this.config)); // Reveal top neighbour
          this.reveal(getIndex(row - 1, column + 1, this.config)); // Reveal top right neighbour
          this.reveal(getIndex(row - 0, column - 1, this.config)); // Reveal left neighbour
          this.reveal(getIndex(row - 0, column + 1, this.config)); // Reveal right neighbour
          this.reveal(getIndex(row + 1, column - 1, this.config)); // Reveal bottom left neighbour
          this.reveal(getIndex(row + 1, column - 0, this.config)); // Reveal bottom neighbour
          this.reveal(getIndex(row + 1, column + 1, this.config)); // Reveal bottom right neighbour
        }
      }
    },

    flag(i) {
      if (this.gameFailed) return;

      if (this.tiles[i].revealed) return;

      this.tiles[i].flagged = !this.tiles[i].flagged;
    }
  },

  filters: {
    addLeadingZeros: function (value) {
      return ("00" + value).slice(-3);
    }
  }
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Roboto&family=Ubuntu:wght@700&display=swap");

$tile-color: #d4d4d4;
$border-radius: calc(var(--size) / 10);

@mixin add-shadow($offset) {
  $opposite: calc(#{$offset} * -1);
  box-shadow: inset $offset $offset 0px 0px rgba(255, 255, 255, 0.45),
  inset $opposite $opposite 0px 0px rgba(0, 0, 0, 0.25);
}

* {
  box-sizing: border-box;
  user-select: none;
}

body {
  margin: 0;
  min-height: 90vh;
  font-family: "Roboto", sans-serif;
  text-align: center;
  background-color: $tile-color;
}

button {
  background-color: inherit;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;

  &:focus {
    outline: none;
  }
}

a:visited {
  color: inherit;
}

main {
  min-height: 100vh;
  padding: 5px 8px;
  border-radius: $border-radius;
  font-family: "Ubuntu Mono", monospace;
  font-weight: 700;
}

.status {
  max-width: 414px;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
  color: #0b2027;
  display: flex;
  flex-direction: row;
  font-size: 2em;
  justify-content: space-between;
  padding: 15px 0;

  div {
    min-width: 125px;

    &:first-child {
      text-align: left;
    }

    &:last-child {
      text-align: right;
    }
  }

  button {
    @include add-shadow(4px);
    width: 44px;
    border-radius: 5px;
  }
}

.board {
  display: grid;
  grid-template-columns: repeat(var(--width), auto);
  grid-template-rows: repeat(var(--height), auto);
  align-items: center;
  justify-content: center;
}

.tile {
  width: var(--size);
  height: var(--size);
  line-height: var(--size);

  &:not(.revealed) {
    $shadow: calc(var(--size) / 12.5);
    @include add-shadow($shadow);
    border-radius: $border-radius;
    cursor: pointer;
  }

  &.revealed {
    border: 1px solid #bdbdbd;
    box-sizing: border-box;
  }

  &.wrong-pick {
    background-color: lightcoral;
  }

  &[data-surrounding-bombs="1"] {
    color: blue;
  }
  &[data-surrounding-bombs="2"] {
    color: green;
  }
  &[data-surrounding-bombs="3"] {
    color: red;
  }
  &[data-surrounding-bombs="4"] {
    color: purple;
  }
  &[data-surrounding-bombs="5"] {
    color: maroon;
  }
  &[data-surrounding-bombs="6"] {
    color: turquoise;
  }
  &[data-surrounding-bombs="7"] {
    color: black;
  }
  &[data-surrounding-bombs="8"] {
    color: gray;
  }
}
</style>

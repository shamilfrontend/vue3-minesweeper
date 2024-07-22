<template>
  <div class="v-container">
    <header>
      <button
        type="button"
        @click="setBeginnerDifficulty"
      >
        Beginner
      </button>
      <button
        type="button"
        @click="setIntermediateDifficulty"
      >
        Intermediate
      </button>
      <button
        type="button"
        @click="setExpertDifficulty"
      >
        Expert
      </button>
    </header>

    <div class="h-container">
      <div class="v-container">
        <main :style="cssVars">
          <div class="status">
            <div>{{ bombsRemaining | addLeadingZeros }}</div>
            <button @click="resetGame">{{ gameStatus }}</button>
            <div>{{ secondsPassed | addLeadingZeros }}</div>
          </div>

          <div class="board">
            <div class="tile" v-for="(tile, i) in tiles" :key="i" :class="{
              revealed: tile.revealed,
              'wrong-pick': gameFailed &amp;&amp; ((tile.bomb &amp;&amp; tile.revealed) || (!tile.bomb &amp;&amp; tile.flagged))
            }" :data-surrounding-bombs="tile.surroundingBombs" @click="reveal(i)" @contextmenu.prevent="flag(i)">
              <template v-if="tile.flagged">🔴</template>
              <template v-else-if="tile.revealed &amp;&amp; tile.bomb">💣</template>
              <template v-else-if="tile.revealed &amp;&amp; tile.surroundingBombs">{{ tile.surroundingBombs }}</template>
            </div>
          </div>
        </main>

        <footer>
          <a href="https://twitter.com/HunorBorbely" target="_top">@HunorBorbely</a>
        </footer>
      </div>
    </div>
  </div>
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
        size: 50
      };

      this.resetGame();
    },

    setIntermediateDifficulty() {
      this.config = {
        width: 16,
        height: 16,
        totalNumberOfBombs: 40,
        size: 35
      };

      this.resetGame();
    },

    setExpertDifficulty() {
      this.config = {
        width: 30,
        height: 16,
        totalNumberOfBombs: 99,
        size: 25
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
@import "./assets/styles/base";
@import url("https://fonts.googleapis.com/css2?family=Roboto&family=Ubuntu:wght@700&display=swap");

$background-color: #006989;
$tile-color: #d4d4d4;
$border-radius: calc(var(--size) / 10);

html {
  height: 100%;
}

body {
  background-color: $background-color;
  font-family: "Roboto", sans-serif;
  height: 100%;
  margin: 0;
  text-align: center;
}

.h-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  height: 100%;
}

.v-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
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

header {
  background-color: #0b2027;

  button {
    color: $tile-color;
    padding: 20px 30px;
  }
}

@mixin add-shadow($offset) {
  $opposite: calc(#{$offset} * -1);
  box-shadow: inset $offset $offset 0px 0px rgba(255, 255, 255, 0.45),
  inset $opposite $opposite 0px 0px rgba(0, 0, 0, 0.25);
}

main {
  background-color: $tile-color;
  border-radius: $border-radius;
  font-family: "Ubuntu Mono", monospace;
  font-weight: 700;
  padding: 0 20px 20px 20px;
}

.status {
  align-items: center;
  color: #0b2027;
  display: flex;
  flex-direction: row;
  font-size: 2em;
  justify-content: space-between;
  margin: 15px 0;

  button {
    @include add-shadow(4px);
    border-radius: 5px;
  }
}

.board {
  display: grid;
  grid-template-columns: repeat(var(--width), auto);
  grid-template-rows: repeat(var(--height), auto);
  user-select: none;
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

footer {
  font-size: 0.8em;
  color: $tile-color;
  margin: 20px;
}
</style>

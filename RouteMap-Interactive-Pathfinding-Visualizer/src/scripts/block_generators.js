// Recursive function to divide the grid
function divide(grid, startX, startY, width, height, horizontal) {
  if (width < 3 || height < 3) return;

  if (horizontal) {
    const centerRow = Math.floor(startY + height / 2);
    const randomCol = Math.floor(startX + Math.random() * width);

    for (let col = startX; col < startX + width; col++) {
      if (col !== randomCol) {
        grid.setBlock(centerRow, col);
      } else {
        grid.setClear(centerRow, col);
      }
    }

    divide(grid, startX, startY, width, centerRow - startY, false);
    divide(grid, startX, centerRow + 1, width, startY + height - centerRow - 1, false);
  } else {
    const centerCol = Math.floor(startX + width / 2);
    const randomRow = Math.floor(startY + Math.random() * height);

    for (let row = startY; row < startY + height; row++) {
      if (row !== randomRow) {
        grid.setBlock(row, centerCol);
      } else {
        grid.setClear(row, centerCol);
      }
    }

    divide(grid, startX, startY, centerCol - startX, height, true);
    divide(grid, centerCol + 1, startY, startX + width - centerCol - 1, height, true);
  }
}

// Function to generate a random grid with random blocks
function randomGrid() {
  const grid = states.Context.ActiveGrid;
  grid.clearGrid();

  const cols = grid.graph.columnCount - 1;
  const rows = grid.graph.rowCount - 1;

  for (let i = 0; i < Math.max(rows, cols) * 6; i++) {
    setTimeout(() => {
      const randomCol = Math.floor(Math.random() * cols);
      const randomRow = Math.floor(Math.random() * rows);
      grid.setBlock(randomRow, randomCol);
    }, i * 16);
  }
}
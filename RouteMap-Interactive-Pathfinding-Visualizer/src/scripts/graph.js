// Utility function to generate unique identifiers
function uuidv4() {
   //Implementation of UUID v4 generation
  // Example: return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //   const r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
  //   return v.toString(16);
  // });
}

// Class representing a node in the graph
class GraphNode {
  constructor(value, id = uuidv4()) {
    this.id = id;
    this.value = value;
    this.adjacents = new Set();
  }

  joinAdjacentNode(node) {
    if (node) this.adjacents.add(node);
  }

  removeAdjacentNode(node) {
    this.adjacents.delete(node);
  }

  setAdjacents(...nodes) {
    this.adjacents = new Set(nodes.filter(Boolean));
  }

  removeAdjacents() {
    this.adjacents.clear();
  }
}

// Class representing a graph as a matrix of nodes
class GraphMatrix {
  constructor(rowCount, columnCount, nodeCls) {
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    this.nodeCls = nodeCls;
    this.nodes = [];
    this.processed = false;
  }

  generateNodes() {
    this.nodes = Array.from({ length: this.rowCount }, (_, r) => 
      Array.from({ length: this.columnCount }, (_, c) => 
        new this.nodeCls([r, c])
      )
    );
  }

  joinAdjacent(r, c) {
    const node = this.nodes[r][c];
    const neighbors = [
      r > 0 ? this.nodes[r - 1][c] : null,
      c > 0 ? this.nodes[r][c - 1] : null,
      r < this.rowCount - 1 ? this.nodes[r + 1][c] : null,
      c < this.columnCount - 1 ? this.nodes[r][c + 1] : null,
    ];

    node.setAdjacents(...neighbors);
    node.adjacents.forEach(adjNode => adjNode.joinAdjacentNode(node));
  }

  removeAdjacent(r, c) {
    const node = this.nodes[r][c];
    node.adjacents.forEach(adjNode => adjNode.removeAdjacentNode(node));
    node.removeAdjacents();
  }

  generateMatrix() {
    for (let r = 0; r < this.rowCount; r++) {
      for (let c = 0; c < this.columnCount; c++) {
        this.joinAdjacent(r, c);
      }
    }
  }

  process() {
    this.generateNodes();
    this.generateMatrix();
    this.processed = true;
  }

  get nodeCount() {
    return this.rowCount * this.columnCount;
  }

  get isProcessed() {
    return this.processed;
  }
}
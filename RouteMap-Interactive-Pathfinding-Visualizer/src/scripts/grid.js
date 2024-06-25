class Box extends GraphNode {
  constructor(value, id) {
    super(value, id);
    this.pointTL = null;
    this.pointBR = null;
    this.nodeType = states.BOX_TYPES.CLEAR;
    this.path = null;
    this.centerText = null;
  }

  changeText(text) {
    this.centerText.content = `${text}`;
  }

  resetText() {
    this.centerText.content = "";
  }

  setAsStart() {
    this.nodeType = states.BOX_TYPES.START_NODE;
    this.path.fillColor = {
      gradient: { stops: states.COLORS.BOX_TYPE_START_NODE_COLORS },
      origin: this.path.bounds.topLeft,
      destination: this.path.bounds.bottomRight
    };
  }

  removeAsStart() {
    if (this.nodeType === states.BOX_TYPES.START_NODE) {
      this.setAsClear();
    }
  }

  setAsEnd() {
    this.nodeType = states.BOX_TYPES.END_NODE;
    this.path.fillColor = {
      gradient: { stops: states.COLORS.BOX_TYPE_END_NODE_COLORS },
      origin: this.path.bounds.topLeft,
      destination: this.path.bounds.rightCenter
    };
  }

  removeAsEnd() {
    if (this.nodeType === states.BOX_TYPES.END_NODE) {
      this.setAsClear();
    }
  }

  setAsClear() {
    this.nodeType = states.BOX_TYPES.CLEAR;
    this.path.fillColor = states.COLORS.BOX_TYPE_CLEAR_COLOR;
    this.resetText();
  }

  setAsBlock() {
    this.nodeType = states.BOX_TYPES.BLOCK;
    this.path.tween(
      { fillColor: states.COLORS.BOX_TYPE_BLOCK_COLORS[0] },
      { fillColor: states.COLORS.BOX_TYPE_BLOCK_COLORS[1] },
      300
    );
  }

  setAsTraversed() {
    if (this.nodeType === states.BOX_TYPES.BLOCK) {
      this.nodeType = states.BOX_TYPES.ERROR_NODE;
      this.path.fillColor = states.COLORS.BOX_TYPE_ERROR_NODE_COLOR;
    } else {
      this.nodeType = states.BOX_TYPES.TRAVERSED_NODE;
      this.path.tween(
        { fillColor: states.COLORS.BOX_TYPE_TRAVERSED_NODE_COLORS[0] },
        { fillColor: states.COLORS.BOX_TYPE_TRAVERSED_NODE_COLORS[1] },
        200
      );
    }
  }

  setAsPath() {
    if (this.nodeType === states.BOX_TYPES.TRAVERSED_NODE) {
      this.nodeType = states.BOX_TYPES.PATH_NODE;
      this.path.tween(
        { fillColor: states.COLORS.BOX_TYPE_PATH_NODE_COLORS[0] },
        { fillColor: states.COLORS.BOX_TYPE_PATH_NODE_COLORS[1] },
        200
      );
    }
  }

  resetTraversed() {
    if ([states.BOX_TYPES.TRAVERSED_NODE, states.BOX_TYPES.PATH_NODE].includes(this.nodeType)) {
      this.setAsClear();
    }
  }

  setPoints(pointTL, pointBR) {
    this.pointTL = pointTL;
    this.pointBR = pointBR;
  }

  draw() {
    this.path = new paper.Path.Rectangle({
      from: this.pointTL,
      to: this.pointBR,
      strokeColor: states.COLORS.BOX_BORDER_COLOR,
      strokeWidth: 0.3,
      fillColor: states.COLORS.BOX_TYPE_CLEAR_COLOR
    });
    this.centerText = new paper.PointText({
      point: this.path.bounds.center,
      fillColor: "black",
      justification: "center"
    });
    this.path.addChild(this.centerText);
  }
}

class Grid {
  constructor(width, height, graph, boxSize) {
    this.width = width;
    this.height = height;
    this.graph = graph;
    this.boxSize = boxSize;
    this.dragEnabled = false;
    this.runner = null;
    this.startNode = null;
    this.endNode = null;
    this.actionMode = states.TOOL_MODE.WALL_NODES;
    this.wallA = null;
    this.wallB = null;
    this.runnerSpeed = states.RunnerSpeeds.Fast;
    this.onStartEndSet = () => {};
    this.onRunnerStop = () => {};
    this.onRunnerStart = () => {};
  }

  getBoxSideLength() {
    const area = this.width * this.height;
    const singleBoxArea = area / this.graph.nodeCount;
    return Math.sqrt(singleBoxArea);
  }

  performAction(r, c) {
    const box = this.boxes[r][c];
    if (!this.runner.running) {
      switch (this.actionMode) {
        case states.TOOL_MODE.START_NODE:
          if (box !== this.endNode) {
            this.startNode = box;
            this.setStart();
          }
          break;
        case states.TOOL_MODE.TARGET_NODE:
          if (box !== this.startNode) {
            this.endNode = box;
            this.setEnd();
          }
          break;
        case states.TOOL_MODE.WALL_NODES:
          if (![this.startNode, this.endNode].includes(box) &&
              ![states.BOX_TYPES.TRAVERSED_NODE, states.BOX_TYPES.PATH_NODE].includes(box.nodeType)) {
            box.nodeType === states.BOX_TYPES.BLOCK ? this.setClear(r, c) : this.setBlock(r, c);
          }
          break;
      }
    }
  }

  addEvents(box, r, c) {
    box.path.onMouseEnter = () => {
      if (this.dragEnabled) {
        this.performAction(r, c);
      }
    };
    box.path.onMouseDown = (event) => {
      event.preventDefault();
      this.dragEnabled = true;
      this.performAction(r, c);
    };
    box.path.onMouseUp = () => {
      this.dragEnabled = false;
    };
  }

  setBlock(r, c) {
    this.graph.removeAdjacent(r, c);
    this.boxes[r][c].setAsBlock();
  }

  setClear(r, c) {
    this.graph.joinAdjacent(r, c);
    this.boxes[r][c].setAsClear();
  }

  setStart() {
    this.boxes.flat().forEach(box => box.removeAsStart());
    if (this.wallA) {
      this.setBlock(...this.wallA.value);
      this.wallA = null;
    }
    if (this.startNode.nodeType === states.BOX_TYPES.BLOCK) {
      this.wallA = this.startNode;
      this.setClear(...this.startNode.value);
    }
    this.startNode.setAsStart();
    this.onStartEndSet();
    this.setRunnerNodes();
  }

  fixGrid() {
    this.boxes.flat().forEach((box, idx) => {
      if ([states.BOX_TYPES.BLOCK, states.BOX_TYPES.ERROR_NODE].includes(box.nodeType)) {
        this.setBlock(Math.floor(idx / this.graph.columnCount), idx % this.graph.columnCount);
      }
    });
  }

  resetTraversal() {
    this.boxes.flat().forEach(box => box.resetTraversed());
    this.wallA = null;
    this.wallB = null;
  }

  setEnd() {
    this.boxes.flat().forEach(box => box.removeAsEnd());
    if (this.wallB) {
      this.setBlock(...this.wallB.value);
      this.wallB = null;
    }
    if (this.endNode.nodeType === states.BOX_TYPES.BLOCK) {
      this.wallB = this.endNode;
      this.setClear(...this.endNode.value);
    }
    this.endNode.setAsEnd();
    this.onStartEndSet();
    this.setRunnerNodes();
  }

  clearGrid() {
    this.startNode = null;
    this.endNode = null;
    this.wallA = null;
    this.wallB = null;
    this.onStartEndSet();
    this.runner?.stop();
    setTimeout(() => {
      this.boxes.flat().forEach((_, idx) => this.setClear(Math.floor(idx / this.graph.columnCount), idx % this.graph.columnCount));
    }, 300);
  }

  paintGrid() {
    const sideLength = this.boxSize || this.getBoxSideLength();
    this.graph.nodes.flat().forEach((node, idx) => {
      const r = Math.floor(idx / this.graph.columnCount);
      const c = idx % this.graph.columnCount;
      const x1 = sideLength * c;
      const y1 = sideLength * r;
      const x2 = x1 + sideLength;
      const y2 = y1 + sideLength;

      node.setPoints(new Point(x1, y1), new Point(x2, y2));
      node.draw();
      this.addEvents(node, r, c);
    });

    this.setRunner(states.DEFAULT_RUNNER_CODE);
  }

  setRunnerNodes() {
    this.runner.setNode(this.startNode, this.endNode);
  }

  setRunner(runnerCode, extra) {
    this.runner = new states.Runners[runnerCode](extra);
    this.setRunnerSpeed(this.runnerSpeed);
  }

  setRunnerSpeed(speed) {
    this.runnerSpeed = speed;
    this.runner.speed = speed;
  }

  visualize() {
    this.setRunnerNodes();
    this.resetTraversal();
    this.fixGrid();
    this.runner.onStart = this.onRunnerStart;
    this.runner.onStop = this.onRunnerStop;
    this.runner.init();
  }

  getBox(r, c) {
    return this.boxes[r][c];
  }

  get boxes() {
    return this.graph.nodes;
  }

  get boxArea() {
    return this.boxes[0][0].path.area;
  }
}

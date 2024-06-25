// Function to set up and process the grid
function processGrid(rowCount, columnCount, width, height, boxSize) {
  project.clear();
  
  const graph = new GraphMatrix(rowCount, columnCount, Box);
  graph.process();

  const activeGrid = new Grid(width, height, graph, boxSize);
  states.Context.ActiveGrid = activeGrid;

  activeGrid.paintGrid();
  setupGridCallbacks();
  updateAlgoNameDisplay();
}

// Function to set up callbacks for the grid
function setupGridCallbacks() {
  const activeGrid = states.Context.ActiveGrid;

  activeGrid.onStartEndSet = function() {
    const actionPanel = states.actionPanel;
    actionPanel.toggleClass("d-none", !activeGrid.startNode || !activeGrid.endNode);
  };

  activeGrid.onRunnerStop = function() {
    const runner = activeGrid.runner;
    states.startStopBtn.text("Visualize").prop("disabled", false);
    states.resetGraphBtn.prop("disabled", false);
    states.clearGraphBtn.prop("disabled", false);
    states.runnerDuration.text(`${runner.duration} ms`);
    states.nextStepBtn.hide();
  };
}

// Function to reset the grid
function resetGrid() {
  const activeGrid = states.Context.ActiveGrid;
  activeGrid.resetTraversal();

  if (activeGrid.startNode) activeGrid.startNode.resetText();
  if (activeGrid.endNode) activeGrid.endNode.resetText();
}

// Function to initialize the setup
function init() {
  const boxSize = states.DEFAULT_BOX_SIZE;
  let [rowCount, columnCount] = getRowColumnCount(boxSize);

  setInitialValues(rowCount, columnCount, boxSize);
  setupEventListeners();
  processGrid(rowCount, columnCount, states.width, states.height, boxSize);
}

// Function to set initial input values
function setInitialValues(rowCount, columnCount, boxSize) {
  states.rowCountInput.val(rowCount);
  states.columnCountInput.val(columnCount);
  states.boxSizeInput.val(boxSize);

  states.resetGraphBtn.prop("disabled", true);
  states.nextStepBtn.hide();

  states.admissibleValue.val(states.Context.AdmissibleValue);
  states.admissibleValueDisplay.text(states.Context.AdmissibleValue);
}

// Function to set up event listeners
function setupEventListeners() {
  states.rowCountInput.change(updateRowCount);
  states.columnCountInput.change(updateColumnCount);
  states.boxSizeInput.change(updateBoxSize);
  states.toolModeInput.change(updateToolMode);
  states.clearGraphBtn.click(clearGrid);
  states.resetGraphBtn.click(resetGrid);
  states.startStopBtn.click(startStopVisualization);
  states.algoSelection.click(selectAlgorithm);
  states.speedSelection.click(selectSpeed);
  states.nextStepBtn.click(nextStep);
  states.admissibleValue.change(updateAdmissibleValue);
}

// Event handler functions
function updateRowCount() {
  const rowCount = parseInt($(this).val()) || Math.trunc(states.height / states.DEFAULT_BOX_SIZE);
  processGrid(rowCount, states.columnCountInput.val(), states.width, states.height, states.boxSizeInput.val());
}

function updateColumnCount() {
  const columnCount = parseInt($(this).val()) || Math.trunc(states.width / states.DEFAULT_BOX_SIZE);
  processGrid(states.rowCountInput.val(), columnCount, states.width, states.height, states.boxSizeInput.val());
}

function updateBoxSize() {
  const boxSize = parseInt($(this).val());
  const [rowCount, columnCount] = getRowColumnCount(boxSize);
  processGrid(rowCount, columnCount, states.width, states.height, boxSize);
}

function updateToolMode() {
  states.Context.ActiveGrid.actionMode = states.TOOL_MODE[this.value];
}

function clearGrid() {
  states.Context.ActiveGrid.clearGrid();
  states.startStopBtn.text("Visualize").prop("disabled", false);
  states.resetGraphBtn.prop("disabled", true);
}

function startStopVisualization() {
  const activeGrid = states.Context.ActiveGrid;
  if (activeGrid.runner.speed === states.RunnerSpeeds.Step) {
    states.nextStepBtn.show();
  } else {
    states.nextStepBtn.hide();
  }

  activeGrid.visualize();
  states.startStopBtn.text("Running..").prop("disabled", true);
  states.runnerDuration.text("...");
  states.resetGraphBtn.prop("disabled", true);
  states.clearGraphBtn.prop("disabled", true);
}

function selectAlgorithm(event) {
  const activeGrid = states.Context.ActiveGrid;

  if (!activeGrid.runner.running || activeGrid.runner.speed == null) {
    const algo = event.target.dataset["algo"];
    const extraData = event.target.dataset;

    if (activeGrid.runner && !activeGrid.runner.finish) {
      activeGrid.runner.stop();
    }

    activeGrid.setRunner(algo, extraData);
    resetGrid();

    if (activeGrid.startNode && activeGrid.endNode) {
      states.actionPanel.removeClass("invisible");
    }

    updateAlgoNameDisplay();
  }
}

function selectSpeed(event) {
  const speed = event.target.dataset["speed"];
  const activeGrid = states.Context.ActiveGrid;
  
  activeGrid.setRunnerSpeed(states.RunnerSpeeds[speed]);
  states.speedNameDisplay.text(speed);

  if (speed !== "Step") {
    states.nextStepBtn.hide();
    activeGrid.runner.nextStep();
  } else if (activeGrid.runner.running) {
    states.nextStepBtn.show();
  }
}

function nextStep() {
  states.Context.ActiveGrid.runner.nextStep();
}

function updateAdmissibleValue() {
  const value = Math.max(1, Math.min(this.value, 100));
  $(this).val(value);
  
  states.Context.AdmissibleValue = value;
  states.admissibleValueDisplay.text(value);
}

// Function to update algorithm name display
function updateAlgoNameDisplay() {
  states.algoNameDisplay.text(states.Context.ActiveGrid.runner.name);
}

// Initialization on document ready
$(document).ready(function() {
  paper.install(window);
  paper.setup("graph-canvas");
  init();
  
  $('[data-toggle="popover"]').popover();
  $('[data-toggle="tooltip"]').tooltip();
});

// Dropdown menu toggle
$(".dropdown-menu a.dropdown-toggle").on("click", function(e) {
  const $subMenu = $(this).next(".dropdown-menu");
  if (!$subMenu.hasClass("show")) {
    $(this).parents(".dropdown-menu").first().find(".show").removeClass("show");
  }
  $subMenu.toggleClass("show");

  $(this).parents("li.nav-item.dropdown.show").on("hidden.bs.dropdown", function() {
    $(".dropdown-submenu .show").removeClass("show");
  });

  return false;
});

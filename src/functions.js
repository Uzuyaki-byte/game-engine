function createEngine(inCanvas) {
  const engine = new bbl.Engine(inCanvas);
  return engine;
}

function createScene(inEngine) {
  const scene = new bbl.Scene(inEngine);
  return scene;
} 

function getCanvas(canvas_name) {
  const canvas = document.getElementById(canvas_name);
  return canvas;
}

function addDefCam(inScene) {
  inScene.createDefaultCameraOrLight(true, false,true);
}

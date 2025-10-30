import * as bbl from '@babylonjs/core';

// function declarations and definitions, soon to be moved to a functions.js file
function getCanvas(canvas_name) {
  const canvas = document.getElementById(canvas_name);
  return canvas;
}

function createEngine(inCanvas) {
  const engine = new bbl.Engine(inCanvas);
  return engine;
}

function createScene(inEngine) {
  const scene = new bbl.Scene(inEngine);
  return scene;
} 

function createDirLight(inScene, x, y, z) {
  const light = new bbl.DirectionalLight("DirectionalLight", new bbl.Vector3(x, y, z), inScene);
  return light;
}

function genShadows(inLight, size) {
  const shadowGenerator = new bbl.ShadowGenerator(size, inLight);
  return shadowGenerator;
}

function addDefCam(inScene) {
  inScene.createDefaultCameraOrLight(true, false,true);
}

// rendering essentials
const canvas = getCanvas('renderCanvas');
const engine = createEngine(canvas);
const scene = createScene(engine);
const light = createDirLight(scene, 1, -1, 1);
const shadows = genShadows(light, 512);

// camera parameters
const camera = new bbl.UniversalCamera('camera', new bbl.Vector3(0, 5, -10), scene);
camera.attachControl(true);
camera.inputs.addMouseWheel();
camera.setTarget(bbl.Vector3.Zero());


const box = new bbl.MeshBuilder.CreateBox();
const ground = new bbl.MeshBuilder.CreateGround("ground", {width:10, height:10});
ground.position.y=-1;
shadows.getShadowMap().renderList.push(box);

function renderLoop() {
  var t = Date.now() * 0.001;
  light.direction.set(Math.sin(t), Math.cos(t), Math.sin(t) );
  scene.render();
}

engine.runRenderLoop(renderLoop);

// Ignore this for now, some resizing yada yada
window.addEventListener('resize', function() {
  engine.resize();
})

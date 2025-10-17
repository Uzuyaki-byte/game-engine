import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ff);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3, 8);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Player ---
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
player.castShadow = true;
scene.add(player);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 2;
controls.maxDistance = 20;

// --- Input ---
const keys = { forward: false, backward: false, left: false, right: false, jump: false };

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') keys.forward = true;
  if (e.code === 'KeyS') keys.backward = true;
  if (e.code === 'KeyA') keys.left = true;
  if (e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space') keys.jump = true;
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') keys.forward = false;
  if (e.code === 'KeyS') keys.backward = false;
  if (e.code === 'KeyA') keys.left = false;
  if (e.code === 'KeyD') keys.right = false;
  if (e.code === 'Space') keys.jump = false;
});

// --- Movement Variables ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let canJump = true;
const gravity = -30;
const moveSpeed = 6;
const clock = new THREE.Clock();

// --- Animation Loop ---
function animate() {
  const dt = Math.min(0.05, clock.getDelta());

  // Direction from input
  direction.set(0, 0, 0);
  if (keys.forward) direction.z -= 1;
  if (keys.backward) direction.z += 1;
  if (keys.left) direction.x -= 1;
  if (keys.right) direction.x += 1;
  direction.normalize();

  // Camera-relative movement
  const camYaw = Math.atan2(
    camera.position.x - player.position.x,
    camera.position.z - player.position.z
  );
  const sinY = Math.sin(camYaw),
    cosY = Math.cos(camYaw);
  const worldDir = new THREE.Vector3(
    direction.x * cosY - direction.z * sinY,
    0,
    direction.x * sinY + direction.z * cosY
  );

  const targetVel = worldDir.multiplyScalar(moveSpeed);
  velocity.x = THREE.MathUtils.damp(velocity.x, targetVel.x, 8, dt);
  velocity.z = THREE.MathUtils.damp(velocity.z, targetVel.z, 8, dt);

  // Gravity
  velocity.y += gravity * dt;

  // Ground check
  const rayOrigin = new THREE.Vector3(
    player.position.x,
    player.position.y + 0.1,
    player.position.z
  );
  const ray = new THREE.Raycaster(rayOrigin, new THREE.Vector3(0, -1, 0), 0, 0.15);
  const intersections = ray.intersectObject(ground);
  const onGround = intersections.length > 0;
  if (onGround) {
    velocity.y = Math.max(0, velocity.y);
    canJump = true;
  }

  // Jump
  if (keys.jump && canJump && onGround) {
    velocity.y = 10;
    canJump = false;
  }

  // Apply movement
  player.position.addScaledVector(velocity, dt);

  // Prevent falling through
  if (player.position.y < 1) {
    player.position.y = 1;
    velocity.y = 0;
    canJump = true;
  }

  // Player rotation toward movement direction
  const horizontalVel = new THREE.Vector3(velocity.x, 0, velocity.z);
  if (horizontalVel.lengthSq() > 0.0001) {
    const targetAngle = Math.atan2(horizontalVel.x, horizontalVel.z);
    player.rotation.y = THREE.MathUtils.lerpAngle(player.rotation.y, targetAngle, 0.15);
  }

  // Camera follow
  const desiredCamOffset = new THREE.Vector3(0, 3.2, 7);
  desiredCamOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  const desiredCamPos = new THREE.Vector3()
    .copy(player.position)
    .add(desiredCamOffset);
  camera.position.lerp(desiredCamPos, 0.08);

  controls.target.lerp(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0.12);
  controls.update();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// --- Handle Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Start Animation ---
animate();

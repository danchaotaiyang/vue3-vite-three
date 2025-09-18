import * as THREE from 'three';


const { innerWidth, innerHeight } = window;

let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 12, 15);

export default camera;
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import camera from './camera.js';
import renderer from './renderer.js';


let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .1;

export default controls;
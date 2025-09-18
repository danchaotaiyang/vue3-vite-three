import * as THREE from 'three';


const { innerWidth, innerHeight } = window;

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);

export default renderer;
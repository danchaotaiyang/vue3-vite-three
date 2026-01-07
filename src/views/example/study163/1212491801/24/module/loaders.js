import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { base } from '@/config.js';


const path = `${ base }/static/example/study163/1212491801/`;

const __loader__hdr__e__ = new HDRLoader();
__loader__hdr__e__.setPath(`${ path }/texture/`);

export const hdrLoader = __loader__hdr__e__;

const __loader__gltf__ = new GLTFLoader();
__loader__gltf__.setPath(`${ path }/models/`);

export const gltfLoader = __loader__gltf__;

const __loader__texture__ = new THREE.TextureLoader();
__loader__texture__.setPath(`${ path }/texture/`);

export const textureLoader = __loader__texture__;

const __loader__cube__ = new THREE.CubeTextureLoader();
__loader__cube__.setPath(`${ path }/texture/`);
export const cubeTextureLoader = __loader__cube__;



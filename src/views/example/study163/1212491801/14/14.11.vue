<script setup>
import { base } from '@/config.js';
import { useFullscreen } from '@/stores/screenSize.js';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import fragmentShader from './shader/14.11/fragment.glsl?raw';

import vertexShader from './shader/14.11/vertex.glsl?raw';


const storeFullscreen = useFullscreen();
const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .001, 10000);
camera.position.set(5, -10, 40.2);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)、监听视图大小变化(webglResize)、销毁(webglUnmounted)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

const webglMounted = () => {
    containerRef.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);
};

const webglUpdate = () => {
    if (!containerRef.value) {
        return;
    }
    requestAnimationFrame(webglUpdate);
    if (camera) {
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.render(scene, camera);
    }
    if (controls) {
        controls.update();
    }
    update();
};

const webglResize = () => {
    const { innerWidth, innerHeight } = window;
    if (camera) {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(innerWidth, innerHeight);
    }
};

const webglUnmounted = () => {
    if (scene) {
        scene.traverse((d) => {
            if (d[ 'isMesh' ]) {
                d[ 'geometry' ][ 'dispose' ]();
                if (d[ 'material' ][ 'isMaterial' ]) {
                    d[ 'material' ][ 'dispose' ]();
                } else {
                    for (const material of d[ 'material' ]) {
                        material[ 'dispose' ]();
                    }
                }
            }
            if (d[ 'isLight' ]) {
                d[ 'dispose' ]();
            }
        });
    }
    while (scene.children.length > 0) {
        scene.remove(scene.children[ 0 ]);
    }
    if (renderer) {
        renderer.dispose();
    }
    if (gui) {
        gui.destroy();
    }
    window.removeEventListener('resize', webglResize);
};

onMounted(() => {
    webglMounted();
    webglUpdate();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*  孔明灯
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    孔明灯
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .2;
renderer.outputEncoding = THREE.sRGBEncoding;

controls.autoRotate = true;
controls.autoRotateSpeed = .08;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 1.5;

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let hdr = await rgbELoader.loadAsync('env/hdr/2k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.background = hdr;

const gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

const materialShader = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader,
    fragmentShader
});

let lantern = await gltfLoader.loadAsync('lantern/lantern.glb');
let lampshade = lantern.scene.getObjectByName('lampshade');
if (lampshade[ 'isMesh' ]) {
    lampshade.material = materialShader;
}

for (let i = 0; i < 200; i++) {
    let l = lantern.scene.clone();
    let x = (Math.random() - .5) * 300;
    let z = (Math.random() - .5) * 300;
    let y = Math.random() * 100 + 25;
    l.position.set(x, y, z);
    gsap.to(l.position, {
        duration: 5 + Math.random() * 10,
        yoyo: true,
        repeat: -1,
        x: '+=' + Math.random() * 10,
        y: '+=' + Math.random() * 10
    });
    gsap.to(l.rotation, {
        repeat: -1,
        duration: 5 + Math.random() * 50,
        y: Math.random() > .5 ? Math.PI * 2 : -Math.PI * 2
    });
    scene.add(l);
}

const update = () => {
};

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>
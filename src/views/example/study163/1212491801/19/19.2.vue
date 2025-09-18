<script setup>
import { base } from '@/config.js';
import { useFullscreen } from '@/stores/screenSize.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//  效果合成起
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

//  自带效果
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';


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
camera.position.set(1, 1, 5);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;


let controls = new OrbitControls(camera, renderer.domElement);

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
    /*
    if (renderer) {
        renderer.render(scene, camera);
    }
    */
    //  使用effectComposer来代替renderer渲染
    if (effectComposer) {
        effectComposer.render();
    }
    if (controls) {
        controls.update();
    }
};

const webglResize = () => {
    const { innerWidth, innerHeight } = window;
    if (camera) {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }
    /*
    if (renderer) {
        renderer.setSize(innerWidth, innerHeight);
    }
    */
    if (effectComposer) {
        effectComposer.setSize(innerWidth, innerHeight);
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

/*  效果合成
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    效果合成
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

let clock = new THREE.Clock();

const helperAxis = new THREE.AxesHelper(6);
scene.add(helperAxis);

let directionLight = new THREE.DirectionalLight(0xffffff, 1);
directionLight.castShadow = true;
directionLight.position.set(0, 0, 100);
scene.add(directionLight);

let textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

let envMapTexture = cubeTextureLoader.load([
    "environmentMaps/0/px.jpg",
    "environmentMaps/0/nx.jpg",
    "environmentMaps/0/py.jpg",
    "environmentMaps/0/ny.jpg",
    "environmentMaps/0/pz.jpg",
    "environmentMaps/0/nz.jpg",
]);
envMapTexture.encoding = THREE.sRGBEncoding;
scene.background = envMapTexture;
scene.environment = envMapTexture;

gltfLoader.load('DamagedHelmet/glTF/DamagedHelmet.gltf', (gltf) => {
    scene.add(gltf.scene.children[ 0 ]);
});

//  创建合成器
const effectComposer = new EffectComposer(renderer);
effectComposer.setSize(innerWidth, innerHeight);
//  创建渲染通道
const renderPass = new RenderPass(scene, camera);
//  合成器添加渲染通道
effectComposer.addPass(renderPass);

//  添加点效果
const dotScreenPass = new DotScreenPass();
dotScreenPass.enabled = false;
effectComposer.addPass(dotScreenPass);

//  添加抗锯齿
const smaaPass = new SMAAPass();
// smaaPass.enabled = false;
effectComposer.addPass(smaaPass);

//
const glitchPass = new GlitchPass();
effectComposer.addPass(glitchPass);


//  发光效果
const unrealBloomPass = new UnrealBloomPass();
// unrealBloomPass.enabled = false;
effectComposer.addPass(unrealBloomPass);

unrealBloomPass.exposure = 0;
unrealBloomPass.strength = 1;
unrealBloomPass.radius = .5;
unrealBloomPass.threshold = .5;

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2;
const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>
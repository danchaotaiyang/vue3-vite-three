<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { useFullscreen } from '@/stores/screenSize.js';
import { base } from '@/config.js';


const storeFullscreen = useFullscreen();
const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 0, 2);

let renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .1;

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
    if (controls) {
        controls.dispose();
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

/*  纹理操作
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    纹理的纵向翻转 / 与预乘alpha生成颜色
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

scene.background = new THREE.Color(0xffffff);

let geometryPlan = new THREE.PlaneGeometry(1, 1);
let materialPlan = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true
});

//  纹理贴图
// let mapTexture = textureLoader.load('manhole-cover/CityNewYork002_COL_VAR1_1K.png');
// let mapTexture = textureLoader.load('amber/base_color.jpg');
let mapTexture = textureLoader.load('rain.png');

/*  翻转
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    如果设置为true，纹理在上传到GPU的时候会进行纵向的翻转。默认值为true。
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/
// mapTexture.flipY = false;

/*  预乘
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    如果设置为true并且alpha通道存在的话，上传到GPU时alpha的数值将会与颜色通道的数值相乘。默认为false。
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/
//  会产生一个灰色描边
mapTexture.premultiplyAlpha = true;

materialPlan.map = mapTexture;

let meshPlan = new THREE.Mesh(geometryPlan, materialPlan);
scene.add(meshPlan);

const gui = new GUI();
gui.add(mapTexture, 'premultiplyAlpha', null).name('预乘').onChange(() => {
    mapTexture.needsUpdate = true;
});
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

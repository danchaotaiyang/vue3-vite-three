<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
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
camera.position.set(0, 0, 1);
camera.lookAt(scene.position);

let renderer = new THREE.WebGLRenderer();
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

/*  光源
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    透明贴图 / 环境贴图加载 / 高光贴图配合使用
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

const textureMapLoader = new THREE.TextureLoader();
textureMapLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let geometryPlane = new THREE.PlaneGeometry(1, 1);
let materialPlane = new THREE.MeshBasicMaterial({
    //  面
    side: THREE.DoubleSide,
    color: 0xffffff,
    //  支持透明
    transparent: true,
    //  反射强度
    reflectivity: .5
});

//  纹理贴图
let textureMap = textureMapLoader.load('manhole-cover/CityNewYork002_COL_VAR1_1K.png');
materialPlane.map = textureMap;

//  环境遮挡贴图
let aoMap = textureMapLoader.load('manhole-cover/CityNewYork002_AO_1K.jpg');
materialPlane.aoMap = aoMap;
materialPlane.aoMapIntensity = 1;

//  透明贴图
// let alphaMap = textureMapLoader.load('door/height.jpg');
// materialPlane.alphaMap = alphaMap;

//  光照贴图
let lightMap = textureMapLoader.load('colors.png');
// let lightMap = textureMapLoader.load('uv_grid_opengl.jpg');
materialPlane.lightMap = lightMap;

//  高光贴图
let specularMap = textureMapLoader.load('manhole-cover/CityNewYork002_GLOSS_1K.jpg');
materialPlane.specularMap = specularMap;

//  HDR贴图
rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    //  球形贴图
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    //  场景背景
    scene.background = envMap;
    //  场景环境贴图
    scene.environment = envMap;
    //  几何体环境贴图
    materialPlane.envMap = envMap;
});

let meshPlane = new THREE.Mesh(geometryPlane, materialPlane);
scene.add(meshPlane);

const gui = new GUI();
gui.add(materialPlane, 'aoMapIntensity', 0, 10).name('环境遮挡强度');
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

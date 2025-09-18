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
camera.position.set(2, 2, 2);

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

/*  Physical清漆
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    清漆效果与清漆粗糙度 / 清漆法向 / 清漆相关贴图
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

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;
});

const geometryCube = new THREE.BoxGeometry(1, 1, 1);
/*  物理材质
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
let mapRoughnessClearCoat = textureLoader.load('diamond/diamond_emissive.png');
let mapNormalCarbon = textureLoader.load('carbon/Carbon_Normal.png');
let mapNormalScratch = textureLoader.load('carbon/Scratched_gold_01_1K_Normal.png');
const materialCube = new THREE.MeshPhysicalMaterial({
    //  允许透明
    transparent: true,
    //  颜色
    color: 0xff00ff,
    //  法向贴图
    normalMap: mapNormalCarbon,
    //  粗糙度
    roughness: .5,
    //  清漆
    clearcoat: 1,
    //  清漆粗糙度
    clearcoatRoughness: .5,
    //  清漆贴图 白色强度为1, 黑色强度为0
    clearcoatMap: mapRoughnessClearCoat,
    //  清漆粗糙度 会与粗糙度相乘
    clearcoatRoughnessMap: mapRoughnessClearCoat,
    //  清漆法向贴图 划痕法向
    clearcoatNormalMap: mapNormalScratch,
    //  清漆法向因子
    clearcoatNormalScale: new THREE.Vector2(.15, .15)
});

const meshCube = new THREE.Mesh(geometryCube, materialCube);
scene.add(meshCube);

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

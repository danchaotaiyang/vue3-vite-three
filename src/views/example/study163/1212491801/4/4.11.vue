<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { useFullscreen } from '@/stores/screenSize.js';
import { base } from '@/config.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';


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

/*  Physical虹彩效应
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    肥皂泡 / 油滴 / 蝴蝶翅膀等薄膜的虹彩效应
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    iridescenceThicknessRange: {
        min: 100,
        max: 400
    },
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

const gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(`${ base }/three/draco/`);

gltfLoader.setDRACOLoader(dracoLoader);

rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    scene.environment = envMap;
});

const geometrySphere = new THREE.SphereGeometry(1, 256, 256);
/*  物理材质
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
let mapIridescenceThick = textureLoader.load('brick/brick_roughness.jpg');
const materialSphere = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    //  粗糙度
    roughness: .05,
    //  透光率
    transmission: 1,
    //  厚度
    thickness: .1,
    //  反射率
    reflectivity: 1,
    /*
    ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    虹彩效应
    ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    */
    //  虹彩范围: 0-1
    iridescence: 1,
    //  虹彩折射率
    iridescenceIOR: 1.3,
    //  彩虹厚度 默认[ 100, 400 ](纳米)
    iridescenceThicknessRange: [ 100, 400 ],
    //  虹彩厚度贴图 白色为1, 黑色为0
    iridescenceThicknessMap: mapIridescenceThick
});

const meshSphere = new THREE.Mesh(geometrySphere, materialSphere);
scene.add(meshSphere);

const gui = new GUI();
gui.add(meshSphere.material, 'thickness', 0, 10).name('厚度');
gui.add(meshSphere.material, 'reflectivity', 0, 1).name('反射率');
gui.add(meshSphere.material, 'iridescence', 0, 1).name('彩虹色');
gui.add(meshSphere.material, 'iridescenceIOR', 1, 20).name('彩虹折射率');
gui.add(state.iridescenceThicknessRange, 'min', 0, 1000).name('虹彩厚度最小').onChange((value) => {
    meshSphere.material.iridescenceThicknessRange[ 0 ] = value;
});
gui.add(state.iridescenceThicknessRange, 'max', 0, 1000).name('虹彩厚度最大').onChange((value) => {
    meshSphere.material.iridescenceThicknessRange[ 1 ] = value;
});
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

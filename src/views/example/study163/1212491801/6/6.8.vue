<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CSM } from 'three/addons/csm/CSM.js';
import { CSMHelper } from 'three/addons/csm/CSMHelper.js';
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
camera.position.set(3, 2, 8);

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
    if (csm) {
        csm.update();
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

/*  动态级联阴影
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    大场景动态级联阴影设置
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/
let state = {
    orthographic: false,
    fade: false,
    far: 1000,
    mode: 'practical',
    lightFar: 5000,
    lightNear: 1,
    lightX: -1,
    lightY: -1,
    lightZ: -1,
    autoUpdateHelper: true,
    updateHelper: () => {
        csmHelper.update();
    },
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

/*  级联阴影
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
const csm = new CSM({
    fade: state.fade,
    maxFar: state.far,
    cascades: 4,
    mode: state.mode,
    parent: scene,
    camera,
    shadowMapSize: 1024,
    lightDirection: new THREE.Vector3(
        state.lightX,
        state.lightY,
        state.lightZ
    ).normalize()
});
csm.updateFrustums();

const csmHelper = new CSMHelper(csm);
scene.add(csmHelper);

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);
rgbELoader.load('env/hdr/Video_Copilot-Back Light_0007_4k.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = envMap;
    // scene.environment = envMap;
});

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const materialPlane = new THREE.MeshPhysicalMaterial({ color: 0x999999 });
//  设置级联阴影
csm.setupMaterial(materialPlane);
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24, 1, 1),
    materialPlane
);
plane.position.y = -2;
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

const mapAlpha = textureLoader.load('16.webp');
const materialCube = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    color: 0xffcccc,
    transparent: true,
    alphaMap: mapAlpha,
    alphaTest: .5,
    shadowSide: THREE.BackSide
});
//  设置级联阴影
csm.setupMaterial(materialCube);
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    materialCube
);
cube.position.set(-4, 0, 0);
scene.add(cube);

const materialSphere = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
//  设置级联阴影
csm.setupMaterial(materialSphere);
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 32, 32),
    materialSphere
);
sphere.position.set(0, 0, 0);
scene.add(sphere);

const materialTorusKnot = new THREE.MeshPhysicalMaterial({ color: 0xccccff });
//  设置级联阴影
csm.setupMaterial(materialTorusKnot);
const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(.8, .2, 100, 100),
    materialTorusKnot
);
torusKnot.position.set(4, 0, 0);
scene.add(torusKnot);

//  环境光
const lightAmbient = new THREE.AmbientLight(0xffffff, .1);
scene.add(lightAmbient);

//  平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(state.lightX, state.lightY, state.lightZ).normalize().multiplyScalar(-200);
directionalLight.target.position.set(0, 0, 0);
//  设置投影范围
// directionalLight.shadow.camera.top = 100;
// directionalLight.shadow.camera.right = 100;
// directionalLight.shadow.camera.bottom = -100;
// directionalLight.shadow.camera.left = -100;
//  设置阴影纹理大小
// directionalLight.shadow.mapSize.width = 2048;
// directionalLight.shadow.mapSize.height = 2048;
//  设置阴影相机远端面
// directionalLight.shadow.camera.near = .5;
// directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);

//  平行光辅助器
const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight);
scene.add(directionalLightHelper);

const cameraHelp = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(cameraHelp);

//  开启渲染器投射阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//  开启平行光投射阴影
// directionalLight.castShadow = true;
//  开启物体投射阴影
plane.castShadow = true;
cube.castShadow = true;
sphere.castShadow = true;
torusKnot.castShadow = true;
//  开启物体接收投影
plane.receiveShadow = true;
cube.receiveShadow = true;
sphere.receiveShadow = true;
torusKnot.receiveShadow = true;

const gui = new GUI();
let folderSphere = gui.addFolder('Sphere');
folderSphere.add(sphere.position, 'x', -10, 10).name('X');
folderSphere.add(sphere.position, 'y', -10, 10).name('Y');
folderSphere.add(sphere.position, 'z', -10, 10).name('Z');

let folderCSM = gui.addFolder('CSM');
folderCSM.add(csm, 'fade', null).name('fade').onChange((value) => {
    csm.fade = value;
    csm.updateFrustums();
});

let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

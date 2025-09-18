<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as CANNON from 'cannon-es';
import { useFullscreen } from '@/stores/screenSize.js';


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
camera.position.set(0, 5, 20);

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

/*  关联物体
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    cannon.js关联three.js物体
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const clock = new THREE.Clock();

renderer.shadowMap.enabled = true;

const helperAxes = new THREE.AxesHelper(5);
scene.add(helperAxes);

const lightAmbient = new THREE.AmbientLight(0xffffff, .5);
scene.add(lightAmbient);

const lightDirection = new THREE.DirectionalLight(0xffffff, 2);
lightDirection.castShadow = true;
scene.add(lightDirection);

const geometrySphere = new THREE.SphereGeometry(1, 20, 20);
const materialSphere = new THREE.MeshStandardMaterial();
const meshSphere = new THREE.Mesh(geometrySphere, materialSphere);
meshSphere.castShadow = true;
meshSphere.receiveShadow = true;
scene.add(meshSphere);

const meshPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial()
);
meshPlane.position.y = -5;
meshPlane.rotation.x = -Math.PI / 2;
meshPlane.castShadow = true;
meshPlane.receiveShadow = true;
scene.add(meshPlane);

/*  创建物理世界
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────*/

// const world = new CANNON.World({ gravity: 8 });
const world = new CANNON.World();

//  gravity 重力
world.gravity.set(0, -9.8, 0);

//  物理世界的几何体
const cannonGeometrySphere = new CANNON.Sphere(1);
//  物理世界的材质
const cannonMaterialSphere = new CANNON.Material();
//  物理世界的物体
const cannonSphereBody = new CANNON.Body({
    sphere: cannonGeometrySphere,
    position: new CANNON.Vec3(0, 0, 0),
    //  物体质量
    mass: 1,
    material: cannonMaterialSphere
});
//  物理物体添加到物理世界
world.addBody(cannonSphereBody);

const update = () => {
    let time = clock.getDelta();
    world.step(1 / 120, time);
    //  three.js 物体关联到 cannon.js 世界物体
    meshSphere.position.copy(cannonSphereBody.position);
};

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

<script setup>
import { base } from '@/config.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .001, 10000);
camera.position.set(6, 3, 16);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
//  开启控制器的阻尼惯性
//  使控制器具有重量感
//  阻尼惯性必须在动画循环里调用 controls.update()
controls.enableDamping = true;
//  阻尼衰减系数 默认 0.05
controls.dampingFactor = .1;

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)

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

/*  变形原理
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    变形动画原理与实现
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const clock = new THREE.Clock();

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let envMap = await rgbELoader.loadAsync('env/038.hdr');
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.background = envMap;
scene.environment = envMap;

let gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

let morphSphereA = await gltfLoader.loadAsync('morphSphereA.glb');
let sphereA = morphSphereA.scene.children[ 0 ];

let morphSphereB = await gltfLoader.loadAsync('morphSphereB.glb');
let sphereB = morphSphereB.scene.children[ 0 ];

scene.add(morphSphereA.scene);

sphereA.geometry.morphAttributes.position = [];
sphereA.geometry.morphAttributes.position.push(sphereB.geometry.attributes.position);
sphereA.updateMorphTargets();

let params = {
    value: 0
};

gsap.to(params, {
    duration: 2,
    yoyo: true,
    repeat: -1,
    value: 1,
    onUpdate: () => {
        sphereA.morphTargetInfluences[ 0 ] = params.value;
    }
})

const update = () => {

};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

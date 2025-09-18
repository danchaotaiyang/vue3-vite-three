<script setup>
import { onMounted, ref, computed } from 'vue';
import * as THREE from 'three';


const containerRef = ref();
const sideWidth = computed(() => {
    return 215;
});

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(50, (window.innerWidth - sideWidth.value) / window.innerHeight, 0.1, 100000);
camera.position.set(0, 0, 5);
camera.lookAt(scene.position);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

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
    renderer.render(scene, camera);
    update();
};

onMounted(() => {
    webglMounted();
    webglUpdate();
});

/*  Vue应用
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    Three.js结合Vue开发
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const geometryCube = new THREE.BoxGeometry(1, 1, 1);
const materialCube = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});

const meshCube = new THREE.Mesh(geometryCube, materialCube);
scene.add(meshCube);

const update = () => {
    meshCube.rotation.x += .001;
    meshCube.rotation.y += .001;
    meshCube.rotation.z += .001;
};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

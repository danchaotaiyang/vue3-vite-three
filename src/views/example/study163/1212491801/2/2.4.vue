<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
camera.position.set(2, 2, 5);
camera.lookAt(scene.position);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .1;

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)、监听视图大小变化(webglResize)

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

/*  画布
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    响应式画布与全屏控制
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const geometryCube = new THREE.BoxGeometry(1, 1, 1);

const materialCubePrent = new THREE.MeshBasicMaterial({
    color: 0xff0000
});
const meshCubePrent = new THREE.Mesh(geometryCube, materialCubePrent);
meshCubePrent.position.set(-2, 0, 0);
meshCubePrent.scale.set(2, 2, 2);
meshCubePrent.rotation.x = Math.PI / 3;
scene.add(meshCubePrent);

const materialCube = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
const meshCube = new THREE.Mesh(geometryCube, materialCube);
meshCube.position.set(2, 0, 0);
meshCube.scale.set(.5, .5, .5);
meshCube.rotation.x = Math.PI / 3;
meshCubePrent.add(meshCube);

const eventToggleFullscreen = () => {
    storeFullscreen[ 'toggleFullscreen' ]();
};

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
<el-button v-if="storeFullscreen.fullscreen" class="toggleScreen" size="small" type="warning" @click.stop="eventToggleFullscreen">退出全屏</el-button>
<el-button v-else class="toggleScreen" size="small" type="primary" @click.stop="eventToggleFullscreen">进入全屏</el-button>
</template>

<style lang="scss" scoped>
.toggleScreen {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 10;
}
</style>

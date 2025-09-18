<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
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

/*  lil-GUI
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    应用lil-GUI调试
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    camera: {
        position: { x: 2, y: 2, z: 5 }
    },
    cubeParent: {
        position: { x: -2, y: 0, z: 0 },
        scale: { x: 2, y: 2, z: 2 },
        rotation: { x: Math.PI / 3 },
        wireframe: false,
        color: 0xff0000
    },
    cube: {
        position: { x: 2, y: 0, z: 0 },
        scale: { x: .5, y: .5, z: .5 },
        rotation: { x: Math.PI / 3 },
        wireframe: false,
        color: 0x00ff00
    },
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const geometryCube = new THREE.BoxGeometry(1, 1, 1);
const materialCubePrent = new THREE.MeshBasicMaterial({
    color: state.cubeParent.color
});
const meshCubePrent = new THREE.Mesh(geometryCube, materialCubePrent);
meshCubePrent.position.set(state.cubeParent.position.x, state.cubeParent.position.y, state.cubeParent.position.z);
meshCubePrent.scale.set(state.cubeParent.scale.x, state.cubeParent.scale.y, state.cubeParent.scale.z);
meshCubePrent.rotation.x = state.cubeParent.rotation.x;
const materialCube = new THREE.MeshBasicMaterial({
    color: state.cube.color
});
const meshCube = new THREE.Mesh(geometryCube, materialCube);
meshCube.position.set(state.cube.position.x, state.cube.position.y, state.cube.position.z);
meshCube.scale.set(state.cube.scale.x, state.cube.scale.y, state.cube.scale.z);
meshCube.rotation.x = state.cube.rotation.x;

meshCubePrent.add(meshCube);
scene.add(meshCubePrent);

const gui = new GUI();
const folderCamera = gui.addFolder('相机');
folderCamera.add(state.camera.position, 'x', -5, 5, .01).name('位置X').onChange((value) => {
    camera.position.x = value;
});
folderCamera.add(state.camera.position, 'y', -5, 5, .01).name('位置Y').onChange((value) => {
    camera.position.y = value;
});
folderCamera.add(state.camera.position, 'z', -5, 5, .01).name('位置Z').onChange((value) => {
    camera.position.z = value;
});

const folderCubeParent = gui.addFolder('父立方体');
folderCubeParent.add(state.cubeParent.position, 'x', -5, 5, .01).name('位置X').onChange((value) => {
    meshCubePrent.position.x = value;
});
folderCubeParent.add(state.cubeParent.position, 'y', -5, 5, .01).name('位置Y').onChange((value) => {
    meshCubePrent.position.y = value;
});
folderCubeParent.add(state.cubeParent.position, 'z', -5, 5, .01).name('位置Z').onChange((value) => {
    meshCubePrent.position.z = value;
});
folderCubeParent.add(state.cubeParent, 'wireframe', null).name('线框').onChange((value) => {
    meshCubePrent.material.wireframe = value;
});
folderCubeParent.addColor(state.cubeParent, 'color', null).name('颜色').onChange((value) => {
    meshCubePrent.material.color.set(value);
});

const folderCube = gui.addFolder('子立方体');
folderCube.add(state.cube.position, 'x', -5, 5, .01).name('位置X').onChange((value) => {
    meshCube.position.x = value;
});
folderCube.add(state.cube.position, 'y', -5, 5, .01).name('位置Y').onChange((value) => {
    meshCube.position.y = value;
});
folderCube.add(state.cube.position, 'z', -5, 5, .01).name('位置Z').onChange((value) => {
    meshCube.position.z = value;
});
folderCube.add(state.cube, 'wireframe', null).name('线框').onChange((value) => {
    meshCube.material.wireframe = value;
});
folderCube.addColor(state.cube, 'color', null).name('颜色').onChange((value) => {
    meshCube.material.color.set(value);
});

let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

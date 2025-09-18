<script setup>
import * as THREE from 'three';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { base } from '@/config.js';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 0, 0);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

/*let controls = new OrbitControls(camera, renderer.domElement);
//  开启控制器的阻尼惯性
//  使控制器具有重量感
//  阻尼惯性必须在动画循环里调用 controls.update()
controls.enableDamping = true;
//  阻尼衰减系数 默认 0.05
controls.dampingFactor = .1;*/

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

const webglMounted = () => {

    containerRef.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    addEvent();
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
    /*if (controls) {
        controls.update();
    }*/

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
    /* if (controls) {
         controls.dispose();
     }*/
    window.removeEventListener('resize', webglResize);

    removeEvent();
};

onMounted(() => {
    webglMounted();
    webglUpdate();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*  VR全景看房
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    原理与实现
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const state = reactive({
    isMouseDown: false
});

let textureLoader = new THREE.TextureLoader();

const geometryMain = new THREE.BoxGeometry(10, 10, 10);
geometryMain.scale(1, 1, -1);

let roomTypes = {
    'living-room': 0,
    kitchen: 3,
    'elder-room': 14,
    corridor: 9,
    'child-room': 13,
    'bed-room': 18,
    balcony: 8
};

let roomSide = [ 'l', 'r', 'u', 'd', 'b', 'f' ];
let roomTypeIndex = ref(0);

let roomMaterial = [];
let types = Object.keys(roomTypes);

for (const side of roomSide) {

    let name = types[ roomTypeIndex.value ];
    let code = roomTypes[ name ];
    let map = textureLoader.load(`${ base }/static/example/study163/1212491801/texture/rooms/${ name }/${ code }_${ side }.jpg`);

    if (side === 'd' || side === 'u') {

        map.rotation = Math.PI;
        map.center = new THREE.Vector2(.5, .5);
    }

    roomMaterial.push(new THREE.MeshBasicMaterial({ map }));
}

let room = new THREE.Mesh(geometryMain, roomMaterial);

scene.add(room);

const eventMousedown = () => {
    state.isMouseDown = true;
};

const eventMouseup = () => {
    state.isMouseDown = false;
};

const eventMousemove = (event) => {

    if (state.isMouseDown) {

        camera.rotation.y += event.movementX * .002;
        camera.rotation.x += event.movementY * .002;
        camera.rotation.order = 'YXZ';
    }
};

const addEvent = () => {

    containerRef.value.addEventListener('mousedown', eventMousedown, false);
    containerRef.value.addEventListener('mouseup', eventMouseup, false);
    containerRef.value.addEventListener('mousemove', eventMousemove, false);
};

const removeEvent = () => {

    containerRef.value.removeEventListener('mousedown', eventMousedown, false);
    containerRef.value.removeEventListener('mouseup', eventMouseup, false);
    containerRef.value.removeEventListener('mousemove', eventMousemove, false);
};

const update = () => {

};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>


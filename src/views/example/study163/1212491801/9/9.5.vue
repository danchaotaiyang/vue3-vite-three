<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
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
camera.position.set(5, 3, 10);

let renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1;

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

/*  旋臂星系
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    使用数学方法实现复杂形状旋臂星系
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const helperAxis = new THREE.AxesHelper(6);
scene.add(helperAxis);

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let texturePoint = textureLoader.load('particles/1.png');

const createPoints = (option = {}) => {
    let { count = 100, size = .5, radius = 5, branch = 3, curvature = .3, color = 0xffffff, finishColor = 0xffffff } = option;
    let colorCenter = new THREE.Color(color);
    let colorFinish = new THREE.Color(finishColor);
    let position = new Float32Array(count * 3);
    let colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        let idx = i * 3;
        let ang = i % branch * (Math.PI * 2 / branch);
        let dis = Math.random() * radius * Math.pow(Math.random(), 3);
        let rx = (Math.pow(Math.random() * 2 - 1, 3) * (radius - dis)) / 5;
        let ry = (Math.pow(Math.random() * 2 - 1, 3) * (radius - dis)) / 5;
        let rz = (Math.pow(Math.random() * 2 - 1, 3) * (radius - dis)) / 5;
        position[ idx ] = Math.cos(ang + dis * curvature) * dis + rx;
        position[ idx + 1 ] = ry;
        position[ idx + 2 ] = Math.sin(ang + dis * curvature) * dis + rz;
        let mixColor = colorCenter.clone();
        mixColor.lerp(colorFinish, dis / radius * 2);
        colors[ idx ] = mixColor.r;
        colors[ idx + 1 ] = mixColor.g;
        colors[ idx + 2 ] = mixColor.b;
    }
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    let material = new THREE.PointsMaterial({
        transparent: true,
        size: size,
        // color,
        map: texturePoint,
        alphaMap: texturePoint,
        sizeAttenuation: true,
        vertexColors: true,
        depthWrite: false,
        alphaTest: false,
        blending: THREE.AdditiveBlending
    });
    let points = new THREE.Points(geometry, material);
    scene.add(points);
    return { geometry, material, points };
};

createPoints({
    count: 10000,
    size: .2,
    radius: 8,
    branch: 4,
    curvature: .6,
    color: 0xff6030,
    finishColor: 0x1b3984,
});

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

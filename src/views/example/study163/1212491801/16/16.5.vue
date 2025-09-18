<script setup>
import { base } from '@/config.js';
import { useFullscreen } from '@/stores/screenSize.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import baseFragmentShader from './shader/16.5/fragment.glsl?raw';
import baseVertexShader from './shader/16.5/vertex.glsl?raw';


const storeFullscreen = useFullscreen();
const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .001, 10000);
camera.position.set(-2, 2, 20);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);

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

/*  点大小
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    点大小
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

const textureParticle10 = textureLoader.load('particles/10.png');
const textureParticle4 = textureLoader.load('particles/4.png');
const textureParticle7 = textureLoader.load('particles/7.png');

const createPoints = (option = {}) => {
    let { count = 100, radius = 5, branch = 3, color, finishColor } = option;
    let colorCenter = new THREE.Color(color);
    let colorFinish = new THREE.Color(finishColor);
    let position = new Float32Array(count * 3);
    let colors = new Float32Array(count * 3);
    let scales = new Float32Array(count);
    let pattern = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        let idx = i * 3;
        let ang = i % branch * (Math.PI * 2 / branch);
        let dis = Math.random() * radius;
        let x = Math.pow(Math.random() * 2 - 1, 3) * .5 * (radius - dis) * .3
        let y = Math.pow(Math.random() * 2 - 1, 3) * .5 * (radius - dis) * .3
        let z = Math.pow(Math.random() * 2 - 1, 3) * .5 * (radius - dis) * .3
        position[ idx ] = Math.cos(ang) * dis + x;
        position[ idx + 1 ] = y;
        position[ idx + 2 ] = Math.sin(ang ) * dis + z;
        let mixColor = colorCenter.clone();
        mixColor.lerp(colorFinish, dis / radius * 2);
        colors[ idx ] = mixColor.r;
        colors[ idx + 1 ] = mixColor.g;
        colors[ idx + 2 ] = mixColor.b;
        scales[ i ] = Math.random();
        pattern[ i ] = i % 3;
    }
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('scales', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('pattern', new THREE.BufferAttribute(pattern, 1));
    let material = new THREE.ShaderMaterial({
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: baseVertexShader,
        fragmentShader: baseFragmentShader,
        uniforms: {
            uTextureA: {
                value: textureParticle10
            },
            uTextureB: {
                value: textureParticle4
            },
            uTextureC: {
                value: textureParticle7
            }
        }
    });
    let points = new THREE.Points(geometry, material);
    scene.add(points);
    return { geometry, material, points };
};

createPoints({
    count: 1000,
    size: .2,
    radius: 8,
    branch: 4,
    curvature: .6,
    color: 0xff6030,
    finishColor: 0x1b3984
});

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>
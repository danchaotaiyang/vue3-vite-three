<script setup>
import { useFullscreen } from '@/stores/screenSize.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import baseFragmentShader from './shader/15.3/fragment.glsl?raw';
import baseVertexShader from './shader/15.3/vertex.glsl?raw';


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
camera.position.set(-.5, .8, 1.2);

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

/*  烟雾水
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    噪声参数
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

scene.background = new THREE.Color(0x2E1B20);

let clock = new THREE.Clock();

const helperAxis = new THREE.AxesHelper(6);
scene.add(helperAxis);

const params = {
    uWaresFrequency: 20,
    uWaresScale: .1,
    uNoiseFrequency: 10,
    uNoiseScale: .1,
    uScaleX: 1
};

const geometryPlane = new THREE.PlaneGeometry(1, 1, 512, 512);
const materialShaderPlane = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    //  顶点着色器
    vertexShader: baseVertexShader,
    //  片元着色器
    fragmentShader: baseFragmentShader,
    uniforms: {
        uTime: {
            value: 0
        },
        uWaresFrequency: {
            value: params.uWaresFrequency
        },
        uWaresScale: {
            value: params.uWaresScale
        },
        uNoiseFrequency: {
            value: params.uNoiseFrequency
        },
        uNoiseScale: {
            value: params.uNoiseScale
        },
        uScaleX: {
            value: params.uScaleX
        }
    }
});
const meshPlane = new THREE.Mesh(geometryPlane, materialShaderPlane);
meshPlane.rotation.x = -Math.PI / 2;
scene.add(meshPlane);

const update = () => {
    materialShaderPlane.uniforms.uTime.value = clock.getElapsedTime();
};

const gui = new GUI();

gui.add(params, 'uWaresFrequency', 1, 100, .1).name('波纹频率').onChange((value) => {
    materialShaderPlane.uniforms.uWaresFrequency.value = value;
});

gui.add(params, 'uWaresScale', 0, 1, .01).name('缩放比例').onChange((value) => {
    materialShaderPlane.uniforms.uWaresScale.value = value;
});

gui.add(params, 'uNoiseFrequency', 1, 100, .1).name('噪声频率').onChange((value) => {
    materialShaderPlane.uniforms.uNoiseFrequency.value = value;
});

gui.add(params, 'uNoiseScale', 0, 1, .01).name('噪声比例').onChange((value) => {
    materialShaderPlane.uniforms.uNoiseScale.value = value;
});

gui.add(params, 'uScaleX', 1, 5, .1).name('轴向比例').onChange((value) => {
    materialShaderPlane.uniforms.uScaleX.value = value;
});

let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>
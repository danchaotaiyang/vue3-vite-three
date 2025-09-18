<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
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
camera.position.set(4, 2, 4);

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
    let delta = clock.getDelta();
    if (camera) {
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.render(scene, camera);
    }
    if (controls) {
        controls.update();
    }
    updateMixer(delta);
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

/*  混合器
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    mixer混合器详解
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/
let state = {
    actionPlay() {
        action.play();
        mixer.setTime(1.8);
    },
    actionStop() {
        mixer.stopAllAction();
    },
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const clock = new THREE.Clock();

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(50, 50);
gridHelper.material.opacity = .1;
gridHelper.material.transparent = true;
scene.add(gridHelper);

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(`${ base }/three/draco/`);
gltfLoader.setDRACOLoader(dracoLoader);

rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = new THREE.Color(0xcccccc);
    scene.environment = envMap;
});

let geometryBox = new THREE.BoxGeometry(1, 1, 1);
let materialBox = new THREE.MeshStandardMaterial({
    color: 0xff33ff
});
let meshBox = new THREE.Mesh(geometryBox, materialBox);
meshBox.name = 'cube';
scene.add(meshBox);

//  创建位移向量关键帧轨道
let keyframePosition = new THREE.VectorKeyframeTrack(
    'cube.position',
    [ 0, 1, 2, 3, 4 ],
    [
        0, 0, 0,
        -1, 0, 0,
        -2, 0, 0,
        -1, 0, 0,
        0, 0, 0
    ]
);
//  创建四元数
let q1 = new THREE.Quaternion();
// q1.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
q1.setFromEuler(new THREE.Euler(0, 0, 0));
let q2 = new THREE.Quaternion();
// q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
q2.setFromEuler(new THREE.Euler(Math.PI, 0, 0));
let q4 = new THREE.Quaternion();
// q4.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 2);
q4.setFromEuler(new THREE.Euler(Math.PI * 2, 0, 0));

//  创建旋转四元数关键帧轨道
let keyframeRotation = new THREE.QuaternionKeyframeTrack(
    'cube.quaternion',
    [ 0, 2, 4 ],
    [
        ...q1.toArray(),
        ...q2.toArray(),
        ...q4.toArray()
    ]
);

//  创建布尔关键帧
/*let keyframeBoolean = new THREE.BooleanKeyframeTrack(
    'cube.visible',
    [ 0, 1, 2, 3, 4 ],
    [ true, false, true, false, true ]
);*/

//  创建颜色关键帧
let keyframeColor = new THREE.ColorKeyframeTrack(
    'cube.material.color',
    [ 0, 2, 4 ],
    [
        1, 0, 1,
        1, 1, 0,
        1, 0, 1
    ]
);

//  创建动画混合器
let mixer = new THREE.AnimationMixer(meshBox);
//  创建动画剪辑
let clip = new THREE.AnimationClip('move', 4, [
    keyframePosition,
    keyframeRotation,
    // keyframeBoolean,
    keyframeColor
]);
//  创建动画动作
let action = mixer.clipAction(clip);
//  动画播放
action.play();

let mixerMoon;
gltfLoader.load('moon.glb', (glb) => {
    let meshMoon = glb.scene.getObjectByName('defaultMaterial');
    meshMoon[ 'material' ].transparent = true;
    scene.add(glb.scene);
    let keyframeMoonOpacity = new THREE.NumberKeyframeTrack(
        'defaultMaterial.material.opacity',
        [ 0, 1, 2, 3, 4 ],
        [ 0, .5, 1, .5, 0 ]
    );
    let keyframeMoonPosition = new THREE.VectorKeyframeTrack(
        'defaultMaterial.position',
        [ 0, 1, 2, 3, 4 ],
        [
            0, 0, 0,
            0, 0, 1,
            0, 0, 2,
            0, 0, 1,
            0, 0, 0,
        ]
    );
    mixerMoon = new THREE.AnimationMixer(glb.scene);
    let clipMoon = new THREE.AnimationClip('num', 4, [ keyframeMoonOpacity, keyframeMoonPosition ]);
    let actionMoon = mixerMoon.clipAction(clipMoon);
    actionMoon.play();
});

const updateMixer = (delta) => {
    if (mixerMoon) {
        mixer.update(delta);
        mixerMoon.update(delta);
    }
};

const gui = new GUI();
let folderCube = gui.addFolder('立方体');
folderCube.add(state, 'actionPlay', null).name('动画播放');
folderCube.add(state, 'actionStop', null).name('动画停止');
folderCube.add(mixer, 'timeScale', 0, 2, .1).name('动画速度');
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

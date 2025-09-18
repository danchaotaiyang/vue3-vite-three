<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { useFullscreen } from '@/stores/screenSize.js';
import { base } from '@/config.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';


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
camera.position.set(-8, 10, -15);

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

/*  Standard标准材质
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    Standard标准材质精讲, 凹凸 / 置换 / 环境遮蔽 / 法向
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(`${ base }/three/draco/`);

gltfLoader.setDRACOLoader(dracoLoader);

const lightAmbient = new THREE.AmbientLight(0xffffff, 3);
scene.add(lightAmbient);

let mapEnv;
let mapRoughness = textureLoader.load('sword/Sting_Roughness.png');
let mapMetal = textureLoader.load('sword/Sting_Metallic.png');
let mapNormal = textureLoader.load('sword/Sting_Normal_DirectX.png');
let mapDisplacement = textureLoader.load('sword/Sting_Height.png');
let mapAo = textureLoader.load('sword/Sting_Mixed_AO.png');

rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    mapEnv = envMap;
    mapEnv.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = mapEnv;
    scene.environment = mapEnv;
    gltfLoader.load('sword/sword.glb', (glb) => {
        setStandardMaterial(glb);
        scene.add(glb.scene);
    });
});

const setStandardMaterial = (glb) => {
    let meshSword = glb.scene.getObjectByName('Garde_Plane002');
    if (!meshSword) {
        return;
    }
    /*
    ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    标准材质
    ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    */
    let { material: materialSword } = meshSword;
    let map = textureLoader.load('sword/Sting_Base_Color.png');
    map.colorSpace = THREE.SRGBColorSpace;
    //  环境贴图, 如果与环境贴图一致, 则无变化
    materialSword.envMap = mapEnv;
    //  纹理贴图
    materialSword.map = map;
    //  粗糙度
    materialSword.roughness = 1;
    //  粗糙度贴图
    materialSword.roughnessMap = mapRoughness;
    //  金属度
    materialSword.metalness = 1;
    //  金属度贴图, 白色为完全金属, 黑色为完全非金属
    materialSword.metalnessMap = mapMetal;
    //  法线贴图
    materialSword.normalMap = mapNormal;
    //  凹凸贴图, 如果定义了法线贴图, 则将忽略凹凸贴图
    materialSword.bumpMap = mapDisplacement;
    //  置换贴图
    materialSword.displacementMap = mapDisplacement;
    materialSword.displacementScale = .1;
    //  环境光贴图
    materialSword.aoMap = mapAo;
};

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

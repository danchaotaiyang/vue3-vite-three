<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';
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
camera.position.set(0, 0, 2);

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

/*  纹理使用
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    使用KTX3 / DDS / TGA纹理
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

const ktx2Loader = new KTX2Loader();
//  KTX文件解析配置: 包含 WASM 转码器和 JS 包装器的文件夹路径
//  路径必须以 / 结尾
ktx2Loader.setTranscoderPath(`${ base }/three/basis/`);
//  渲染器实例: 检测可用压缩纹理格式的硬件支持, 以确定转码器的输出格式. 必须在加载纹理之前调用.
ktx2Loader.detectSupport(renderer);

const ddsLoader = new DDSLoader();
ddsLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const tgaLoader = new TGALoader();
tgaLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let geometryPlan = new THREE.PlaneGeometry(1, 1);
let materialPlan = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true
});

let meshPlan = new THREE.Mesh(geometryPlan, materialPlan);
scene.add(meshPlan);

let envMap;

/* jpg / png 加载
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
// envMap = textureLoader.load('env/Alex_Hart-Nature_Lab_Bones_2k.jpg');

/*  KTX2加载
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
//  导出KTX2需要选择 UASTC|RGBA|~bpp / ETC1S|RGB|~bpp / ETC1S|RGBA|~bpp
//  需要选中 Flip Vertically 垂直翻转，否则贴图将颠倒显示
const loadKTT2 = (patch) => new Promise(resolve => {
    ktx2Loader.load(`/static/example/study163/1212491801/texture/${ patch }`, (texture) => {
        resolve(texture);
    });
});
//  如果KTX2包含mipmap则无法设置全景贴图，只能用于纹理贴图
// envMap = await loadKTT2('env/ktx2/Alex_Hart-Nature_Lab_Bones_2k_uastc_flipY_mipmaps_triangle.ktx2');
envMap = await loadKTT2('env/ktx2/Alex_Hart-Nature_Lab_Bones_2k_uastc_flipY_noMipmap.ktx2');

/*  DDS加载
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
const loadDDS = (path) => new Promise((resolve) => {
    ddsLoader.load(path, (texture) => {
        resolve(texture);
    })
});
// envMap = await loadDDS('env/dds/Alex_Hart-Nature_Lab_Bones_2k_bc3_flipY_noMipmap.dds');

/* TGA加载
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════*/
// envMap = tgaLoader.load('env/tga/Alex_Hart-Nature_Lab_Bones_2k_mipmaps.tga');


envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
// envMap.magFilter = THREE.LinearFilter;
//  手动设置翻转无效, 需要在导出时选中 Flip Vertically 垂直翻转
// envMap.flipY = true;
envMap.needsUpdate = true;

scene.background = envMap;
scene.environment = envMap;
materialPlan.map = envMap;

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

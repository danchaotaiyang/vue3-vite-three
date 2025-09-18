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

/*  纹理映射
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    纹理放大过滤 / 缩小过滤
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

let geometryPlan = new THREE.PlaneGeometry(1, 1);
let materialPlan = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true
});

//  纹理贴图
// let mapTexture = textureLoader.load('filter/minecraft.png');
let mapTexture = textureLoader.load('brick/brick_diffuse.jpg');
mapTexture.colorSpace = THREE.SRGBColorSpace;

/*  放大过滤
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    当一个纹素覆盖大于一个像素时，贴图将如何采样。
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

//  THREE.LinearFilter
//  [默认值] 返回距离指定的纹理坐标最近的四个纹理元素的加权平均值， 并且可以包含纹理的其他部分中，被包裹或者被重复的项目，具体取决于 wrapS 和 wrapT 的值，and on the exact mapping。

//  THREE.NearestFilter
//  返回与指定纹理坐标（在曼哈顿距离之内）最接近的纹理元素的值。

// mapTexture.magFilter = THREE.NearestFilter;

/*  缩小过滤
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    当一个纹素覆盖小于一个像素时，贴图将如何采样。
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

//  除了NearestFilter 和 LinearFilter， 下面的四个函数也可以用于缩小：

//  THREE.NearestMipmapNearestFilter
//  选择与被纹理化像素的尺寸最匹配的mipmap， 并以NearestFilter（最靠近像素中心的纹理元素）为标准来生成纹理值。

//  THREE.NearestMipmapLinearFilter
//  选择与被纹理化像素的尺寸最接近的两个mipmap， 并以NearestFilter为标准来从每个mipmap中生成纹理值。最终的纹理值是这两个值的加权平均值。

//  THREE.LinearMipmapNearestFilter
//  选择与被纹理化像素的尺寸最匹配的mipmap， 并以LinearFilter（最靠近像素中心的四个纹理元素的加权平均值）为标准来生成纹理值。

//  THREE.LinearMipmapLinearFilter
//  [默认值] 它选择与被纹理化像素的尺寸最接近的两个mipmap， 并以LinearFilter为标准来从每个mipmap中生成纹理值。最终的纹理值是这两个值的加权平均值。

// mapTexture.minFilter = THREE.LinearFilter;
// mapTexture.minFilter = THREE.LinearMipmapNearestFilter;
mapTexture.minFilter = THREE.LinearMipmapLinearFilter;
// mapTexture.minFilter = THREE.NearestFilter;
// mapTexture.minFilter = THREE.NearestMipmapNearestFilter;
// mapTexture.minFilter = THREE.NearestMipmapLinearFilter;

materialPlan.map = mapTexture;

let meshPlan = new THREE.Mesh(geometryPlan, materialPlan);
scene.add(meshPlan);

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

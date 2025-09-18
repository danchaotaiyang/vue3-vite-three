<script setup>
import { base } from '@/config.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, .001, 10000);
camera.position.set(6, 3, 16);
camera.lookAt(scene.position);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let rendererCSS2D = new CSS2DRenderer();
rendererCSS2D.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, rendererCSS2D.domElement);
//  开启控制器的阻尼惯性
//  使控制器具有重量感
//  阻尼惯性必须在动画循环里调用 controls.update()
controls.enableDamping = true;
//  阻尼衰减系数 默认 0.05
controls.dampingFactor = .1;

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

const webglMounted = () => {

    containerRef.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    let css2DElement = rendererCSS2D.domElement;
    css2DElement.classList.add('cssRenderElement');
    containerRef.value.appendChild(css2DElement);
    rendererCSS2D.render(scene, camera);
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
    if (rendererCSS2D) {
        rendererCSS2D.render(scene, camera);
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
    if (rendererCSS2D) {
        rendererCSS2D.setSize(innerWidth, innerHeight);
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

/*  曲线
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    曲线使用与绘制流程
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const clock = new THREE.Clock();

const rayCaster = new THREE.Raycaster();

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

// scene.add(new THREE.AxesHelper(5));

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 1);
scene.add(directionalLight);

const radiusEarth = 1;
const radiusMoon = .27;
let geometryEarth = new THREE.SphereGeometry(radiusEarth, 16, 16);
let materialEarth = new THREE.MeshPhongMaterial({
    specular: 0x333333,
    shininess: 5,
    map: textureLoader.load('planets/earth_atmos_4096.jpg'),
    specularMap: textureLoader.load('planets/earth_specular_2048.jpg'),
    normalMap: textureLoader.load('planets/earth_atmos_4096.jpg'),
    normalScale: new THREE.Vector2(.85, .85)
});
let meshEarth = new THREE.Mesh(geometryEarth, materialEarth);
meshEarth.rotation.y = Math.PI;
scene.add(meshEarth);

//  添加标签
let labelEarth = document.createElement('div');
labelEarth.className = 'label';
labelEarth.innerText = '地球';

let labelEarthObject = new CSS2DObject(labelEarth);
labelEarthObject.position.set(0, 1, 0);
meshEarth.add(labelEarthObject);

let geometryMoon = new THREE.SphereGeometry(radiusMoon, 16, 16);
let materialMoon = new THREE.MeshPhongMaterial({
    shininess: 5,
    map: textureLoader.load('planets/moon_1024.jpg')
});
let meshMoon = new THREE.Mesh(geometryMoon, materialMoon);
scene.add(meshMoon);

let labelMoon = document.createElement('div');
labelMoon.className = 'label';
labelMoon.innerText = '月球';

let labelMoonObject = new CSS2DObject(labelMoon);
labelMoonObject.position.set(0, radiusMoon, 0);
meshMoon.add(labelMoonObject);

let labelChina = document.createElement('div');
labelChina.className = 'label label-china';
labelChina.innerText = '中国';
let labelChinaObject = new CSS2DObject(labelChina);
labelChinaObject.position.set(-.25, .6, -.8);
meshEarth.add(labelChinaObject);

const curve = new THREE.CatmullRomCurve3(
    [
        new THREE.Vector3(-10, 0, 10),
        new THREE.Vector3(-5, 5, 5),
        new THREE.Vector3(0, 0, -5),
        new THREE.Vector3(5, -5, 5),
        new THREE.Vector3(10, 0, 10)
    ], true
);

const points = curve.getPoints(500);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Line(geometry, material);

scene.add(mesh);

const update = () => {

    let elapsedTime = clock.getElapsedTime();
    meshMoon.position.set(Math.sin(elapsedTime) * 5, 0, Math.cos(elapsedTime) * 5);

    let position = labelChinaObject.position.clone();
    //  两个向量间的距离   a.distanceTo(b)
    //  文字到相机的距离
    let distance = position.distanceTo(camera.position);
    //  向量(坐标)从世界空间投影到 > 相机的标准化设备坐标(NDC)空间,
    //  该方法会改变原坐标, 所以需要复制出来
    //  先计算间距离, 然后进行空间投影
    position.project(camera);
    //  经过空间投影后进行 光线投射
    rayCaster.setFromCamera(position, camera);

    const intersects = rayCaster.intersectObjects(scene.children, true);
    if (intersects.length === 0) {
        //  如果没有碰撞到物体, 则显示
        labelChina.classList.add('label-view');
    } else {
        //  投射结果的第一个距离大于文字距离，则文字应该显示
        //  但因为地球被旋转, 所以文字也被旋转了, 所以, 投射结果的第一个距离小于文字距离, 则显示
        if (intersects[ 0 ].distance < distance) {
            labelChina.classList.add('label-view');
        } else {
            labelChina.classList.remove('label-view');
        }
    }

};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

<style lang="scss">
.cssRenderElement {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    //pointer-events: none;
}

.label {
    font-size: 18px;
    color: #ffffff;
}

.label-china {
    visibility: hidden;
}

.label-view {
    visibility: visible;
}
</style>

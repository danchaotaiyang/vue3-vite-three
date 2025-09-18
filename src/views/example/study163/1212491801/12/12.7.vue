<script setup>
import { useFullscreen } from '@/stores/screenSize.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';


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
camera.position.set(0, 5, 20);

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

/*  作用力
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    物体施加作用力
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const clock = new THREE.Clock();

renderer.shadowMap.enabled = true;

const helperAxes = new THREE.AxesHelper(5);
scene.add(helperAxes);

const lightAmbient = new THREE.AmbientLight(0xffffff, .5);
scene.add(lightAmbient);

const lightDirection = new THREE.DirectionalLight(0xffffff, 2);
lightDirection.castShadow = true;
scene.add(lightDirection);

// const world = new CANNON.World({ gravity: 8 });
const world = new CANNON.World();
//  gravity 重力
world.gravity.set(0, -9.8, 0);

const meshPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial()
);
meshPlane.position.y = -5;
meshPlane.rotation.x = -Math.PI / 2;
meshPlane.castShadow = true;
meshPlane.receiveShadow = true;
scene.add(meshPlane);

const collectionBox = [];
//  物理世界的材质
const cannonMaterialBox = new CANNON.Material('box');
const createBox = () => {

    const geometryBox = new THREE.BoxGeometry(1, 1, 1);
    const materialBox = new THREE.MeshStandardMaterial();
    const meshBox = new THREE.Mesh(geometryBox, materialBox);
    meshBox.castShadow = true;
    meshBox.receiveShadow = true;
    scene.add(meshBox);

    //  物理世界的几何体
    const cannonGeometryBox = new CANNON.Box(new CANNON.Vec3(.5, .5, .5));
    //  物理世界的物体
    const cannonBodyBox = new CANNON.Body({
        shape: cannonGeometryBox,
        material: cannonMaterialBox,
        //  物体质量
        position: new CANNON.Vec3(0, 0, 0),
        mass: 1
    });
    //
    cannonBodyBox.applyLocalForce(
        //  施加力的大小和方向
        new CANNON.Vec3(500, 0, 0),
        //  施加力的所在位置
        new CANNON.Vec3(0, 0, 0)
    );
    //  物理物体添加到物理世界
    world.addBody(cannonBodyBox);
    cannonBodyBox.addEventListener('collide', eventBoxCollide);

    collectionBox.push({
        mesh: meshBox,
        body: cannonBodyBox
    });
};

/*  创建物理世界
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────*/

//  创建声音
const soundCollide = new Audio('/static/example/study163/1212491801/sound/collide.mp3');

//  监听碰撞
const eventBoxCollide = (event) => {
    //  获取碰撞强度
    let impactStrength = event[ 'contact' ].getImpactVelocityAlongNormal();
    if (impactStrength > 2) {
        soundCollide.currentTime = 0;
        soundCollide.volume = Math.min(1, impactStrength / 10);
        soundCollide.play();
    }
};

const cannonGeometryPlane = new CANNON.Plane();
const cannonMaterialPlane = new CANNON.Material('plane');
const cannonBodyPlane = new CANNON.Body();
cannonBodyPlane.addShape(cannonGeometryPlane);
cannonBodyPlane.material = cannonMaterialPlane;
//  地面质量为 0 , 代表固定不动
cannonBodyPlane.mass = 0;
cannonBodyPlane.position.set(0, -5, 0);
cannonBodyPlane.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(cannonBodyPlane);

// 设置两种材质碰撞的参数
const cannonContactMaterialDefault = new CANNON.ContactMaterial(
    cannonMaterialBox,
    cannonMaterialPlane,
    {
        //  摩擦力
        friction: .1,
        //  弹性系数
        restitution: .7
    }
);

//  物理世界添加关联材质
world.addContactMaterial(cannonContactMaterialDefault);

//  设置世界碰撞的默认材质，如果材质没有设置，都用此材质
world.defaultContactMaterial = cannonContactMaterialDefault;

const update = () => {
    let time = clock.getDelta();
    world.step(1 / 120, time);
    //  three.js 物体关联到 cannon.js 世界物体
    for (const box of collectionBox) {
        box.mesh.position.copy(box.body.position);
        box.mesh.quaternion.copy(box.body.quaternion);
    }
};

window.addEventListener('click', () => {
    createBox();
});

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

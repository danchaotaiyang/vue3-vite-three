<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as YUKA from 'yuka';


const containerRef = ref();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);
camera.position.set(2, 10, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

const webglMount = () => {
    renderer.render(scene, camera);
    containerRef.value.appendChild(renderer.domElement);
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
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
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
    webglMount();
    webglUpdate();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/



// scene.add(new THREE.AxesHelper(5));

let light = new THREE.SpotLight(0xffffff, 500, 150, Math.PI / 4, .5);
light.position.set(10, 20, 10);
light.castShadow = true;
scene.add(light);

let lightHelper = new THREE.SpotLightHelper(light);
scene.add(lightHelper);
lightHelper.visible = false;

let geometryPlane = new THREE.PlaneGeometry(100, 100, 10, 10);
let materialPlane = new THREE.MeshStandardMaterial({ color: 0xcccccc });
let meshPlane = new THREE.Mesh(geometryPlane, materialPlane);
meshPlane.rotation.x = -Math.PI / 2;
meshPlane.receiveShadow = true;
scene.add(meshPlane);

let geometryCone = new THREE.ConeGeometry(.2, 1, 32);
geometryCone.rotateX(Math.PI / 2);
let materialCone = new THREE.MeshStandardMaterial({ color: 0xff0000 });
let meshCone = new THREE.Mesh(geometryCone, materialCone);
//  要关掉自动更新，避免覆盖路径行为位置
meshCone.matrixAutoUpdate = false;
meshCone.receiveShadow = true;
meshCone.castShadow = true;
scene.add(meshCone);

let time = new YUKA.Time();

//  创建实体管理对象
let entityManager = new YUKA.EntityManager();

//  创建移动交通工具
let vehicle = new YUKA.Vehicle();
//  最大速度
vehicle.maxSpeed = 5
//  设置交通工具渲染对象
vehicle.setRenderComponent(meshCone, (entity, renderComponent) => {
    renderComponent.matrix.copy(entity.worldMatrix);
});

//  创建路径
let path = new YUKA.Path();
path.add(new YUKA.Vector3(0, .2, 0));
path.add(new YUKA.Vector3(0, .2, 10));
path.add(new YUKA.Vector3(10, .2, 10));
path.add(new YUKA.Vector3(10, .2, 0));
path.add(new YUKA.Vector3(0, .2, 0));

//  设置循环
path.loop = true;

let pathLine = (path) => {
    let position = [];
    for (let i = 0; i < path._waypoints.length; i++) {
        position.push(path._waypoints[ i ].x, path._waypoints[ i ].y, path._waypoints[ i ].z);
    }
    let geometryLine = new THREE.BufferGeometry();
    geometryLine.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    let materialLine = new THREE.LineBasicMaterial({ color: 0x00ffff });
    let meshLine = new THREE.Line(geometryLine, materialLine);
    scene.add(meshLine);
};

pathLine(path);

//  路径当前位置，设置为交通工具当前位置
vehicle.position.copy(path.current());

//  跟随路径行为
let followPathBehavior = new YUKA.FollowPathBehavior(path);
vehicle.steering.add(followPathBehavior);

entityManager.add(vehicle);

const update = () => {
    let delta = time.update().getDelta();
    entityManager.update(delta);
};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

<style lang="scss" scoped>

</style>
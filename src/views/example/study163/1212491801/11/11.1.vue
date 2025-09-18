<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { gsap } from 'gsap';
import { useFullscreen } from '@/stores/screenSize.js';


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
camera.position.set(0, 0, 30);

let renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.physicallyCorrectLights = true;

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

    setUpdate();
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
    removeEvent();
};

onMounted(() => {
    webglMounted();
    webglUpdate();
    addEvent();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*  3D滚动
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    3D全屏滚动官网
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let state = {
    viewIndex: 0,
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const helperAxis = new THREE.AxesHelper(6);
scene.add(helperAxis);

let clock = new THREE.Clock();
let clock2 = new THREE.Clock();

let geometryBox = new THREE.BoxGeometry(2, 2, 2);
let materialBox = new THREE.MeshBasicMaterial({
    wireframe: true
});
let materialRed = new THREE.MeshBasicMaterial({
    color: 0xff0000
});

//  box

//  创建投射光纤对象
let rayCaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let collectionBox = [];
let groupBox = new THREE.Group();

for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
        for (let z = 0; z < 5; z++) {
            let meshBox = new THREE.Mesh(geometryBox, materialBox);
            meshBox.position.set(x * 2 - 4, y * 2 - 4, z * 2 - 4);
            groupBox.add(meshBox);
            collectionBox.push(meshBox);
        }
    }
}

scene.add(groupBox);

gsap.to(groupBox.rotation, {
    duration: 8,
    ease: 'none',
    repeat: -1,
    x: `+=${ Math.PI * 2 }`,
    y: `+=${ Math.PI * 2 }`
});

/*
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    triangle
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let groupTriangle = new THREE.Group();

for (let i = 0; i < 50; i++) {
    let collectionPosition = new Float32Array(9);
    for (let p = 0; p < 9; p++) {
        collectionPosition[ p ] = Math.random() * 10 - 5;
    }
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(collectionPosition, 3));
    let color = new THREE.Color(Math.random(), Math.random(), Math.random());
    let material = new THREE.MeshBasicMaterial({
        transparent: true,
        color,
        opacity: .5,
        side: THREE.DoubleSide
    });
    let mesh = new THREE.Mesh(geometry, material);
    groupTriangle.add(mesh);
}
groupTriangle.position.set(0, -50, 0);
scene.add(groupTriangle);

gsap.to(groupTriangle.rotation, {
    duration: 8,
    ease: 'none',
    repeat: -1,
    x: `+=${ Math.PI * 2 }`,
    y: `+=${ Math.PI * 2 }`
});

/*
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    sphere
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

let groupSphere = new THREE.Group();
let geometrySphere = new THREE.SphereGeometry(1, 20, 20);
let materialSphere = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide
});
let meshSphere = new THREE.Mesh(geometrySphere, materialSphere);
meshSphere.castShadow = true;
groupSphere.add(meshSphere);

let geometryPlane = new THREE.PlaneGeometry(20, 20);
let meshPlane = new THREE.Mesh(geometryPlane, materialSphere);
meshPlane.position.y = -1;
meshPlane.rotation.x = -Math.PI / 2;
meshPlane.receiveShadow = true;
groupSphere.add(meshPlane);

let groupBall = new THREE.Group();
let geometryBall = new THREE.SphereGeometry(.1, 20, 20);
let materialBall = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let meshBall = new THREE.Mesh(geometryBall, materialBall);
meshBall.position.set(2, 2, 2);
groupBall.add(meshBall);

let lightAmbient = new THREE.AmbientLight(0xffffff, .2);
groupSphere.add(lightAmbient);

let lightPoint = new THREE.PointLight(0xff0000, 8);
lightPoint.castShadow = true;
lightPoint.shadow.radius = 20;
lightPoint.shadow.mapSize.set(512, 512);
meshBall.add(lightPoint);

groupSphere.add(groupBall);
groupSphere.position.y = -103;

scene.add(groupSphere);

const groupScene = [ groupBox, groupTriangle, groupSphere ];

const setUpdate = () => {
    let time = clock.getElapsedTime();

    meshBall.position.x = Math.sin(time) * 3;
    meshBall.position.z = Math.cos(time) * 3;
    meshBall.position.y = Math.sin(time * 10) + 1.5;

    let deltaTime = clock2.getDelta();
    camera.position.x += (mouse.x * 10 - camera.position.x) * deltaTime * 5;

};

let eventClick = (event) => {
    let { layerX, layerY } = event;
    let { width, height } = containerRef.value.getBoundingClientRect();
    mouse.x = layerX / width * 2 - 1;
    mouse.y = -(layerY / height * 2 - 1);
    rayCaster.setFromCamera(mouse, camera);
    let result = rayCaster.intersectObjects(collectionBox);
    if (result.length) {
        result.map(d => {
            d.object.material = materialRed;
        });
    }
};

let eventMouseMove = (event) => {
    let { layerX } = event;
    let { width } = containerRef.value.getBoundingClientRect();
    mouse.x = layerX / width - .5;
}

let eventScroll = () => {
    //  当前滚动第几屏
    let position = window.scrollY / innerHeight;
    //  设置相机位置
    //  这里的乘以50，是乘以第二屏物体的距离
    //  这里的乘以50，是乘以第二屏物体的距离
    //  这里的乘以50，是乘以第二屏物体的距离
    camera.position.y = -(position * 50);
    //  当前滚动第几页
    let viewIndex = Math.round(position);
    if (state.viewIndex !== viewIndex) {
        state.viewIndex = viewIndex;
        gsap.to(groupScene[ viewIndex ].rotation, {
            duration: 2,
            ease: 'power2.inOut',
            z: `+=${ Math.PI * 4 }`
        });
    }
};

const addEvent = () => {
    //  监听鼠标位置
    containerRef.value.addEventListener('click', eventClick, false);

    window.addEventListener('mousemove', eventMouseMove, false);

    window.addEventListener('scroll', eventScroll, false);
};

const removeEvent = () => {
    containerRef.value.removeEventListener('click', eventClick, false);
    window.removeEventListener('mousemove', eventMouseMove, false);
    window.removeEventListener('scroll', eventScroll, false);
};

const gui = new GUI();
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');

</script>

<template>
<div class="container">
    <div class="section section-1">
        <h1>第一屏</h1>
    </div>
    <div class="section section-2">
        <h1>第二屏</h1>
    </div>
    <div class="section section-3">
        <h1>第三屏</h1>
    </div>
</div>
<div ref="containerRef" class="fullscreen"></div>
</template>
<style scoped lang="scss">
.container {
    position: relative;
    background: #223843;
}

.fullscreen {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100vh;
}

.section {
    position: relative;
    height: 100vh;
    padding-top: 1px;
    color: #ffffff;
    box-sizing: border-box;

    h1 {
        position: relative;
        z-index: 20;
    }
}
</style>

<style>
::-webkit-scrollbar {
    display: none;
}

</style>
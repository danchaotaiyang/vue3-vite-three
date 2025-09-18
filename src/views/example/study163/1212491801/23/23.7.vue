<script setup>
import * as THREE from 'three';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { gsap } from 'gsap';
import { base } from '@/config.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import RoomShapeMesh from './mesh/RoomShapeMesh.js';
import WallMesh from './mesh/WallMesh.js';
import WallShaderMaterial from './mesh/WallShaderMaterial.js';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 2, 5.5);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
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

/*  户型
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    墙体
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const state = reactive({
    progress: 0,
    building: null
});

const progressRef = ref();

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

let envMap = textureLoader.load('env/HdrSkyCloudy004_JPG_8K.jpg');
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.background = envMap;
scene.environment = envMap;

let roomsParse = {};

let building = await fetch('/static/example/study163/1212491801/json/demo720.json')
    .then(res => {
        return res.json();
    })
    .then((data) => {

        let rooms = [];
        let { objData, panoramaLocation, cameraLocation, segments, wallRelation, housePic: homePlan } = data;
        let { roomList, walls } = objData;
        let length = roomList.length;

        for (let i = 0; i < length; i++) {

            let room = roomList[ i ];
            let { roomId } = room;
            let idx;

            idx = cameraLocation.findIndex(d => d[ 'roomId' ] === roomId);
            if (idx > -1) {

                room.camera = cameraLocation[ idx ];
            }

            idx = panoramaLocation.findIndex(d => d[ 'roomId' ] === roomId);
            if (idx > -1) {

                let panorama = panoramaLocation[ idx ];
                let { usageId, roomOldUsageName, roomUsageName, point, hole } = panorama;

                room.usageId = usageId;
                room.roomOldUsageName = roomOldUsageName;
                room.roomUsageName = roomUsageName;
                room.panorama = { point, hole };
            }

            roomsParse[ roomId ] = room;

            rooms.push(room);
        }

        for (let i = 0; i < wallRelation.length; i++) {

            let wr = wallRelation[ i ];

            for (let j = 0; j < wr.faceRelation.length; j++) {

                let fr = wr.faceRelation[ j ];

                fr.panorama = roomsParse[ fr[ 'roomId' ] ].panorama;
            }
        }

        return { rooms, walls, segments, wallRelation, homePlan };
    });

for (let i = 0; i < building.rooms.length; i++) {

    let room = building.rooms[ i ];

    let roomShapeFloor = new RoomShapeMesh(room, {
        side: THREE.DoubleSide,
        material: new WallShaderMaterial(room.panorama)
    });

    let roomShapeCeiling = new RoomShapeMesh(room, {
        position: new THREE.Vector3(0, 2.8, 0)
    });

    scene.add(roomShapeFloor, roomShapeCeiling);
}

for (let i = 0; i < building.wallRelation.length; i++) {

    let { wallPoints, faceRelation } = building.wallRelation[ i ];

    let mesh = new WallMesh(wallPoints, faceRelation);
}

const update = () => {

};

//  进度
THREE.DefaultLoadingManager.onProgress = (item, loaded, total) => {

    state.progress = Number((loaded / total * 100).toFixed(2));

    if (state.progress === 100) {

        gsap.to(progressRef.value, {
            duration: 1,
            opacity: 0,
            onComplete: () => {
                state.progress = -1;
            }
        });
    }
};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
<div class="progress" ref="progressRef" v-if="state.progress > -1">
    <span>加载进度 {{ state.progress }}%</span>
</div>
</template>

<style lang="scss" scoped>
.mini-map {
    position: fixed;
    bottom: 3px;
    left: 3px;
    z-index: 10;

    .map {
        width: 300px;
        border-radius: 8px;
        overflow: hidden;

        img {
            display: block;
            width: 100%;
        }
    }

    .location {
        position: absolute;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        background: url("./location.png") no-repeat;
        background-size: contain;
    }
}

.progress {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ffffff;
}
</style>

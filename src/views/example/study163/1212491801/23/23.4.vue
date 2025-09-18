<script setup>
import * as THREE from 'three';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { base } from '@/config.js';
import { gsap } from 'gsap';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 0, 0);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

/*let controls = new OrbitControls(camera, renderer.domElement);
//  开启控制器的阻尼惯性
//  使控制器具有重量感
//  阻尼惯性必须在动画循环里调用 controls.update()
controls.enableDamping = true;
//  阻尼衰减系数 默认 0.05
controls.dampingFactor = .1;*/

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

const webglMounted = () => {

    containerRef.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    addEvent();
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
    /*if (controls) {
        controls.update();
    }*/

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
    /* if (controls) {
         controls.dispose();
     }*/
    window.removeEventListener('resize', webglResize);

    removeEvent();
};

onMounted(() => {
    webglMounted();
    webglUpdate();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*  VR全景看房
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    进度
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const state = reactive({
    progress: 0,
    isMouseDown: false
});

const locationRef = ref();
const locationStyle = ref({
    transform: `translate(90px, 110px)`
});
const progressRef = ref();

class Room {

    #roomSide = [ 'l', 'r', 'u', 'd', 'b', 'f' ];

    constructor(name, texture, position = new THREE.Vector3(0, 0, 0), euler = new THREE.Euler(0, 0, 0)) {

        this.name = name;
        this.texture = texture;
        this.position = position;
        this.euler = euler;

        this.createRoom();
    }

    createRoom() {

        let textureLoader = new THREE.TextureLoader();

        const geometryMain = new THREE.BoxGeometry(10, 10, 10);
        geometryMain.scale(1, 1, -1);

        let roomMaterial = [];

        for (const side of this.#roomSide) {

            let map = textureLoader.load(`${ this.texture }_${ side }.jpg`);

            if (side === 'd' || side === 'u') {

                map.rotation = Math.PI;
                map.center = new THREE.Vector2(.5, .5);
            }

            roomMaterial.push(new THREE.MeshBasicMaterial({ map }));
        }

        let mesh = new THREE.Mesh(geometryMain, roomMaterial);
        mesh.position.copy(this.position);
        mesh.rotation.copy(this.euler);

        this.mesh = mesh;
    }
}


class SpriteLabel {

    onClick = null;

    constructor(content, position = new THREE.Vector3(0, 0, 0), camera) {

        this.content = content;
        this.position = position;
        this.camera = camera;
        this.rayCaster = new THREE.Raycaster();

        this.createLabel();
        this.setEvent();
    }

    createLabel() {

        let width = 1024;
        let height = 1024;

        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        let ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, .2)';
        ctx.fillRect(0, height / 4, width, height / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 200px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.content, width / 2, height / 2);

        let texture = new THREE.CanvasTexture(canvas);
        let material = new THREE.SpriteMaterial({
            transparent: true,
            map: texture
        });
        let sprite = new THREE.Sprite(material);
        sprite.position.copy(this.position);

        this.mesh = sprite;
    }

    eventClick(event) {

        let mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.rayCaster.setFromCamera(mouse, this.camera);
        let intersects = this.rayCaster.intersectObject(this.mesh);

        if (intersects.length) {
            if (typeof this.onClick === 'function') {
                this.onClick(this);
            }
        }
    }

    setEvent() {
        window.addEventListener('click', (event) => {
            event.stopPropagation();
            this.eventClick(event);
        }, false);
    }

    dispose() {
        this.onClick = null;
        window.removeEventListener('click', this.eventClick, false);
    }
}


/*let roomTypes = {
    livingroom: 0,
    kitchen: 3,
    elderroom: 14,
    corridor: 9,
    childroom: 13,
    bedroom: 18,
    balcony: 8
};*/

//  客厅
let livingRoom = new Room('客厅', `${ base }/static/example/study163/1212491801/texture/rooms/living-room/0`);
scene.add(livingRoom.mesh);

//  客厅到阳台
let labelBalconyFromLivingRoom = new SpriteLabel('阳台', new THREE.Vector3(0, 0, 4.5), camera);
labelBalconyFromLivingRoom.onClick = () => {

    gsap.to(camera.position, {
        duration: 1,
        x: balcony.mesh.position.x,
        y: balcony.mesh.position.y,
        z: balcony.mesh.position.z
    });

    gsap.to(locationRef.value, {
        duration: 1,
        x: 24,
        y: 53
    });
};
scene.add(labelBalconyFromLivingRoom.mesh);

//  客厅到厨房
let labelKitchenFromLivingRoom = new SpriteLabel('厨房', new THREE.Vector3(-1.8, 0, -4.5), camera);
labelKitchenFromLivingRoom.onClick = () => {

    gsap.to(camera.position, {
        duration: 1,
        x: kitchen.mesh.position.x,
        y: kitchen.mesh.position.y,
        z: kitchen.mesh.position.z
    });

    gsap.to(locationRef.value, {
        duration: 1,
        x: 180,
        y: 164
    });
};
scene.add(labelKitchenFromLivingRoom.mesh);

//  阳台
let balcony = new Room('阳台', `${ base }/static/example/study163/1212491801/texture/rooms/balcony/8`, new THREE.Vector3(1, 0, 10));
scene.add(balcony.mesh);

//  阳台到客厅
let labelLivingRoomFromBalcony = new SpriteLabel('客厅', new THREE.Vector3(1.8, 0, 5.5), camera);
labelLivingRoomFromBalcony.onClick = () => {

    gsap.to(camera.position, {
        duration: 1,
        x: 0,
        y: 0,
        z: 0
    });

    gsap.to(locationRef.value, {
        duration: 1,
        x: 90,
        y: 110
    });
};
scene.add(labelLivingRoomFromBalcony.mesh);

//  厨房
let kitchen = new Room('厨房', `${ base }/static/example/study163/1212491801/texture/rooms/kitchen/3`, new THREE.Vector3(-2.4, 0, -10), new THREE.Euler(0, -Math.PI / 2, 0));
scene.add(kitchen.mesh);

//  厨房到客厅
let labelLivingRoomFromKitchen = new SpriteLabel('客厅', new THREE.Vector3(0, 0, -5.5), camera);
labelLivingRoomFromKitchen.onClick = () => {

    gsap.to(camera.position, {
        duration: 1,
        x: 0,
        y: 0,
        z: 0
    });

    gsap.to(locationRef.value, {
        duration: 1,
        x: 90,
        y: 110
    });
};
scene.add(labelLivingRoomFromKitchen.mesh);

const eventMousedown = () => {
    state.isMouseDown = true;
};

const eventMouseup = () => {
    state.isMouseDown = false;
};

const eventMousemove = (event) => {

    if (state.isMouseDown) {

        camera.rotation.y += event.movementX * .002;
        camera.rotation.x += event.movementY * .002;
        camera.rotation.order = 'YXZ';
    }
};

const addEvent = () => {

    containerRef.value.addEventListener('mousedown', eventMousedown, false);
    containerRef.value.addEventListener('mouseup', eventMouseup, false);
    containerRef.value.addEventListener('mousemove', eventMousemove, false);
};

const removeEvent = () => {

    containerRef.value.removeEventListener('mousedown', eventMousedown, false);
    containerRef.value.removeEventListener('mouseup', eventMouseup, false);
    containerRef.value.removeEventListener('mousemove', eventMousemove, false);
};

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
        })
    }
};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
<div class="mini-map">
    <div class="map"><img src="./map.gif" alt=""></div>
    <div class="location" :style="locationStyle" ref="locationRef"></div>
</div>
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

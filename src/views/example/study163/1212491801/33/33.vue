<script setup>
import * as THREE from 'three';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as d3 from 'd3';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { base } from '@/config.js';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)、控制器(OrbitControls)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .001, 10000);
camera.position.set(0, 0, 200);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
//  开启控制器的阻尼惯性
//  使控制器具有重量感
//  阻尼惯性必须在动画循环里调用 controls.update()
controls.enableDamping = false;
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

/*  地理数据生成3D地图
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    地理数据生成3D地图
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

const fileLoader = new THREE.FileLoader();
fileLoader.setPath(`${ base }/static/example/study163/1212491801/json/`);

scene.background = new THREE.Color().setHSL(0.6, 0, 1);

let hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemisphereLight.color.setHSL(0.6, 1, 0.6);
hemisphereLight.groundColor.setHSL(0.095, 1, 0.75);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);
hemisphereLight.dispose();
hemisphereLight = null;

let d = 50;
let dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(-1, 1.75, 1);
dirLight.position.multiplyScalar(30);

dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);
dirLight.dispose();
dirLight = null;

/* let geometryGround = new THREE.PlaneGeometry(10000, 10000);
let materialGround = new THREE.MeshLambertMaterial({ color: 0x3F3F3F });
let meshGround = new THREE.Mesh(geometryGround, materialGround);

meshGround.position.y = -33;
meshGround.rotation.x = -Math.PI / 2;
meshGround.receiveShadow = true;

scene.add(meshGround);

geometryGround.dispose();
geometryGround = null;
materialGround.dispose();
materialGround = null;
meshGround = null; */

let jsonData = null;
let map = new THREE.Object3D();
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

fileLoader.load('100000_full.json', (data) => {
    jsonData = JSON.parse(data);
    createMap();
});

const createMap = () => {

    if (!jsonData) {
        return;
    }

    jsonData.features.forEach((d) => {

        let { name } = d.properties;

        const province = new THREE.Object3D();

        province.name = name;

        let { type, coordinates } = d.geometry;

        switch(type) {
            case 'Polygon': {
                
                let polygon = createPolygon(coordinates);
                polygon.name = name;
                polygon.type = 'mesh';
                province.add(polygon);

                let line = createLine(coordinates);
                line.type = 'line';
                province.add(line);

                break;
            }

            case 'MultiPolygon': {

                coordinates.forEach((d) => {

                    let polygon = createPolygon(d);
                    polygon.type = 'mesh';
                    polygon.name = name;

                    province.add(polygon);

                    let line = createLine(d);
                    line.type = 'line';
                    province.add(line);
                });

                break;
            }
        }

        map.add(province);
        
    });

    scene.add(map);
};

const projection = d3.geoMercator().center([ 116.408212, 39.90527 ]).translate([ 0, 0, 0 ]);

const createPolygon = (coordinates) => {

    const shape = new THREE.Shape();

    coordinates[ 0 ].forEach((d, i) => {

        let [ longitude, latitude ] = projection(d);

        if (i === 0) {
            shape.moveTo(longitude, -latitude);
        }

        shape.lineTo(longitude, -latitude);
    });

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 5 });
    let color = new THREE.Color(Math.random() * 0xffffff);
    const material = new THREE.MeshBasicMaterial({
        transparent: true,
        color,
        opacity: .7
    });
    material.__color__ = color;

    return new THREE.Mesh(geometry, material);
};

const createLine = (coordinates) => {

    let points = coordinates[ 0 ].map(d => {
        let [ longitude, latitude ] = projection(d);
        return new THREE.Vector3(longitude, -latitude, 10);
    });

    let geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);

    let material = new THREE.LineBasicMaterial({ color: Math.random() * 0xffffff });

    return new THREE.Line(geometry, material);
};

let currentPicker;

window.addEventListener('click', (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersectors = raycaster.intersectObjects(map.children).filter(d => d.object.type === 'mesh');

    if (currentPicker) {
        currentPicker.material.color = currentPicker.material.__color__;
        currentPicker.material.opacity = .7;
    }

    if (intersectors.length) {
        currentPicker = intersectors[ 0 ].object;
        currentPicker.material.color = new THREE.Color(0xff0000);
        currentPicker.material.opacity = 1;
    }
})

const update = () => {

};
</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

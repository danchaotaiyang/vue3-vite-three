<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


let { innerWidth, innerHeight } = window;
innerWidth -= 215;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 50, 0);
camera.lookAt(scene.position);
scene.add(camera);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);

let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(100, 20);
gridHelper.material.opacity = .5;
gridHelper.material.transparent = true;
scene.add(gridHelper);

const containerRef = ref();

const webglMounted = () => {
    containerRef.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);
    getData();
};

const webglUpdate = () => {
    if (controls) {
        controls.update();
    }
    if (renderer) {
        renderer.render(scene, camera);
    }
};

const webglResize = () => {
    let { innerWidth, innerHeight } = window;
    innerWidth -= 215;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    cleanProvinceMap();
    setProvinceMap();
};

const animationFrame = () => {
    webglUpdate();
    requestAnimationFrame(animationFrame);
};

onMounted(() => {
    webglMounted();
    animationFrame();
});

window.addEventListener('resize', webglResize, false);

const averageX = 126.468615;
const averageY = 43.5936385;
let cityShapes = {};
let cityGeometry = {};

const getData = () => {
    const loader = new THREE.FileLoader();
    loader.load('/static/example/others/geo-json/data/JiLin.json', (data) => {
        if (typeof data === 'string') {
            cityShapes = JSON.parse(data);
            setProvinceMap();
        }
    });
};

const createShape = (pos) => {
    let shape = new THREE.Shape();
    let average = 0;
    if (innerWidth > innerHeight) {
        average = innerHeight / 180;
    } else {
        average = innerWidth / 360;
    }
    console.log(average);
    shape.moveTo((pos[ 0 ][ 0 ] - averageX) * average, (pos[ 0 ][ 1 ] - averageY) * average);
    pos.map(d => {
        console.log((d[ 0 ] - averageX) * average, (d[ 1 ] - averageY) * average);
        shape.lineTo((d[ 0 ] - averageX) * average, (d[ 1 ] - averageY) * average);
    });
    return shape;
};

const extrudeOption = {
    depth: .3,
    steps: 1,
    bevelEnabled: false,
    bevelThickness: 0,
    bevelSize: 0,
    bevelSegments: 0,
    curveSegments: 0
};
const createGeometry = (shape, identify) => {
    let geometry = new THREE.ExtrudeGeometry(shape, extrudeOption);
    let material0 = new THREE.MeshBasicMaterial({
        color: 0xF8F8FF,
        transparent: true,
        opacity: .5
    });
    let material1 = new THREE.MeshBasicMaterial({
        color: 0xD3D3D3,
        transparent: true,
        opacity: 1
    });
    let key = `geometry${ identify }`;
    let mesh = new THREE.Mesh(geometry, [ material0, material1 ]);
    mesh.rotation.x = -Math.PI / 2;
    cityGeometry[ key ] = mesh;
    scene.add(mesh);
    geometry = null;
    material0 = null;
    material1 = null;
    mesh = null;
};

const setProvinceMap = () => {
    cityShapes.features.map((city, ci) => {
        let { coordinates } = city.geometry;
        let isMultiple = coordinates.length > 1;
        coordinates.map((area, ai) => {
            if (isMultiple) {
                if (area.length && area[ 0 ].length === 2) {
                    createGeometry(createShape(area), ci + ai);
                }
                if (area.length && area[ 0 ].length > 2) {
                    area.map((d, i) => {
                        createGeometry(createShape(d), ci + ai + i);
                    });
                }
            } else {
                let pos;
                if (area.length > 1) {
                    pos = area;
                } else {
                    pos = area[ 0 ];
                }
                if (pos) {
                    createGeometry(createShape(pos), ci + ai);
                }
            }
        });
    });
};

const cleanProvinceMap = () => {
    for (const geometry in cityGeometry) {
        scene.remove(cityGeometry[ geometry ]);
    }
};

</script>

<template>
<div ref="containerRef" class="geo-json-terrain"></div>
</template>

<style lang="scss" scoped>
.geo-json-terrain {
    width: 100%;
    height: 100vh;
}
</style><!-- https://download.csdn.net/blog/column/10734116/129174208 --><!-- https://www.cnblogs.com/yangzhengier/p/12864803.html -->

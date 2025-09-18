<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { base } from '@/config.js';


let { innerWidth, innerHeight } = window;
let sideWidth = 215;
innerWidth -= sideWidth;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100000);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
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

const textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/others/terrain-map/texture/`);

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
    camera.aspect = (window.innerWidth - sideWidth.value) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
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

const topTextureTypes = [ 'textureMap', 'normalMap', 'displacementMap' ];
const config = {
    textureMapURL: 'texture.jpg',
    normalMapURL: 'normal.jpg',
    displacementMapURL: 'dem.png',
    sideTextureMapURL: 'side.png',
    normalScale: 1,
    displacementScale: 1,
    segment: 6,
    altitude: 1,
    lineWidth: 300,
    intensity: .9
};

let path = [];
let extRange = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0
};
let averageX = 0;
let averageY = 0;
let meshTopProps = {};
let meshTop;
let meshSideProps = {};
let meshSide;

const getData = () => {
    new THREE.FileLoader().load(`${ base }/static/example/others/terrain-map/data/JiLin.json`, async (data) => {
        if (typeof data === 'string') {
            let map = JSON.parse(data);
            path = map.features[ 0 ].geometry[ 'coordinates' ][ 0 ][ 0 ];
            getExtRange();
            await setTextures();
            createMeshTop();
            if (config.altitude > 0) {
                createMeshSide();
            }
            if (config.lineWidth > 0) {
                createEdge();
            }
            setLight();
        }
    });
};

const getExtRange = () => {
    let minX = path[ 0 ][ 0 ];
    let minY = path[ 0 ][ 1 ];
    let maxX = path[ 0 ][ 0 ];
    let maxY = path[ 0 ][ 1 ];
    for (let i = 0; i < path.length; i++) {
        let [ x, y ] = path[ i ];
        if (x < minX) {
            minX = x;
        }
        if (x > maxX) {
            maxX = x;
        }
        if (y < minY) {
            minY = y;
        }
        if (y > maxY) {
            maxY = y;
        }
    }
    extRange = { minX, minY, maxX, maxY };
    averageX = (minX + maxX) / 2;
    averageY = (minY + maxY) / 2;
};

const setTextures = async () => {
    try {
        for (let i = 0; i < topTextureTypes.length; i++) {
            let name = topTextureTypes[ i ];
            let url = config[ `${ name }URL` ];
            if (url) {
                let mapTextureTop = textureLoader.load(url);
                mapTextureTop.wrapS = THREE.RepeatWrapping;
                mapTextureTop.wrapT = THREE.RepeatWrapping;
                meshTopProps[ name ] = mapTextureTop;
            }
        }
        meshTopProps[ 'alphaMap' ] = createAlphaMap();

        let mapTextureSide = textureLoader.load(config.sideTextureMapURL);
        mapTextureSide.wrapS = THREE.RepeatWrapping;
        mapTextureSide.wrapT = THREE.RepeatWrapping;
        mapTextureSide.offset.set(0, 1);
        meshSideProps.textureMap = mapTextureSide;
    } catch (e) {
        console.warn(e);
    } finally {

    }
};

const createCanvas = ({ width, height }) => {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let context = canvas.getContext('2d');
    context.translate(0, height);
    context.scale(1, -1);
    return canvas;
};

const createAlphaMap = () => {
    let polygonVertices = path.map(([ x, y ]) => new THREE.Vector3(x, y, 0));
    let { maxX, maxY, minX, minY } = extRange;
    let maxDimension = Math.max(maxX - minX, maxY - minY);
    let scale = Math.max(innerWidth, innerWidth) / maxDimension;
    let scaledVertices = polygonVertices.map(d => {
        let x = (d.x - minX) * scale;
        let y = (d.y - minY) * scale;
        return new THREE.Vector3(x, y, d.z);
    });
    let width = Math.ceil((maxX - minX) * scale);
    let height = Math.ceil((maxY - minY) * scale);
    let canvas = createCanvas({ width, height });
    let context = canvas.getContext('2d');
    context.fillRect(0, 0, width, height);
    context.fillStyle = 0xffffff;
    context.beginPath();
    context.moveTo(scaledVertices[ 0 ].x, scaledVertices[ 0 ].y);
    for (let i = 0; i < scaledVertices.length; i++) {
        context.lineTo(scaledVertices[ i ].x, scaledVertices[ i ].y);
    }
    context.closePath();
    context.fill();

    return new THREE.CanvasTexture(canvas, null, THREE.RepeatWrapping, THREE.RepeatWrapping);
};

const createMeshTop = () => {
    let { normalScale, displacementScale } = config;
    let { textureMap, normalMap, displacementMap, alphaMap } = meshTopProps;
    let material = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: 0xf8f8f8,
        map: textureMap,
        normalMap,
        normalScale: new THREE.Vector2(normalScale, normalScale),
        alphaMap,
        displacementMap,
        displacementScale,
        displacementBias: 0,
        wireframe: false,
        transparent: true,
        alphaTest: .1
    });
    let geometry = createGeometryTop();
    meshTop = new THREE.Mesh(geometry, material);
    meshTop.position.set(0, 0, config.altitude);
    meshTop.rotation.x = Math.PI * -.5;
    scene.add(meshTop);
};

const getGeometryUV = (geometry) => {
    let vertexCount = geometry.attributes.position.count;
    let uvArray = new Float32Array(vertexCount * 2);
    let { minX, minY, maxX, maxY } = extRange;
    for (let i = 0; i < vertexCount; i++) {
        let vertexIndex = i * 2;
        let u = (geometry.attributes.position.getX(i) - minX) / (maxX - minX);
        let v = (geometry.attributes.position.getY(i) - minY) / (maxY - minY);
        uvArray[ vertexIndex ] = u;
        uvArray[ vertexIndex + 1 ] = v;
    }
    return uvArray;
};

const createGeometryTop = () => {
    let { maxX, maxY, minX, minY } = extRange;
    let coords = [
        [ minX, minY ],
        [ minX, maxY ],
        [ maxX, maxY ],
        [ maxX, minY ]
    ];
    let pathShape = new THREE.Shape();
    coords.map(([ x, y ], i) => {
        if (i === 0) {
            pathShape.moveTo(x - averageX, y - averageY);
        } else {
            pathShape.lineTo(x - averageX, y - averageY);
        }
    });
    let geometry = new THREE.ShapeGeometry(pathShape);
    let modifier = new TessellateModifier(.1, config.segment);
    geometry = modifier.modify(geometry);
    let uvArray = getGeometryUV(geometry);
    let uvAttribute = new THREE.BufferAttribute(uvArray, 2);
    geometry.setAttribute('uv', uvAttribute);
    return geometry;
};

const createGeometrySide = () => {
    let first = path[ 0 ];
    let last = path[ path.length - 1 ];
    if (first.toString() !== last.toString()) {
        path.push(first);
    }
    let vec3 = [];
    let face = [];
    let uv = [];
    const t0 = [ 0, 0 ];
    const t1 = [ 1, 0 ];
    const t2 = [ 1, 1 ];
    const t3 = [ 0, 1 ];
    for (let i = 0; i < path.length; i++) {
        const [ x1, y1, z1 ] = path[ i ];
        vec3.push([ x1, y1, 0 ]);
        vec3.push([ x1, y1, z1 !== undefined ? z1 : config.altitude ]);
    }
    for (let i = 0; i < vec3.length - 2; i++) {
        if (i % 2 === 0) {
            face = [
                ...face,
                ...vec3[ i ],
                ...vec3[ i + 2 ],
                ...vec3[ i + 1 ]
            ];
            uv = [ ...uv, ...t0, ...t1, ...t3 ];
        } else {
            face = [
                ...face,
                ...vec3[ i ],
                ...vec3[ i + 1 ],
                ...vec3[ i + 2 ]
            ];
            uv = [ ...uv, ...t3, ...t1, ...t2 ];
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(face), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    return geometry;
};

const createMeshSide = () => {
    const geometry = createGeometrySide();
    const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: true,
        map: meshSideProps.textureMap
    });
    meshSide = new THREE.Mesh(geometry, material);
    scene.add(meshSide);
};

const createEdge = () => {

};

const setLight = () => {
    let { intensity } = config;
    let directionLight = new THREE.DirectionalLight(0xffffff, intensity);
    directionLight.position.set(1, 1, 1);
    scene.add(directionLight);
    const light = new THREE.AmbientLight(0x404040, 2 * intensity);
    scene.add(light);
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
</style><!-- https://juejin.cn/post/7369478484370374666 --><!-- https://blog.csdn.net/qq_44246618/article/details/130379441 -->

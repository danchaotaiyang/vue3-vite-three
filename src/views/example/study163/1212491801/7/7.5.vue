<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
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
camera.position.set(3, 1, 5);

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

/*  变换控制参照
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    变换控制器按照本地与世界坐标控制
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/
let state = {
    loading: false,
    scene: null,
    setScene() {
        loadScene();
    },
    setModeNone() {
        tControls.detach();
    },
    setModeTranslate() {
        tControls.setMode('translate');
    },
    setModeScale() {
        tControls.setMode('scale');
    },
    setModeRotate() {
        tControls.setMode('rotate');
    },
    space: false,
    meshes: [],
    toggleFullscreen() {
        storeFullscreen[ 'toggleFullscreen' ]();
        toggleFullscreen.name([ '进入全屏', '退出全屏' ][ storeFullscreen.isFullScreen ]);
    }
};

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(50, 50);
gridHelper.material.opacity = .1;
gridHelper.material.transparent = true;
scene.add(gridHelper);

const rgbELoader = new RGBELoader();
rgbELoader.setPath(`${ base }/static/example/study163/1212491801/texture/`);

const gltfLoader = new GLTFLoader();
gltfLoader.setPath(`${ base }/static/example/study163/1212491801/models/`);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(`${ base }/three/draco/`);

gltfLoader.setDRACOLoader(dracoLoader);

const tControls = new TransformControls(camera, renderer.domElement);
tControls.addEventListener('change', () => {
    if (renderer) {
        renderer.render(scene, camera);
    }
});
tControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
});
const gizmo = tControls.getHelper();
scene.add(gizmo);
const meshChoose = (mesh) => tControls.attach(mesh);

rgbELoader.load('env/hdr/Alex_Hart-Nature_Lab_Bones_2k.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = new THREE.Color(0xcccccc);
    scene.environment = envMap;
});

const loadScene = () => {
    if (state.loading) {
        return;
    }
    if (state.scene) {
        scene.remove(state.scene);
        state.scene = null;
    } else {
        state.loading = true;
        gltfLoader.load('house/house-scene-min.glb', (glb) => {
            state.scene = glb.scene;
            scene.add(state.scene);
            state.loading = false;
        });
    }
};

const gui = new GUI();
const folderControls = gui.addFolder('控制器');
folderControls.add(state, 'space', null).name('本地坐标').onChange((value) => {
    tControls.setSpace(value ? 'local' : 'world');
});
const folderMode = gui.addFolder('操作');
folderMode.add(state, 'setModeTranslate', null).name('移动');
folderMode.add(state, 'setModeScale', null).name('缩放');
folderMode.add(state, 'setModeRotate', null).name('旋转');
folderMode.add(state, 'setModeNone', null).name('取消选择');
const folderMesh = gui.addFolder('物体');
folderMesh.add(state, 'setScene', null).name('场景');
const folderTable = gui.addFolder('家具列表');
const meshes = [
    {
        name: 'plant',
        label: '盆栽',
        value: 'house/plants-min.glb'
    },
    {
        name: 'sofa',
        label: '单人沙发',
        value: 'house/sofa_chair_min.glb'
    }
];
const meshOrder = {};
meshes.forEach((d) => {
    let mesh = {
        add: () => {
            if (state.loading) {
                return;
            }
            state.loading = true;
            gltfLoader.load(d.value, (glb) => {
                let object3d = glb.scene;
                state.meshes.push(object3d);
                scene.add(object3d);
                meshChoose(object3d);
                state.loading = false;
                let mesh = {
                    choose: () => {
                        meshChoose(object3d);
                    }
                };
                meshOrder[ d.name ] = meshOrder[ d.name ] ? meshOrder[ d.name ] + 1 : 1;
                folderTable.add(mesh, 'choose', null).name(`${ d.label }-${ meshOrder[ d.name ] }`);
                mesh = null;
            });
        }
    };
    folderMesh.add(mesh, 'add', null).name(d.label);
    mesh = null;
});
let toggleFullscreen = gui.add(state, 'toggleFullscreen', null).name('进入全屏');
const setEventKey = (key) => {
    switch (key) {
        case 't': {
            state.setModeTranslate();
            break;
        }
        case 's': {
            state.setModeScale();
            break;
        }
        case 'r': {
            state.setModeRotate();
            break;
        }
        case 'Escape': {
            state.setModeNone();
            break;
        }
    }
};

window.addEventListener('keyup', (event) => {
    event.stopPropagation();
    event.preventDefault();
    setEventKey(event.key);
}, false);

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
</template>

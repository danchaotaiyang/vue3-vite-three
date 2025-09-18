<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Cable } from './Cable.js';
import { MonacoEditor } from '@/components/monaco-editor';
import dayjs from 'dayjs';


const containerRef = ref();
const { innerWidth, innerHeight } = window;

/*  基本场景 | Basic scene
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    场景(Scene)、相机(Camera)、渲染器(WebGLRenderer)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .001, 10000);
camera.position.set(380, 120, -100);

let renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

let css2dRenderer = new CSS2DRenderer();
css2dRenderer.setSize(innerWidth, innerHeight);

let controls = new OrbitControls(camera, renderer.domElement);
controls.update();

/*  生命周期 | Lifecycle
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗

    挂载(webglMounted)、更新(webglUpdate)、监听视图大小变化(webglResize)、销毁(webglUnmounted)

╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
*/

const webglMounted = () => {
    if (renderer) {
        containerRef.value.appendChild(renderer.domElement);
        renderer.render(scene, camera);
    }
    if (css2dRenderer) {
        let element = css2dRenderer.domElement;
        element.classList.add('css-render');
        containerRef.value.appendChild(element);
        css2dRenderer.render(scene, camera);
    }
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
    if (css2dRenderer) {
        css2dRenderer.render(scene, camera);
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
    if (css2dRenderer) {
        css2dRenderer.setSize(innerWidth, innerHeight);
    }
};

const webglEvents = () => {
    events();
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
    window.removeEventListener('resize', webglResize);
};

onMounted(() => {
    webglMounted();
    webglUpdate();
    webglEvents();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);

/*  效果合成
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
    效果合成
══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
*/

scene.add(new THREE.AxesHelper(50));

const gltfLoader = new GLTFLoader();

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

let geometryGround = new THREE.PlaneGeometry(10000, 10000);
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
meshGround = null;

const fileRef = ref(null);
const types = ref([
    'Node',
    'Link',
    'Data'
]);
const index = ref(0);
const nodes = ref([]);
const links = ref([]);
const json = ref('');
const filterOrigin = ref('');
const filterDestination = ref('');
const pathRef = ref([]);

const nodesRef = computed(() => {
    return nodes.value.filter(d => {

        let origin = false;
        if (filterOrigin.value) {
            origin = d.name.includes(filterOrigin.value);
        }

        let destination = false;
        if (filterDestination.value) {
            destination = d.name.includes(filterDestination.value);
        }

        if (filterOrigin.value && filterDestination.value) {
            return filterOrigin.value && filterDestination.value && (origin || destination);
        } else {
            return true;
        }
    });
});

const linksRef = computed(() => {
    return links.value.filter(d => {

        let origin = false;
        if (filterOrigin.value) {
            origin = d.name.includes(filterOrigin.value);
        }

        let destination = false;
        if (filterDestination.value) {
            destination = d.name.includes(filterDestination.value);
        }

        if (filterOrigin.value && filterDestination.value) {
            return filterOrigin.value && filterDestination.value && (origin || destination);
        } else {
            return true;
        }
    });
});

const pathInfo = computed(() => {

    let count = pathRef.value.length;
    let total = pathRef.value.reduce((c, n) => c + n.length, 0);

    return `途径 ${ count } 条管沟，总长约 ${ total }`;
});

let cable = null;
let glb = null;
let mtl = null;
let obj = null;
let color = {
    'public_mtl_cableBridge': '#E7E3BF',
    'public_mtl_cableBridge.001': '#E7E3BF',
    'public_mtl_cableChute': '#FFBA33',
    'public_mtl_cableChute.001': '#FFBA33',
    'public_mtl_cableChute.002': '#FFBA33',
    'public_mtl_cableWell': '#91A6C1'
};

const eventCableFile = async (file) => {

    if (fileRef.value) {
        if (cable) {
            cable.dispose();
        }
    }

    if (file) {

        let { name } = file;
        let [ , type ] = name.split('.');

        switch (type) {
            case 'glb': {
                glb = file;
                break;
            }
            case 'mtl': {
                mtl = file;
                break;
            }
            case 'obj': {
                obj = file;
                break;
            }
        }

        if (glb) {

            let url = URL.createObjectURL(file);
            let model = await gltfLoader.loadAsync(url);

            fileRef.value = file.name;
            model.scene.updateWorldMatrix(true, true);

            setCableModel(model.scene);
        }

        if (mtl && obj) {

            let mtlUrl = URL.createObjectURL(mtl);
            let objUrl = URL.createObjectURL(obj);

            new MTLLoader().load(mtlUrl, (__mtl__) => {

                __mtl__.preload();

                Object.values(__mtl__.materials).map(d => {

                    let { name, isMaterial, color } = d;

                    if (isMaterial && color.isColor) {
                        color[ name ] = color.getHexString();
                    }
                });

                let objLoader = new OBJLoader();
                objLoader.setMaterials(__mtl__);

                objLoader.load(objUrl, (__obj__) => {

                    fileRef.value = obj.name;
                    setCableModel(__obj__);
                });
            });
        }
    }
};

const setCableModel = (model) => {

    let element = containerRef.value;
    cable = new Cable({
        scene, camera, model, element, opacity: .9
    });

    nodes.value = cable.nodes;
    links.value = cable.links;

    let jsonData = cable.links.map((d) => {
        return {
            name: d.name,
            links: d.links.map(d => {
                return {
                    name: d.name,
                    weight: d.weight
                };
            })
        };
    });

    json.value = JSON.stringify(jsonData, null, 4);

    cable.onPathChange = (path) => {
        pathRef.value = path;
    };
};

const eventTable = (idx) => {
    index.value = idx;
};

const eventCableHover = (node) => {
    cable.hover(node.name);
};

const eventCableLeave = (node) => {
    cable.leave(node.name);
};

const eventCheckCable = (node) => {
    cable.check(node.name);
};

const eventDownloadJson = () => {

    let blob = new Blob([ json.value ], { type: 'application/json' });
    let url = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = url;
    link.download = `${ fileRef.value }-${ dayjs().format('YYYYMMDDHHmmss') }.json`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    blob = null;
    url = null;
    link = null;
};

const events = () => {

    containerRef.value.addEventListener('dblclick', (e) => {

        e.preventDefault();
        e.stopPropagation();

        const selection = window.getSelection();

        if (selection) {
            selection.removeAllRanges();
        }
    }, false);

    containerRef.value.addEventListener('dragenter', (e) => {

        e.preventDefault();
        e.stopPropagation();
    }, false);

    containerRef.value.addEventListener('dragover', (e) => {

        e.preventDefault();
        e.stopPropagation();
    }, false);

    containerRef.value.addEventListener('drop', (e) => {

        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files.length) {
            for (const file of e.dataTransfer.files) {
                eventCableFile(file);
            }
        }
    }, false);

    containerRef.value.addEventListener('dragleave', (e) => {

        e.preventDefault();
        e.stopPropagation();
    }, false);
};

const update = () => {
    if (cable) {
        cable.update();
    }
};

window.addEventListener('keyup', (event) => {

    if (event.key === 'Escape') {

        filterOrigin.value = '';
        filterDestination.value = '';

        if (cable) {
            cable.clean();
        }
    }
});

</script>

<template>
<div ref="containerRef" class="fullscreen"></div>
<div v-show="fileRef" :style="{ width: index === 2 ? '660px' : '300px' }" class="cable-data">
    <div class="cable-model">
        {{ fileRef }}
    </div>
    <div class="cable-tab">
        <div v-for="(item, idx) in types" :key="idx" :class="{ active: index === idx }" class="cable-tab-item" @click.stop="eventTable(idx)">{{ item }}</div>
    </div>
    <div v-show="index < 2" class="cable-filter">
        <el-input v-model="filterOrigin" clearable placeholder="管沟名称">
            <template #prepend>起点</template>
        </el-input>
        <el-input v-model="filterDestination" clearable placeholder="管沟名称">
            <template #prepend>终点</template>
        </el-input>
    </div>
    <div class="cable-list">
        <div class="cable-list-inner">
            <div v-if="index === 0" class="cable-list-item cable-nodes">
                <el-scrollbar always>
                    <ul>
                        <li v-for="(item, index) in nodesRef" :key="index" :style="{ background: `${ item.color }` }" @click.stop="eventCheckCable(item)" @mouseover.stop="eventCableHover(item)" @mouseleave.stop="eventCableLeave(item)">
                            <span>{{ item.name }}</span> <i :style="{ background: `${ item.materialColor }` }"></i>
                        </li>
                    </ul>
                </el-scrollbar>
            </div>
            <div v-if="index === 1" class="cable-list-item cable-links">
                <el-scrollbar always>
                    <dl v-for="item in linksRef" :style="{ background: `${ item.color }` }" @click.stop="eventCheckCable(item)" @mouseover.stop="eventCableHover(item)" @mouseleave.stop="eventCableLeave(item)">
                        <dt>{{ item.name }}</dt>
                        <dd v-for="d in item.links" :style="{ background: `${ d.color }` }">{{ d.name }} <br> {{ d.weight }}</dd>
                    </dl>
                </el-scrollbar>
            </div>
            <div v-if="index === 2" class="cable-list-item cable-json">
                <div class="cable-editor">
                    <div class="editor">
                        <monaco-editor v-model="json" language="json"></monaco-editor>
                    </div>
                </div>
                <div class="cable-json-download">
                    <el-button type="primary" @click.stop="eventDownloadJson">导出</el-button>
                </div>
            </div>
        </div>
    </div>
</div>
<div v-show="pathRef.length" class="cable-path">
    <div class="cable-info">
        {{ pathInfo }}
    </div>
    <div class="cable-list">
        <div class="cable-list-inner">
            <div class="cable-list-item cable-nodes">
                <el-scrollbar always>
                    <ul>
                        <li v-for="(item, index) in pathRef" :key="index" :style="{ background: `${ item.color }` }" @mouseover.stop="eventCableHover(item)" @mouseleave.stop="eventCableLeave(item)">
                            <i :style="{ background: `${ item.materialColor }` }"></i><span>{{ item.name }}</span>
                        </li>
                    </ul>
                </el-scrollbar>
            </div>
        </div>
    </div>
</div>
<div class="cable-tip">
    拖拽模型文件到浏览器中
</div>
</template>

<style lang="scss" scoped>
.cable-list {
    position: relative;
    flex: 1;
    line-height: 1.1;

    .cable-list-inner {
        position: absolute;
        top: 0;
        right: 1px;
        bottom: 1px;
        left: 1px;
        border: 1px solid #fff;
        border-top: none;
    }

    .cable-list-item {
        position: absolute;
        top: 1px;
        right: 1px;
        bottom: 1px;
        left: 1px;

        ul {
            list-style: none;
            margin: 0;
            padding: 0;

            li {
                display: flex;
                align-items: center;
                margin: 0 0 1px;
                padding: 3px;
                cursor: pointer;
            }

            strong {
                display: inline-block;
                width: 30px;
                margin: 0 4px 0 0;
                text-align: center;
            }

            i {
                display: inline-block;
                width: 7px;
                height: 7px;
                margin: 0 3px;
                border: 1px solid rgba(0, 0, 0, .5);
                border-radius: 50%;
            }
        }

        dl {
            margin: 0 0 1px;
            cursor: pointer;

            dt {
                padding: 8px;
                font-weight: bold;
            }

            dd {
                padding: 2px;
                border-top: 1px solid rgba(0, 0, 0, .3);
                border-left: 1px solid rgba(0, 0, 0, .3);
            }
        }
    }
}

.cable-data {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    background: rgba(0, 0, 0, 0.5);
    line-height: 1;

    .cable-model {
        margin: 1px;
        padding: 10px;
        background: rgba(255, 255, 255, .9);
        text-align: center;
    }

    .cable-tab {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        margin: 0 1px;
        background: rgba(255, 255, 255, .9);
        text-align: center;
        line-height: 1;

        .cable-tab-item {
            position: relative;
            flex: 1;
            padding: 4px 0;
            cursor: pointer;
            border-top: 4px solid transparent;
            border-bottom: 4px solid transparent;

            &.active {
                border-bottom-color: var(--three-blue-main);
            }
        }
    }

    .cable-filter {
        margin: 1px 1px 0;

        .el-input {
            &:first-child {
                border-bottom: 1px solid rgba(255, 255, 255, .7);
            }
        }
    }

    ul {
        li {
            justify-content: space-between;
        }
    }

    .cable-json {
        display: flex;
        flex-direction: column;
    }

    .cable-editor {
        position: relative;
        flex: 1;

        .editor {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
        }
    }

    .cable-json-download {
        display: flex;
        justify-content: end;
        padding: 8px;
    }
}

.cable-path {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    width: 400px;
    background: rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    line-height: 1.1;

    .cable-info {
        margin: 1px 1px 0;
        padding: 10px;
        background: rgba(255, 255, 255, .95);
        text-align: center;
    }
}

.cable-tip {
    position: fixed;
    top: 5px;
    right: 50%;
    display: flex;
    justify-content: center;
    padding: 8px;
    background: rgba(0, 0, 0, .7);
    line-height: 1;
    color: #ffffff;
    border-radius: 3px;
    transform: translateX(50%);
    pointer-events: none;
}
</style>

<style lang="scss">
.css-render {
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
}

.cable-label-inner {
    position: relative;
    padding: 3px;
    background: rgba(0, 0, 0, .7);
    line-height: 1;
    color: #ffffff;
    transform: translateY(-30px);

    .cable-label-arrow {
        position: absolute;
        top: 100%;
        right: 50%;
        border: 6px solid transparent;
        border-top-color: rgba(0, 0, 0, .7);
        transform: translateY(-.5px);
    }
}

.cable-filter {
    .el-input {
        .el-input__wrapper,
        .el-input-group__append,
        .el-input-group__prepend {
            border-radius: 0;
            box-shadow: none;
        }

        .el-input-group__prepend {
            border-right: 1px solid rgba(0, 0, 0, .05);
        }
    }
}
</style>
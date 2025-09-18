import * as THREE from 'three';
import { ref } from 'vue';
import { Dijkstra } from '@/utils/Dijkstra.js';
import { Duct } from './Duct.js';
import { base } from '@/config.js';


let textureLoader = new THREE.TextureLoader();
textureLoader.setPath(`${ base }/static/example/others/cable-duct/textures/`);

let textureDirection = textureLoader.load(`direction.png`);
textureDirection.wrapS = THREE.RepeatWrapping;
textureDirection.wrapT = THREE.RepeatWrapping;
textureDirection.repeat.y = 4;

export class Cable {

    meshes = [];

    nodes = [];

    links = [];

    pick = [];

    pickRef = ref([]);

    path = [];

    pathRef = ref([]);

    #color = {
        pick: '#ff46da',
        path: '#00ff00',
        node: '#ff0000',
        next: '#ffff00'
    };

    #pathChange = null;

    constructor(option) {

        this.option = option;

        if (option.scene) {
            this.scene = option.scene;
        }

        if (option.camera) {
            this.camera = option.camera;
        }

        if (option.model) {
            this.model = option.model;
        }

        if (option.element) {
            this.element = option.element;
        }

        this.#initial();
    }

    #initial() {

        if (this.model) {
            this.#load();
        }

        if (this.element) {
            this.#setEvent();
        }
    }

    #load() {

        this.model.traverse((d) => {

            if (!d.isMesh) {
                return;
            }

            let color = `#${ d.material.color.getHexString() }`;

            if (typeof this.option.color === 'function') {
                color = this.option.color(d);
            }

            if (typeof this.option.color === 'object') {
                color = this.option.color[ d.material.name ];
            }

            if (!color) {
                if(!d.material.name) {
                    console.group('材质未命名物体');
                    console.log(`name: "${ d.name }"`);
                    console.groupEnd();
                } else {
                    console.group('材质名称未知');
                    console.log(`name: "${ d.name }"`);
                    console.log(`material: "${ d.material.name }"`);
                    console.groupEnd();
                }
            }

            let node = new Duct(d, {
                color,
                opacity: this.option.opacity
            });

            this.meshes.push(d);
            this.nodes.push(node);
        });

        this.scene.add(this.model);
        this.links = this.getLinks();
    }

    getLinks() {

        let links = [];

        for (const d of this.nodes) {

            let link = { name: d.name, color: d.color };
            let next = this.#getIntersects(d);

            if (Array.isArray(next)) {
                link.links = next.map(n => {
                    return {
                        name: n.name,
                        weight: n.length,
                        color: n.color
                    };
                });
            }

            links.push(link);

            link = null;
            next = null;
        }

        return links;
    }

    #getMesh(data) {

        let result = null;

        if (data.isNode) {
            result = data.mesh;
        }

        if (data.isMesh) {
            result = data;
        }

        if (typeof data === 'string' && data !== '') {
            result = this.scene.getObjectByName(data);
        }

        return result;
    }

    #getNode(data) {

        let result = null;

        if (data.isNode) {
            result = data;
        }

        if (data.isMesh) {
            result = data.node;
        }

        if (typeof data === 'string' && data !== '') {
            result = this.nodes.find(d => d.name === data);
        }

        return result;
    }

    #getIntersects(data) {

        let node = this.#getNode(data);

        if (!node) {
            return;
        }

        let result = [];

        for (const target of this.nodes) {
            if (node.name === target.name) {
                continue;
            }
            if (node.isIntersects(target)) {
                result.push(target);
            }
        }

        return result;
    }

    #setColor(data, value, opacity) {

        let node = this.#getNode(data);

        if (typeof value === 'undefined') {
            value = node.color.value;
        }

        node.materialColor = value;
        node.materialOpacity = opacity;

        node = null;
    }

    #addLabel(data) {

        let node = this.#getNode(data);

        if (!node || node.userData('isChecked')) {
            return;
        }

        this.scene.add(node.label);
    }

    #removeLabel(data) {

        let node = this.#getNode(data);

        if (!node) {
            return;
        }

        if (node.label) {
            this.scene.remove(node.label);
        }
    }

    #addHelp(data) {

        let node = this.#getNode(data);

        this.scene.add(node.helper);
    }

    #removeHelp(data) {

        let node = this.#getNode(data);

        this.scene.remove(node.helper);
    }

    #addLine(data) {

        let node = this.#getNode(data);

        if (!node || !node.isNode) {
            return;
        }

        this.scene.add(node.line);
    }

    #removeLine(data) {

        let node = this.#getNode(data);

        if (!node || !node.isNode) {
            return;
        }

        this.scene.remove(node.line);
    }

    #reset() {

        this.pick = [];
        this.pickRef.value = [];
        this.path = [];
        this.pathRef.value = [];

        for (const node of this.nodes) {

            node.reset();

            this.#removeLabel(node);
            this.#removeHelp(node);
            this.#removeLine(node);

            if (node.tube) {
                this.scene.remove(node.tube);
            }
        }

        if (typeof this.#pathChange === 'function') {
            this.#pathChange();
        }
    }

    #setPick(data) {

        let node = this.#getNode(data);

        if (this.pick.length === 2) {
            return;
        }

        if (this.pick.includes(node.name)) {
            return;
        }

        this.pick.push(node.name);
        this.pickRef.value.push(node);

        this.#addLabel(node);
        // this.#addHelp(node);
        this.#setColor(node, this.#color.pick);

        node.userData('isChecked', true);

        if (this.pick.length === 2) {
            this.#pathfinding();
        }

    }

    #pathfinding() {

        let links = this.getLinks();

        let names = links.map(node => node.name);

        let [ first, last ] = this.pick;

        const dijkstraObject = new Dijkstra(links, first, last);

        if (!names.includes(first) || !names.includes(last)) {
            return;
        }

        dijkstraObject.start = first;
        dijkstraObject.end = last;

        this.path = dijkstraObject.calculate();

        if (this.path.length === 1) {
            return;
        }

        this.#setPath();

        if (typeof this.#pathChange === 'function') {
            this.#pathChange();
        }
    }

    #setTube(node) {

        let { length } = node;
        let curvePoints = node.userData('curvePoints');

        let textTube = textureDirection.clone();
        textTube.repeat.x = Math.max(1, Math.ceil(length / 2));

        let curve = new THREE.CatmullRomCurve3(curvePoints);
        let geometryTube = new THREE.TubeGeometry(curve, 200, .5, 4, false);
        let materialTube = new THREE.MeshPhongMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            map: textTube,
            combine: THREE.MultiplyBlending,
            color: 0xff0000
        });

        let meshTube = new THREE.Mesh(geometryTube, materialTube);
        node.tube = meshTube;

        this.scene.add(node.tube);

        node = null;
        geometryTube.dispose();
        geometryTube = null;
        materialTube.dispose();
        materialTube = null;
        textTube.dispose();
        textTube = null;
        meshTube = null;
    }

    #setPath() {

        for (let i = 0; i < this.path.length; i++) {

            let path = this.path[ i ];
            let node = this.#getNode(path);
            let points = node.extremeVertex.map(d => new THREE.Vector3(d.x, d.y, d.z));
            let color = this.pick.includes(node.name) ? this.#color.pick : this.#color.path;

            if (i > 0) {

                let prev = this.#getNode(this.path[ i - 1 ]);
                let prevCurvePoints = prev.userData('curvePoints');

                points.sort((a, b) => a.distanceTo(prevCurvePoints[ 1 ]) - b.distanceTo(prevCurvePoints[ 1 ]));
            } else {

                let next = this.#getNode(this.path[ i + 1 ]);
                let nearestIndex = 0;
                let minDistance = Infinity;

                for (let x = 0; x < next.extremeVertex.length; x++) {

                    for (let y = 0; y < points.length; y++) {

                        const distance = next.extremeVertex[ x ].distanceTo(points[ y ]);

                        if (distance < minDistance) {

                            minDistance = distance;
                            nearestIndex = y;
                        }
                    }
                }

                if (nearestIndex === 0) {
                    points.reverse();
                }
            }

            node.userData('curvePoints', points);

            this.#setTube(node);
            this.#setColor(node, color, .3);
            this.#addLabel(node);
            this.#addHelp(node);
            this.#addLine(node);

            node.userData('isChecked', true);

            this.pathRef.value.push(node);
        }
    }

    #eventClick(event) {

        let { width, height } = this.element.getBoundingClientRect();

        let mouse = new THREE.Vector2();
        mouse.x = (event.layerX / width) * 2 - 1;
        mouse.y = -(event.layerY / height) * 2 + 1;

        let rayCaster = new THREE.Raycaster();
        rayCaster.setFromCamera(mouse, this.camera);

        let intersects = rayCaster.intersectObjects(this.meshes);
        if (intersects.length) {
            this.#setPick(intersects[ 0 ].object.name);
        }

        intersects = null;
        rayCaster = null;
        mouse = null;

    }

    #setEvent() {

        this.element.addEventListener('click', (event) => {
            this.#eventClick(event);
        }, false);

        this.element.addEventListener('dblclick', () => {
            this.#reset();
        }, false);

    }

    //────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    update() {
        for (const p of this.path) {
            let node = this.#getNode(p);
            if (node.tube) {
                node.tube.material.map.offset.x -= .0076;
            }
        }
    }

    set onPathChange(fn) {
        if (typeof fn === 'function') {
            this.#pathChange = () => fn(this.pathRef.value);
        }
    }

    clean() {
        this.#reset();
    }

    dispose() {

        this.clean();

        this.scene.remove(this.model);

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });

        this.meshes = [];
        this.model = [];
        this.nodes = [];
        this.links = [];
        this.pick = [];
        this.pickRef.value = [];
        this.path = [];
        this.pathRef.value = [];
    }

    pointHelper(add = true) {

        let meshPoints;
        if (!add) {
            meshPoints = this.#getMesh('pointHelper');
            if (meshPoints && meshPoints.isPoints) {
                this.scene.remove(meshPoints);
            }
            return;
        }

        let nodes = this.nodes;
        let positions = new Float32Array(nodes.length * 3);

        for (let i = 0; i < nodes.length; i++) {
            let { x, y, z } = nodes[ i ].center;
            let idx = i * 3;
            positions[ idx ] = x;
            positions[ idx + 1 ] = y;
            positions[ idx + 2 ] = z;
        }

        let geometryPoint = new THREE.BufferGeometry();
        geometryPoint.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        let materialPoint = new THREE.PointsMaterial();
        materialPoint.color = new THREE.Color(0x00ffff);
        materialPoint.size = 4;

        meshPoints = new THREE.Points(geometryPoint, materialPoint);
        meshPoints.name = 'pointHelper';
        this.scene.add(meshPoints);

        positions = null;
        geometryPoint.dispose();
        geometryPoint = null;
        materialPoint.dispose();
        materialPoint = null;
        meshPoints = null;

    }

    hover(data) {

        let node = this.#getNode(data);

        if (!node) {
            return;
        }

        this.#setColor(node, this.#color.node);

        if (!this.pick.includes(node.name)) {
            this.#addLabel(node);
            this.#addHelp(node);
        }

        let nodeNext = this.#getIntersects(node);

        for (const next of nodeNext) {

            this.#setColor(next, this.#color.next);

            if (!this.path.includes(next.name)) {

                this.#addLabel(next);
                this.#addHelp(next);
            }
        }

        node = null;
        nodeNext = null;
    }

    leave(data) {

        let node = this.#getNode(data);

        if (!node) {
            return;
        }

        let nextMesh = this.#getIntersects(node);
        let collection = [ node, ...nextMesh ];

        for (const d of collection) {

            if (this.pick.includes(d.name)) {

                this.#setColor(d, this.#color.pick, .2);
                continue;
            }

            if (this.path.includes(d.name)) {

                this.#setColor(d, this.#color.path, .2);
                continue;
            }

            this.#setColor(d);
            this.#removeLabel(d);
            this.#removeHelp(d);
        }

        node = null;
        nextMesh = null;
        collection = null;
    }

    check(data) {
        this.#setPick(data);
    }

    findPath(names) {
        if (!Array.isArray(names)) {
            if (typeof names === 'string' && names !== '') {
                names = names.split(',');
            } else {
                names = [ names ];
            }
        }
        for (const name of names) {
            this.#setPick(name);
        }
    }
}
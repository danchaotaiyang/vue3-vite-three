import * as THREE from 'three';
import { ref } from 'vue';
import { createConvexHull, createConvexHullHelper, createOBB } from '@/utils/YukaUtils.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';


const vertex = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

varying vec2 vUv;

void main() {

    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

}
`;

const fragment = `
precision highp float;

uniform float uTime;

varying vec2 vUv;

vec2 rotate(vec2 uv, float rotation, vec2 mid) {
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

void main() {

      float x = step(.3, mod((rotateUv.x + uTime * .05) * 10.0, 1.0)) * step(.85, mod((rotateUv.y + uTime * .05) * 10.0, 1.0));
      float y = step(.3, mod((rotateUv.y + uTime * .05) * 10.0, 1.0)) * step(.85, mod((rotateUv.x + uTime * .05) * 10.0, 1.0));
      float n = x + y;
      gl_FragColor = vec4(rotateUv, 1.0, n);

}
`;

const createLabel = (name, center) => {

    let labelInner = document.createElement('div');
    labelInner.className = 'cable-label-inner';
    labelInner.innerText = name;

    let labelLine = document.createElement('div');
    labelLine.className = 'cable-label-arrow';
    labelInner.appendChild(labelLine);

    let label = document.createElement('div');
    label.className = 'cable-label';
    label.appendChild(labelInner);

    let labelObject = new CSS2DObject(label);
    labelObject.position.set(center.x, center.y, center.z);

    return labelObject;
}


export class Duct {

    name = '';

    colorOriginalRef = ref('');

    colorMaterialRef = ref('');

    opacityOriginal = 1;

    constructor(mesh, option = {}) {

        let { color, opacity } = option;

        if (typeof color === 'string') {
            this.colorOriginalRef.value = color;
        }

        if (!isNaN(Number(opacity))) {
            this.opacityOriginal = opacity;
        }

        if (!mesh.isMesh) {
            mesh = new THREE.Mesh();
        }

        mesh.updateWorldMatrix(true, true);

        mesh.material = new THREE.MeshStandardMaterial({
            name: mesh.material.name,
            transparent: true,
            color: this.colorOriginalRef.value,
            opacity: this.opacityOriginal,
        });

        mesh.node = this;

        this.name = mesh.name;
        this.mesh = mesh;
        this.obb = createOBB(mesh);
        this.convexHull = createConvexHull(mesh);
        this.label = createLabel(this.name, this.center);
        this.helper = createConvexHullHelper(this.convexHull);
    }

    get isNode() {
        return this === this.mesh.node;
    }

    get center() {
        return this.convexHull.centroid;
    }

    get length() {

        let { x, y, z } = this.obb.getSize(new THREE.Vector3());

        return Math.max(x, y, z);
    }

    get state() {
        return this.mesh.userData;
    }

    get color() {
        return this.colorOriginalRef;
    }

    set color(value) {
        this.colorOriginalRef.value = value;
        this.materialColor = value;
    }

    get materialColor() {
        return this.colorMaterialRef;
    }

    set materialColor(value) {
        this.colorMaterialRef.value = value;
        this.mesh.material.color.set(value);
    }

    set materialOpacity(value) {

        if (isNaN(Number(value))) {
            value = this.opacityOriginal;
        }

        this.mesh.material.opacity = value;
    }

    reset() {

        this.mesh.userData = {};

        let color = this.colorOriginalRef.value;

        if (typeof color === 'string' && color) {

            this.colorMaterialRef.value = color;
            this.mesh.material.color.set(color);
            this.mesh.material.opacity = this.opacityOriginal;
        }
    }

    userData(key, value) {

        let { userData } = this.mesh;

        if (typeof value === 'undefined') {
            return userData[ key ];
        }

        userData[ key ] = value;
    }

    isIntersects(b) {
        return this.convexHull.intersectsConvexHull(b.convexHull);
    }

    get extremeVertex() {

        let centroids = this.convexHull.faces.map(d => d.centroid);

        let maxDistance = 0;
        let pointA = null;
        let pointB = null;

        for (let i = 0; i < centroids.length; i++) {

            for (let j = i + 1; j < centroids.length; j++) {

                const distance = centroids[ i ].distanceTo(centroids[ j ]);

                if (distance > maxDistance) {

                    maxDistance = distance;

                    pointA = centroids[ i ];
                    pointB = centroids[ j ];
                }
            }
        }

        return [ pointA, pointB ];
    }

    get radius() {

        let centroids = this.convexHull.faces.map(d => d.centroid);

        let maxDistance = 0;
        let pointA = null;
        let pointB = null;

        for (let i = 0; i < centroids.length; i++) {

            for (let j = i + 1; j < centroids.length; j++) {

                const distance = centroids[ i ].distanceTo(centroids[ j ]);

                if (distance > maxDistance) {

                    maxDistance = distance;

                    pointA = centroids[ i ];
                    pointB = centroids[ j ];
                }
            }
        }

        return [ pointA, pointB ];
    }

    get line() {

        if (this.centralLine) {
            return this.centralLine;
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(this.extremeVertex);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 });

        let line = new THREE.Line(geometry, material);

        this.centralLine = line;

        return line;
    }
}

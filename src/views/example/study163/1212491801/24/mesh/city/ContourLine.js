import * as THREE from 'three';


export default class ContourLine {

    constructor(mesh, color) {
        this.geometry = new THREE.EdgesGeometry(mesh.geometry);
        this.material = new THREE.LineBasicMaterial({ color });
        this.mesh = new THREE.LineSegments(this.geometry, this.material);
    }
}


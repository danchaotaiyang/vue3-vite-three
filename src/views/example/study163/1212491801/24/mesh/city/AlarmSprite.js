import * as THREE from 'three';
import { textureLoader } from '../../module/loaders.js';
import camera from '../../module/camera.js';


export default class AlarmSprite {

    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    callbacks = [];

    constructor(data) {
        this.data = data;
        this.setGeometry();
        this.setMaterial();
        this.setMesh();
        this.setEvent();
    }

    setGeometry() {
        this.geometry = new THREE.PlaneGeometry(this.data.size, this.data.size, 1, 1);
    }

    setMaterial() {
        this.material = new THREE.SpriteMaterial({ map: textureLoader.load(this.data.icon) });
    }

    setMesh() {
        this.mesh = new THREE.Sprite(this.material);
        this.mesh.position.set(this.data.position.x, this.data.position.y, this.data.position.z);
    }

    setEvent() {
        window.addEventListener('click', (event) => {

            event.mesh = this.mesh;
            event.data = this.data;

            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -((event.clientY / window.innerHeight) * 2 - 1);

            this.raycaster.setFromCamera(this.mouse, camera);
            const intersects = this.raycaster.intersectObject(this.mesh);

            if (intersects.length > 0) {
                this.callbacks.forEach(callback => callback(event));
            }
        });
    }

    onClick(callback) {
        this.callbacks.push(callback);
    }
}

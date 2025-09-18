import * as THREE from 'three';
import { gsap } from 'gsap';
import { textureLoader } from '../../module/loaders.js';


export default class FlyLine {

    constructor(data) {
        this.data = data;
        this.setGeometry();
        this.setTexture();
        this.setMaterial();
        this.setMesh();
        this.setAnimation();
    }

    setGeometry() {
        let linePoints = this.data.points.map(d => new THREE.Vector3(d[ 0 ], d[ 1 ], d[ 2 ]));
        this.lineCurve = new THREE.CatmullRomCurve3(linePoints);

        this.geometry = new THREE.TubeGeometry(this.lineCurve, 100, .5, 2);
    }

    setTexture() {
        let texture = textureLoader.load(this.data.texture);
        texture.repeat.set(1, 2);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        this.texture = texture;
    }

    setMaterial() {
        this.material = new THREE.MeshBasicMaterial({
            transparent: true,
            map: this.texture
        });
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
    
    setAnimation() {
        gsap.to(this.texture.offset, {
            x: -1,
            duration: 3,
            repeat: -1,
            ease: 'none',
        });
    }
}

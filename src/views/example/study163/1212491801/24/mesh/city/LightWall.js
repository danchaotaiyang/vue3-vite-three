import * as THREE from 'three';
import { gsap } from 'gsap';
import LightWallVertex from './LightWallVertex.glsl?raw';
import LightWallFragment from './LightWallFragment.glsl?raw';


export default class LightWall {
    constructor(data) {
        this.data = data;
        this.setGeometry();
        this.setMaterial();
        this.setMesh();
        this.setAnimation();
    }

    setGeometry() {
        this.geometry = new THREE.CylinderGeometry(this.data.radius, this.data.radius, this.data.height, 32, 1, true);  
        this.geometry.computeBoundingBox();
    }

    setMaterial() {
        let { min, max } = this.geometry.boundingBox;
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: LightWallVertex,
            fragmentShader: LightWallFragment,
            uniforms: {
                uColor: {
                    value: this.data.color
                },
                uHeight: {
                    value: max.y - min.y
                }
            }
        });
  }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(this.data.position.x, this.data.position.y, this.data.position.z);
    }

    setAnimation() {
        gsap.to(this.mesh.scale, {
            duration: 1,
            ease: 'none',
            repeat: -1,
            yoyo: true,
            x: 2,
            z: 2
        });
    }
}

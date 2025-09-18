import * as THREE from 'three';
import { gsap } from 'gsap';
import LightRadarVertex from './LightRadarVertex.glsl?raw';
import LightRadarFragment from './LightRadarFragment.glsl?raw';


export default class LightRadar {
    constructor(data) {
        this.data = data;
        this.setGeometry();
        this.setMaterial();
        this.setMesh();
        this.setAnimation();
    }

    setGeometry() {
        this.geometry = new THREE.PlaneGeometry(this.data.size, this.data.size, 1, 1);  
    }

    setMaterial() {
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: LightRadarVertex,
            fragmentShader: LightRadarFragment,
            uniforms: {
                uColor: {
                    value: this.data.color
                },
                uTime: { 
                    value: 0.0 
                }
            }
        });
  }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(this.data.position.x, this.data.position.y, this.data.position.z);
    }

    setAnimation() {
        gsap.to(this.material.uniforms.uTime, {
            duration: 1,
            ease: 'none',
            repeat: -1,
            value: 1
        });
    }
}

import * as THREE from 'three';
import { gsap } from 'gsap';
import vertex from './FlyLineShaderVertex.glsl?raw';
import fragment from './FlyLineShaderFragment.glsl?raw';


export default class FlyLineShader {

    constructor(data) {
        this.data = data;
        this.setGeometry();
        this.setMaterial();
        this.setMesh();
        this.setAnimation();
    }

    setGeometry() {

        let linePoints = this.data.points.map(d => new THREE.Vector3(d[0], d[1], d[2]));
        this.lineCurve = new THREE.CatmullRomCurve3(linePoints);
        this.points = this.lineCurve.getPoints(1000);
        this.geometry = new THREE.BufferGeometry().setFromPoints(this.points);

        const aSize = new Float32Array(this.points.length);
        for (let i = 0; i < aSize.length; i++) {
            aSize[i] = i;
        }
        this.geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    }

    setMaterial() {
        this.ShaderMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: vertex,
            fragmentShader: fragment,
            uniforms: {
                uTime: { value: 0.0 },
                uLength: { value: this.points.length },
                uColor: { value: new THREE.Color(this.data.color) },
            }
        })
    }

    setMesh() {
        this.mesh = new THREE.Points(this.geometry, this.ShaderMaterial);
    }

    setAnimation() {
        gsap.to(this.ShaderMaterial.uniforms.uTime, {
            duration: 3,
            repeat: -1,
            ease: 'none',
            value: 1000
        });
    }
}

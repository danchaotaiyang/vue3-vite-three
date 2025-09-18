import * as THREE from 'three';
import fragmentShaderFire from './shader/fire/fragment.glsl?raw';
import vertexShaderFire from './shader/fire/vertex.glsl?raw';
import fragmentShaderPoint from './shader/point/fragment.glsl?raw';
import vertexShaderPoint from './shader/point/vertex.glsl?raw';


export default class Fireworks {

    clock = new THREE.Clock();

    from = { x: 0, y: 0, z: 0 };

    sound = null;

    constructor(option) {
        let { scene, camera, color, to, from, sound } = option;
        this.scene = scene;
        this.camera = camera;
        this.color = color;
        this.to = to;
        if (from) {
            this.from = from;
        }
        if (sound) {
            this.sound = sound;
        }
        this.generate();
    }

    generate() {
        this.setPoint();
        this.setFire();
        this.setSound();
    }

    setPoint() {

        let { color } = this;
        let geometryPoint = new THREE.BufferGeometry();
        let positionPoint = new Float32Array(3);
        positionPoint[ 0 ] = this.from.x;
        positionPoint[ 1 ] = this.from.y;
        positionPoint[ 2 ] = this.from.z;
        geometryPoint.setAttribute('position', new THREE.BufferAttribute(positionPoint, 3));
        let altitudePoint = new Float32Array(3);
        altitudePoint[ 0 ] = this.to.x - this.from.x;
        altitudePoint[ 1 ] = this.to.y - this.from.y;
        altitudePoint[ 2 ] = this.to.z - this.from.z;
        geometryPoint.setAttribute('altitude', new THREE.BufferAttribute(altitudePoint, 3));
        this.geometryPoint = geometryPoint;

        this.materialPoint = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: vertexShaderPoint,
            fragmentShader: fragmentShaderPoint,
            uniforms: {
                uTime: {
                    value: 0
                },
                uSize: {
                    value: 20
                },
                uColor: {
                    value: new THREE.Color(color)
                }
            }
        });

        this.point = new THREE.Points(this.geometryPoint, this.materialPoint);

        this.scene.add(this.point);

    }

    setFire() {
        let geometryFire = new THREE.BufferGeometry();
        let count = 180 + Math.floor(Math.random() * 180);
        let positionFire = new Float32Array(count * 3);
        let scaleFile = new Float32Array(count);
        let directionFire = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positionFire[ i * 3 ] = this.to.x;
            positionFire[ i * 3 + 1 ] = this.to.y;
            positionFire[ i * 3 + 2 ] = this.to.z;
            scaleFile[ i ] = Math.random();
            let lng = Math.PI * 2 * Math.random();
            let lat = Math.PI * 2 * Math.random();
            let rdi = Math.random();
            directionFire[ i * 3 ] = rdi * Math.sin(lng) + rdi * Math.sin(lat);
            directionFire[ i * 3 + 1 ] = rdi * Math.cos(lng) + rdi * Math.cos(lat);
            directionFire[ i * 3 + 2 ] = rdi * Math.sin(lng) + rdi * Math.cos(lat);
        }
        geometryFire.setAttribute('position', new THREE.BufferAttribute(positionFire, 3));
        geometryFire.setAttribute('scale', new THREE.BufferAttribute(scaleFile, 1));
        geometryFire.setAttribute('direction', new THREE.BufferAttribute(directionFire, 3));
        this.geometryFire = geometryFire;

        let { to, color } = this;
        this.materialFire = new THREE.ShaderMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: vertexShaderFire,
            fragmentShader: fragmentShaderFire,
            uniforms: {
                uTime: {
                    value: 0
                },
                uSize: {
                    value: 0
                },
                uColor: {
                    value: new THREE.Color(color)
                },
                uTo: {
                    value: to
                }
            }
        });

        this.fire = new THREE.Points(this.geometryFire, this.materialFire);

    }

    async setSound() {
        if (!this.sound) {
            return;
        }
        let { send, bloom } = this.sound;
        try {
            const audioLoader = new THREE.AudioLoader();

            let listenerSend = new THREE.AudioListener();
            let soundSend = new THREE.Audio(listenerSend);
            let bufferSend = await audioLoader.loadAsync(send);
            soundSend.setBuffer(bufferSend);
            soundSend.setLoop(false);
            soundSend.setVolume(1);
            this.soundSend = soundSend;

            let listenerBloom = new THREE.AudioListener();
            let soundBloom = new THREE.Audio(listenerBloom);
            let bufferBloom = await audioLoader.loadAsync(bloom);
            soundBloom.setBuffer(bufferBloom);
            soundBloom.setLoop(false);
            soundBloom.setVolume(1);
            this.soundBloom = soundBloom;
        } catch (e) {
            console.warn(e);
        } finally {

        }
    }

    update() {
        let elapsedTime = this.clock.getElapsedTime();
        if (elapsedTime < 1) {
            this.materialPoint.uniforms.uTime.value = elapsedTime;
            if (this.soundSend && !this.soundSend.isPlaying && !this.isSend) {
                this.soundSend.play();
                this.isSend = true
            }
        } else {
            let time = elapsedTime - 1;
            this.materialPoint.uniforms.uSize.value = 0;
            this.geometryPoint.dispose();
            this.materialPoint.dispose();
            this.scene.remove(this.point);
            this.scene.add(this.fire);
            this.materialFire.uniforms.uTime.value = time;
            this.materialFire.uniforms.uSize.value = 20;
            if (this.soundBloom && !this.soundBloom.isPlaying && !this.isBloom) {
                this.soundBloom.play();
                this.isBloom = true;
            }
            if (time > 2) {
                this.materialFire.uniforms.uSize.value = 0;
                this.geometryFire.dispose();
                this.materialFire.dispose();
                this.scene.remove(this.fire);
            }
        }
    }
}
import * as THREE from 'three';


export default function WallShaderMaterial(panorama) {

    let [ point ] = panorama.point;
    let { panoramaUrl, x, y, z } = point;

    x /= 100;
    y /= 100;
    z /= 100;

    let texture = new THREE.TextureLoader().load(panoramaUrl);
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    let center = new THREE.Vector3(x, z, y);

    return new THREE.ShaderMaterial({
        vertexShader: `
        
uniform vec3 uCenter;

varying vec2 vUv;
varying vec3 vPosition;

void main() {

    vUv = uv;
    
    vec4 modelPos = modelMatrix * vec4(position, 1.0);
    vPosition = modelPos.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
        fragmentShader: `

uniform vec3 uCenter;
uniform sampler2D uPanorama;

varying vec2 vUv;
varying vec3 vPosition;

void main() {

    vec3 nPos = normalize(vPosition-uCenter);
    
    float theta = acos(nPos.y) / 3.14;
    float phi = (atan(nPos.z, nPos.x) + 3.14) / 6.28;
    
    vec4 pColor = texture2D(uPanorama, vec2(phi, theta));

    gl_FragColor = pColor;
}
`,
        uniforms: {
            uPanorama: { value: texture },
            uCenter: { value: center }
        }
    });
};

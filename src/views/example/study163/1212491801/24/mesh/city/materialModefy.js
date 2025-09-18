import * as THREE from 'three';
import { gsap } from 'gsap';


export const modifyMaterialCity = (mesh) => {

    mesh.geometry.computeBoundingBox();

    mesh.material.onBeforeCompile = (shader) => {

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            '#include <common>\n\n//#<vertex_common>#\n'
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n\n//#<vertex_begin_vertex>#\n'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            '#include <common>\n\n//#<fragment_common>#'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n\n//#<fragment_begin_vertex>#\n'
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            '#include <dithering_fragment>\n\n//#<fragment_dithering>#\n'
        );

        setGradColor(shader, mesh);
        setSpread(shader, mesh);
        setLightLine(shader);
        setWaistLine(shader, mesh);
    };
};

const setGradColor = (shader, mesh) => {

    let { min, max } = mesh.geometry.boundingBox;

    shader.uniforms.uColorMax = {
        value: new THREE.Color(0xffffff)
    };

    shader.uniforms.uHeight = {
        value: max.y - min.y
    };

    shader.vertexShader = shader.vertexShader.replace(
        '//#<vertex_common>#',
        `varying vec3 vPosition;

    //#<vertex_common>#
        `
    );

    shader.vertexShader = shader.vertexShader.replace(
        '//#<vertex_begin_vertex>#',
        `vPosition = position;

    //#<vertex_begin_vertex>#
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_common>#',
        `uniform vec3 uColorMax;
uniform float uHeight;
varying vec3 vPosition;

//#<fragment_common>#
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_dithering>#',
        `
    vec4 distGradColor = gl_FragColor;
    // float gradMin = (vPosition.y + uHeight / 2.0) / uHeight;
    float gradMin = ((vPosition.y - uHeight / 2.0) + uHeight / 2.0) / uHeight;
    vec3 gradMinColor = mix(distGradColor.xyz, uColorMax, gradMin);
    
    gl_FragColor = vec4(gradMinColor, 1.0);
    
//#<fragment_dithering>#
        `
    );
};

const setSpread = (shader, mesh) => {

    shader.uniforms.uCenterSpread = {
        value: new THREE.Vector3(0, 0, 0)
    };

    shader.uniforms.uRadiusSpread = {
        value: 0
    };

    shader.uniforms.uWidthSpread = {
        value: 1
    };

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_common>#',
        `uniform vec2 uCenterSpread;
uniform float uRadiusSpread;
uniform float uWidthSpread;

//#<fragment_common>#
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_dithering>#',
        `
    float radiusSpread = distance(vPosition.xz, uCenterSpread);
    float indexSpread = -(radiusSpread - uRadiusSpread) * (radiusSpread - uRadiusSpread) + uWidthSpread;
    if (indexSpread > 0.0) {
        gl_FragColor = mix(gl_FragColor, vec4(1, 1, 1, 1), indexSpread / uWidthSpread);
    }
    
    //#<fragment_dithering>#
        `
    );

    let { max } = mesh.geometry.boundingBox;

    gsap.to(shader.uniforms.uRadiusSpread, {
        duration: 10,
        repeat: -1,
        ease: 'none',
        value: Math.max(max.x, max.y, max.z) + 180
    });
};

const setLightLine = (shader) => {

    shader.uniforms.uPositionLight = {
        value: -1000
    };

    shader.uniforms.uWidthLight = {
        value: 1
    };

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_common>#',
        `uniform float uPositionLight;
uniform float uWidthLight;

//#<fragment_common>#
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_dithering>#',
        `
    float indexLight = -(vPosition.x + vPosition.z - uPositionLight) * (vPosition.x + vPosition.z - uPositionLight) + uWidthLight;
    if (indexLight > 0.0) {
        gl_FragColor = mix(gl_FragColor, vec4(1, 1, 1, 1), indexLight / uWidthLight);
    }
    
    //#<fragment_dithering>#
        `
    );

    gsap.to(shader.uniforms.uPositionLight, {
        duration: 3,
        repeat: -1,
        ease: 'none',
        value: 1000
    });

};

const setWaistLine = (shader, mesh) => {

    let { max, min } = mesh.geometry.boundingBox;

    shader.uniforms.uPositionWaist = {
        value: min.y
    };

    shader.uniforms.uWidthWaist = {
        value: 1
    };

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_common>#',
        `uniform float uPositionWaist;
uniform float uWidthWaist;

//#<fragment_common>#
        `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '//#<fragment_dithering>#',
        `
    float indexWaist = -(vPosition.y - uPositionWaist) * (vPosition.y - uPositionWaist) + uWidthWaist;
    if (indexWaist > 0.0) {
        gl_FragColor = mix(gl_FragColor, vec4(1, 1, 1, 1), indexWaist / uWidthWaist);
    }
    
    //#<fragment_dithering>#
        `
    );

    gsap.to(shader.uniforms.uPositionWaist, {
        duration: 3,
        repeat: -1,
        ease: 'none',
        value: max.y
    });

};


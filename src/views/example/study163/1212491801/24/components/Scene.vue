<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import scene from '../module/scene.js';
import camera from '../module/camera.js';
import renderer from '../module/renderer.js';
import controls from '../module/controls';
import refresh from '../module/refresh.js';


const container = ref();

const webglMounted = () => {
    container.value.appendChild(renderer.domElement);
    renderer.render(scene, camera);
};

const webglRefresh = () => {

    if (!container.value) {
        return;
    }

    refresh();
};

const webglResize = () => {

    const { innerWidth, innerHeight } = window;

    if (camera) {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }

    if (renderer) {
        renderer.setSize(innerWidth, innerHeight);
    }
};

const webglUnmounted = () => {

    if (scene) {

        scene.traverse((d) => {
            if (d[ 'isMesh' ]) {
                d[ 'geometry' ][ 'dispose' ]();
                if (d[ 'material' ][ 'isMaterial' ]) {
                    d[ 'material' ][ 'dispose' ]();
                } else {
                    for (const material of d[ 'material' ]) {
                        material[ 'dispose' ]();
                    }
                }
            }

            if (d[ 'isLight' ]) {
                d[ 'dispose' ]();
            }
        });
    }

    while (scene.children.length > 0) {
        scene.remove(scene.children[ 0 ]);
    }

    if (renderer) {
        renderer.dispose();
    }

    if (controls) {
        controls.dispose();
    }

    window.removeEventListener('resize', webglResize);
};

onMounted(() => {
    webglMounted();
    webglRefresh();
});

onBeforeUnmount(() => {
    webglUnmounted();
});

window.addEventListener('resize', webglResize, false);
</script>

<template>
<div ref="container" class="fullscreen"></div>
</template>


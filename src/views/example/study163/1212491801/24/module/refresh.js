import camera from './camera.js';
import renderer from './renderer.js';
import scene from './scene.js';
import controls from './controls.js';


const webglUpdate = (callback) => {

    requestAnimationFrame(webglUpdate);

    if (camera) {
        camera.updateProjectionMatrix();
    }

    if (renderer) {
        renderer.render(scene, camera);
    }

    if (controls) {
        controls.update();
    }

    typeof callback === 'function' && callback();
};

export default webglUpdate;
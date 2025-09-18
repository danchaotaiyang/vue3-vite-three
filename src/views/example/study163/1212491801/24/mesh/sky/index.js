import scene from '../../module/scene';
import { cubeTextureLoader } from '../../module/loaders';


export default () => {

    const texture = cubeTextureLoader.load([
        'env/nightSky/1.jpg',
        'env/nightSky/2.jpg',
        'env/nightSky/3.jpg',
        'env/nightSky/4.jpg',
        'env/nightSky/5.jpg',
        'env/nightSky/6.jpg',
    ]);

    scene.background = texture;
    scene.environment = texture;
};

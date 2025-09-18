import * as THREE from 'three';
import scene from '../../module/scene.js';
import { gltfLoader } from '../../module/loaders.js';
import { modifyMaterialCity } from './materialModefy.js';
import FlyLine from './FlyLine.js';
import FlyLineShader from './FlyLineShader.js';
import ContourLine from './ContourLine.js';
import LightWall from './LightWall.js';
import LightRadar from './LightRadar.js';
import AlarmSprite from './AlarmSprite.js';


export default async () => {
    try {
        const city = await gltfLoader.loadAsync('city.glb');
        city.scene.traverse(obj => {

            if (obj[ 'isMesh' ]) {

                obj.material = new THREE.MeshBasicMaterial({
                    color: 0x0c0e6f
                });

                modifyMaterialCity(obj);
 
                if (obj.name === 'Layerbuildings') {
                    let contourLine = new ContourLine(obj, 0xffffff);
                    let scale = obj.scale.x * 1.0001;
                    contourLine.mesh.scale.set(scale, scale, scale);
                    scene.add(contourLine.mesh);
                }
           }
        });
        scene.add(city.scene);

        let flyLine = new FlyLine({
            points: [
                [ 0, 0, 0 ],
                [ 5, 3, 0 ],
                [ 10, 0, 0 ],
            ],
            texture: 'flyLine.png'
        });
        scene.add(flyLine.mesh);

        let flyLineShader = new FlyLineShader({
            points: [
                [ 0, 0, 0 ],
                [ -5, 3, 0 ],
                [ -10, 0, 0 ],
            ],
            color: 0xffff00
        });
        scene.add(flyLineShader.mesh);

        let lightWall = new LightWall({ radius: 3, height: 2, position: { x: -4.5, y: 2, z: -1.7 }, color: new THREE.Color(1, 0, 1) });
        scene.add(lightWall.mesh);

        let lightRadar = new LightRadar({ size: 6, position: { x: -8, y: 2, z: 8 }, color: new THREE.Color(0, 1, 1) });
        scene.add(lightRadar.mesh);

        let warning = new AlarmSprite({ icon: 'warning.png', position: { x: -4.5, y: 4, z: -1.7 } });
        warning.onClick((data) => {
            console.log(data);
        });
        scene.add(warning.mesh);
    } catch (e) {
        console.warn(e);
    } finally {

    }
};
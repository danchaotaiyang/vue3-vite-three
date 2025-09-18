import * as THREE from 'three';


export default class RoomShapeMesh extends THREE.Mesh {

    isRoomShape = true;

    option = {
        side: THREE.FrontSide,
        color: 0xff0000,
        position: new THREE.Vector3(0, 0, 0),
    };

    constructor(state, option) {

        super();

        this.state = state;
        this.vectors = state.areas;

        if (option) {
            this.option = Object.assign({}, this.option, option);
        }

        this.#createRoomShape();
    }

    #createRoomShape() {

        let { color, side, position, material } = this.option;

        let shape = new THREE.Shape();

        for (let i = 0; i < this.vectors.length; i++) {

            let { x, y } = this.vectors[ i ];

            x /= 100;
            y /= 100;

            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }

        this.geometry = new THREE.ShapeGeometry(shape);
        this.geometry.rotateX(Math.PI / 2);

        if (material && material.isMaterial) {

            this.material = material;
        } else {

            this.material = new THREE.MeshBasicMaterial({
                transparent: true,
                side,
                color,
            });
        }

        this.position.copy(position);
    }
}
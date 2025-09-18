import * as THREE from 'three';


const faceIndexes = [
    // 底面
    [ 0, 1, 2, 3 ],
    //   上面
    [ 4, 5, 6, 7 ],
    //   左面
    [ 0, 3, 6, 5 ],
    //   右面
    [ 2, 1, 4, 7 ],
    //   前面
    [ 1, 0, 5, 4 ],
    //   后面
    [ 3, 2, 7, 6 ]
];

export default class WallMesh extends THREE.Mesh {

    isWall = true;

    constructor(wallPoints, faceRelation) {

        super();

        this.wallPoints = wallPoints;
        this.faceRelation = faceRelation;

        this.#createWall();
    }

    #createWall() {

        let shape = new THREE.Shape();
        let wallPoints = this.wallPoints;

        for (let i = 0; i < wallPoints.length; i++) {

            let { x, y, z } = wallPoints[ i ];

            wallPoints[ i ].x = x / 100;
            wallPoints[ i ].y = z / 100;
            wallPoints[ i ].z = y / 100;
        }

        let materialIndexes = [];

        for (let i = 0; i < faceIndexes.length; i++) {

            let item = faceIndexes[ i ].slice(0);
            item.sort();
            item = item.join('');

            let faceItem = this.faceRelation.find((d) => {

                let r = d.index.slice();
                r.sort();
                r = r.join('');

                return r === item;
            });

            if (faceItem) {
                materialIndexes.push(faceItem.panorama);
            } else {
                materialIndexes.push(0);
            }
        }

        let faces = faceIndexes.map((d) => {
            return new Array(4).map((dd, ii) => {
                return [ wallPoints[ d[ ii ] ].x, wallPoints[ d[ ii ] ].y, wallPoints[ d[ ii ] ].z ];
            });
        });
    }
}
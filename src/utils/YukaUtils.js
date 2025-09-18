import * as THREE from 'three';
import * as YUKA from 'yuka';


const getPoints = (mesh) => {

    let points = [];

    let { geometry, matrixWorld } = mesh.clone();

    if (geometry.index) {
        geometry = geometry.toNonIndexed();
    }

    geometry.applyMatrix4(matrixWorld);

    let position = geometry.getAttribute('position');

    for (let i = 0; i < position.count; i++) {

        let x = position.getX(i);
        let y = position.getY(i);
        let z = position.getZ(i);

        points.push(new YUKA.Vector3(x, y, z));
    }

    geometry.dispose();
    geometry = null;
    matrixWorld = null;
    mesh = null;
    position = null;

    return points;
};

const createBoundingSphere = (mesh) => {

    let points = getPoints(mesh);

    let sphere = new YUKA.BoundingSphere();
    sphere.fromPoints(points);

    return sphere;
};

const createBoundingSphereHelper = (boundingSphere, color = 0xffffff) => {

    const geometry = new THREE.SphereGeometry(boundingSphere.radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ transparent: true, wireframe: true, opacity: .3, color });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(boundingSphere.center);

    return mesh;
};

const createAABB = (mesh) => {

    let points = getPoints(mesh);

    let abb = new YUKA.AABB();
    abb.fromPoints(points);

    return abb;
};

const createAABBHelper = (abb, color = 0xffffff) => {

    const center = abb.getCenter(new YUKA.Vector3());
    const size = abb.getSize(new YUKA.Vector3());

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({ transparent: true, wireframe: true, opacity: .3, color });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);

    return mesh;
};

const createOBB = (mesh) => {

    let points = getPoints(mesh);

    let obb = new YUKA.OBB();
    obb.fromPoints(points);

    return obb;
};

const createOBBHelper = (obb, color = 0xffffff) => {

    const center = obb.center;
    const size = new YUKA.Vector3().copy(obb.halfSizes).multiplyScalar(2);
    const rotation = new YUKA.Quaternion().fromMatrix3(obb.rotation);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({ transparent: true, wireframe: true, opacity: .3, color });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.quaternion.copy(rotation);

    return mesh;
};

const createConvexHull = (mesh) => {

    let points = getPoints(mesh);

    const convexHull = new YUKA.ConvexHull();
    convexHull.fromPoints(points);

    return convexHull;
};

const createConvexHullHelper = (convexHull, color = 0xffffff) => {

    let faces = convexHull.faces;

    let positions = [];

    for (let i = 0; i < faces.length; i++) {

        let face = faces[ i ];
        let edge = face.edge;
        let edges = [];

        do {

            edges.push(edge);
            edge = edge.next;
        } while (edge !== face.edge);

        let triangleCount = (edges.length - 2);

        for (let i = 1, l = triangleCount; i <= l; i++) {

            let v1 = edges[ 0 ].vertex;
            let v2 = edges[ i ].vertex;
            let v3 = edges[ i + 1 ].vertex;

            positions.push(v1.x, v1.y, v1.z);
            positions.push(v2.x, v2.y, v2.z);
            positions.push(v3.x, v3.y, v3.z);
        }
    }

    const convexGeometry = new THREE.BufferGeometry();
    convexGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const convexMaterial = new THREE.MeshBasicMaterial({ transparent: true, wireframe: true, opacity: .3, color });

    return new THREE.Mesh(convexGeometry, convexMaterial);
};

export { getPoints, createBoundingSphere, createBoundingSphereHelper, createAABB, createAABBHelper, createOBB, createOBBHelper, createConvexHull, createConvexHullHelper };
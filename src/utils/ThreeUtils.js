/**
 * BufferGeometry最长边长
 * @param { Object } geometry - 原坐标x
 * @return { Number } 最长边长
 * */
export const getMaxEdgeLength = (geometry) => {
    if (!geometry.isBufferGeometry) {
        console.error('当前几何体不是一个BufferGeometry');
        return 0;
    }

    const positions = geometry.attributes.position.array;
    let maxEdgeLengthSquared = 0;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[ i ];
        const y = positions[ i + 1 ];
        const z = positions[ i + 2 ];

        // 计算当前顶点与下一个顶点的距离的平方
        const nextIndex = i + 9 < positions.length ? i + 9 : 0;
        const dx = positions[ nextIndex ] - x;
        const dy = positions[ nextIndex + 1 ] - y;
        const dz = positions[ nextIndex + 2 ] - z;
        const edgeLengthSquared = dx * dx + dy * dy + dz * dz;

        maxEdgeLengthSquared = Math.max(maxEdgeLengthSquared, edgeLengthSquared);
    }

    // 开方得到最长边的长度
    return Math.sqrt(maxEdgeLengthSquared);
};

/**
 * 获取物体中心点
 * @param { Object } mesh - 物体
 * @param { Object } vector3 - 拷贝结果的对象
 * @return { Number } 最长边长
 * */
export const getCenter = (mesh, vector3) => {

    let geometry = mesh.geometry.clone();
    geometry.boundingBox.applyMatrix4(mesh.matrixWorld);

    return geometry.boundingBox.getCenter(vector3);
}
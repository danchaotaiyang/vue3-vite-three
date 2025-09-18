
varying vec2 vUv;

void main() {

    vUv = uv;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    //  设置点大小
    gl_PointSize = 120.0;

}
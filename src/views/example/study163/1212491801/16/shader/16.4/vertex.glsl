
attribute float pattern;

varying vec2 vUv;
varying float vPattern;

void main() {

    vUv = uv;
    vPattern = pattern;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    //  设置点大小
    gl_PointSize = 50.0;

}

attribute float pattern;
attribute float scales;

varying vec2 vUv;
varying float vPattern;

void main() {

    vUv = uv;
    vPattern = pattern;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewPosition;

    //  设置点大小
    // gl_PointSize = 50.0;

    gl_PointSize = 500.0 / -viewPosition.z * scales;

}
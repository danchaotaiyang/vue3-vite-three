
attribute float scale;
attribute vec3 direction;

uniform float uTime;
uniform float uSize;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.xyz += direction * uTime * 15.0;

    vec4 viewPosition = viewMatrix * modelPosition;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewPosition;

    //  设置点大小
    gl_PointSize = max(uSize * scale - (uTime * 14.0), 0.0);

}
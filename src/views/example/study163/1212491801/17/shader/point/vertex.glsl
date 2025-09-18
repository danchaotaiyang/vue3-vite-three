
attribute vec3 altitude;

uniform float uTime;
uniform float uSize;
uniform vec3 uFrom;
uniform vec3 uTo;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    modelPosition.xyz += altitude * uTime;

    vec4 viewPosition = viewMatrix * modelPosition;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewPosition;

    //  设置点大小
    gl_PointSize = uSize;

}
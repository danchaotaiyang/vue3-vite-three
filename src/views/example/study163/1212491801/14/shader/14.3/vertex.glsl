precision lowp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

varying vec2 vUv;

void main() {
    vUv = uv;
    // gl_Position = vec4(position, 1);
    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1);
}
precision lowp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform float uTime;

varying vec2 vUv;
varying float vElevation;

void main() {

    vUv = uv;

    // gl_Position = vec4(position, 1);
    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

//    modelPosition.x += 1.0;
//    modelPosition.z += 1.0;

//    modelPosition.z += modelPosition.x;


    modelPosition.z += sin((modelPosition.x + uTime) * 10.0) * .05;
    modelPosition.z += sin((modelPosition.y + uTime) * 10.0) * .05;

    vElevation = modelPosition.z;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

}
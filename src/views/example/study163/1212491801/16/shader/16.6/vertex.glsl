
attribute float pattern;
attribute float scales;

uniform float uTime;

varying vec2 vUv;
varying float vPattern;

void main() {

    vUv = uv;
    vPattern = pattern;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    //  获取点角度
    float ang = atan(modelPosition.x, modelPosition.z);
    //  顶点到中心距离
    float distance2Center = length(modelPosition.xz);
    //  根据距离设置旋转偏移度数
    float angOffset = 1.0 / distance2Center * uTime;
    ang += angOffset;

    modelPosition.x = cos(ang) * distance2Center;
    modelPosition.z = sin(ang) * distance2Center;

    vec4 viewPosition = viewMatrix * modelPosition;

    //  投影矩阵 × 视图矩阵 × 模型矩阵 × 顶点坐标
    gl_Position = projectionMatrix * viewPosition;

    //  设置点大小
    // gl_PointSize = 50.0;

    gl_PointSize = 500.0 / -viewPosition.z * scales;

}
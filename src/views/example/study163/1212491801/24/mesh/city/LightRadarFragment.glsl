uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;

mat2 rotate2d(float angle) {
    return mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
    );
}

void main() {

    vec2 rotatedUv = rotate2d(-uTime * 6.28) * (vUv - .5);
    rotatedUv += .5;
    float alpha = 1.0 - step(.5, distance(rotatedUv, vec2(0.5)));
    float angle = atan(rotatedUv.x - .5, rotatedUv.y - .5);
    float strength = (angle + 3.14) / 6.28;

    gl_FragColor = vec4(uColor, alpha * strength);
}

precision highp float;

#define PI 3.141592653589793;

uniform float uTime;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 rotate(vec2 uv, float rotation, vec2 mid) {
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
}

void main() {

    //  float n1 = step(.5, distance(vUv, vec2(.5)) + .35);
    //  float n2 = step(.5, distance(vUv, vec2(.5)) + .25);
    //  float n = n1 - n2;

    //  float n = step(.5, distance(vUv, vec2(.5)) + .35);
    //  n *= 1.0 - step(.5, distance(vUv, vec2(.5)) + .25);

    //  float n = 1.0 - step(.05, abs(distance(vUv, vec2(.5)) - .25));

    //  vec2 waveUv = vec2(vUv.x, vUv.y + sin(vUv.x * 30.0) * .1);
    //  float n = 1.0 - step(.01, abs(distance(waveUv, vec2(.5)) - .25));

    //  vec2 waveUv = vec2(vUv.x + sin(vUv.y * uTime) * .1, vUv.y + sin(vUv.x * uTime) * .1);
    //  float n = 1.0 - step(.01, abs(distance(waveUv, vec2(.5)) - .25));

    //  float n = atan(vUv.x, vUv.y);

    //  vec2 rotateUv = rotate(vUv, -uTime * 5.0, vec2(.5));
    //  float alpha = 1.0 - step(.5, abs(distance(rotateUv, vec2(.5))));
    //  float ang = atan(rotateUv.x - .5, rotateUv.y - .5);
    //  float n = (ang + 3.14) / 6.28;

    //  float ang = atan(vUv.x - .5, vUv.y - .5) / PI;
    //  float n = mod(ang * 4.0, 1.0);

    float ang = atan(vUv.x - .5, vUv.y - .5) / PI;
    float n = sin(ang * 9.0);

    gl_FragColor = vec4(n, n, n, n);

}
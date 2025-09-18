precision highp float;

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

    //  float m = min(abs(vUv.x - .5), abs(vUv.y - .5));
    //  gl_FragColor = vec4(m, m, m, 1);

    //  float m = max(abs(vUv.x - .5), abs(vUv.y - .5));
    //  gl_FragColor = vec4(m, m, m, 1);

    //  float m = 1.0 - max(abs(vUv.x - .5), abs(vUv.y - .5));
    //  gl_FragColor = vec4(m, m, m, 1);

    //  float m = step(.2, max(abs(vUv.x - .5), abs(vUv.y - .5)));
    //  gl_FragColor = vec4(m, m, m, m);

    //  float m = step(.2, max(abs(vUv.x - .5), abs(vUv.y - .5)));
    //  gl_FragColor = vec4(m);

    //  float x = floor(vUv.x * 10.0) / 10.0;
    //  float y = floor(vUv.y * 10.0) / 10.0;
    //  float n = x * y;
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float x = ceil(vUv.x * 10.0) / 10.0;
    //  float y = ceil(vUv.y * 10.0) / 10.0;
    //  float n = x * y;
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = random(vUv);
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float x = ceil(vUv.x * 10.0) / 10.0;
    //  float y = ceil(vUv.y * 10.0) / 10.0;
    //  float n = random(vec2(x, y));
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = length(vUv - .5);
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = mod(length((vUv - .5) * 10.0), .5);
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = step(.3, mod(length((vUv - .5) * 10.0), .5));
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = distance(vUv, vec2(.5, .5));
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = 1.0 - distance(vUv, vec2(.5, .5));
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = .1 / distance(vUv, vec2(.5, .5));
    //  gl_FragColor = vec4(n, n, n, 1);

    //  float n = .1 / distance(vUv, vec2(.5, .5)) - 1.0;
    //  gl_FragColor = vec4(n);

    //  float n = .1 / distance(vec2(vUv.x, (vUv.y - .5) * 5.0 + .5), vec2(.5, .5)) - 1.0;
    //  gl_FragColor = vec4(n);

    vec2 rotateUv = rotate(vUv, -uTime * 5.0, vec2(.5));
    float x = .1 / distance(vec2(rotateUv.x, (rotateUv.y - .5) * 5.0 + .5), vec2(.5, .5)) - 1.0;
    float y = .1 / distance(vec2((rotateUv.x - .5) * 5.0 + .5, rotateUv.y), vec2(.5, .5)) - 1.0;
    float n = x + y;
    gl_FragColor = vec4(n);

}
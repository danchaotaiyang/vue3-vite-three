precision highp float;

uniform float uTime;

varying vec2 vUv;

void main() {

    //  gl_FragColor = vec4(vUv, 0.0, 1.0);

    //  gl_FragColor = vec4(vUv, 1.0, 1.0);

    //  float x = vUv.x;
    //  gl_FragColor = vec4(x, x, x, 1);

    //  float y = float(1) - vUv.y;
    //  gl_FragColor = vec4(y, y, y, 1);

    //  mode 取模
    //  float y = mod(vUv.y * 10.0, 1.0);
    //  gl_FragColor = vec4(y, y, y, 1);

    //  float y = step(.2, mod(vUv.y * 10.0, 1.0));
    //  gl_FragColor = vec4(y, y, y, 1);

    //  float x = step(.5, mod(vUv.x * 10.0, 1.0));
    //  x += step(.5, mod(vUv.y * 10.0, 1.0));
    //  gl_FragColor = vec4(x, x, x, 1);

    //  float x = step(.5, mod(vUv.x * 10.0, 1.0));
    //  x *= step(.5, mod(vUv.y * 10.0, 1.0));
    //  gl_FragColor = vec4(x, x, x, 1);

    //  float x = step(.2, mod(vUv.x * 10.0, 1.0));
    //  x *= step(.85, mod(vUv.y * 10.0, 1.0));
    //  gl_FragColor = vec4(x, x, x, 1);

    //  float x = step(.3, mod((vUv.x + uTime * .05) * 10.0, 1.0)) * step(.85, mod((vUv.y + uTime * .05) * 10.0, 1.0));
    //  float y = step(.3, mod((vUv.y + uTime * .05) * 10.0, 1.0)) * step(.85, mod((vUv.x + uTime * .05) * 10.0, 1.0));
    //  float n = x + y;
    //  gl_FragColor = vec4(n, n, n, 1);
    //  gl_FragColor = vec4(vUv, 1.0, n);

    //  float x = step(.3, mod(vUv.x * 10.0, 1.0)) * step(.85, mod(vUv.y * 10.0, 1.0));
    //  float y = step(.3, mod(vUv.y * 10.0, 1.0)) * step(.85, mod(vUv.x * 10.0 + .275, 1.0));
    //  float n = x + y;
    //  gl_FragColor = vec4(vUv, 1.0, n);

    float x = abs(vUv.x - .5) * 2.0;
    gl_FragColor = vec4(x, x, x, 1);

}
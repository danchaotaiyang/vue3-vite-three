
varying vec2 vUv;

void main() {

    //  gl_FragColor = vec4(gl_PointCoord, 0, 1);

    float n = distance(gl_PointCoord, vec2(.5));
    n *= 2.0;
    n = 1.0 - n;

    //  float n = (1.0 - distance(gl_PointCoord, vec2(.5)));
    //  n = step(.5, n);

    gl_FragColor = vec4(n);

}
precision highp float;

varying float vElevation;

void main() {

    float index = (vElevation + 1.0) / 2.0;

    gl_FragColor = vec4(1.2 * index, 1.2 * index, 0, 1);

}
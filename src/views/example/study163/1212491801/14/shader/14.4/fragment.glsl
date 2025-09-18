precision lowp float;

varying float vElevation;

void main() {

    float height = vElevation + .05 * 10.0;

    gl_FragColor = vec4(1.0 * height, 0, 0, 1);

}
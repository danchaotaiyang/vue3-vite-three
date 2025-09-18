
uniform vec3 uColor;

void main() {

    float distanceToCenter = distance(gl_PointCoord, vec2(.5));

    float n = distanceToCenter * 2.0;
    n = 1.0 - n;
    n = pow(n, 1.5);

    gl_FragColor = vec4(n * uColor.r, n * uColor.g, n * uColor.b, 1);

}
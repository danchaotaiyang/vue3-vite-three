uniform vec3 uColor;

varying float vSize;

void main() {

    float distanceToCenter = distance(gl_PointCoord, vec2(0.5, 0.5));
    float strength = 1.0 - (distanceToCenter * 2.0);

    vec4 color;
    if (vSize < 0.0) {
        color = vec4(1.0, 0.0, 0.0, 0.0);
    } else {
        color = vec4(uColor, strength);
    }

    gl_FragColor = color;
}

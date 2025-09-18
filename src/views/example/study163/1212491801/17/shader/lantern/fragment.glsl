
varying vec4 lPosition;
varying vec4 vPosition;

void main() {

    vec4 colorYellow = vec4(1, 1, .5, 1);
    vec4 colorRef = vec4(1, 0, 0, 1);
    vec4 colorMatrix = mix(colorYellow, colorRef, lPosition.y / 3.0);

    vec4 color;
    if (gl_FrontFacing) {
        color = vec4(colorMatrix.rgb - (vPosition.y - 0.0) / 200.0 - .005, 1);
    } else {
        color = vec4(colorMatrix.rgb, 1);
    }
    gl_FragColor = color;

}
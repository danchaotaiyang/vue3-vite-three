uniform float uHeight;
uniform vec3 uColor;
varying vec3 vPosition;


void main() {

    float alpha = (vPosition.y + uHeight / 2.0) / uHeight;

    gl_FragColor = vec4(uColor, 1.0 - alpha);
}

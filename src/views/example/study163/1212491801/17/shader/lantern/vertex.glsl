
varying vec4 lPosition;
varying vec4 vPosition;

void main() {

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    lPosition = vec4(position, 1.0);
    vPosition = modelPosition;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

}
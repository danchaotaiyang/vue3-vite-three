
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {

    //  gl_FragColor = vec4(gl_PointCoord, 0, 1);

    //  float n = distance(gl_PointCoord, vec2(.5));
    //  n *= 2.0;
    //  n = 1.0 - n;

    //  float n = (1.0 - distance(gl_PointCoord, vec2(.5)));
    //  n = step(.5, n);

    //  vec4 textureColor = texture2D(uTexture, gl_PointCoord);
    //  gl_FragColor = vec4(textureColor.rgb, textureColor.r);

    vec4 textureColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(gl_PointCoord, 1, textureColor.r);

}
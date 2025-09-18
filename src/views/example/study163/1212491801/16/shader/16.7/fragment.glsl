
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform sampler2D uTextureC;

varying vec2 vUv;
varying float vPattern;
varying vec3 vColor;

void main() {

    //  gl_FragColor = vec4(gl_PointCoord, 0, 1);

    //  float n = distance(gl_PointCoord, vec2(.5));
    //  n *= 2.0;
    //  n = 1.0 - n;

    //  float n = (1.0 - distance(gl_PointCoord, vec2(.5)));
    //  n = step(.5, n);

    //  vec4 textureColor = texture2D(uTexture, gl_PointCoord);
    //  gl_FragColor = vec4(textureColor.rgb, textureColor.r);

    vec4 textureColor;
    if (vPattern == 0.0) {
       textureColor = texture2D(uTextureA, gl_PointCoord);
    } else if (vPattern == 1.0) {
       textureColor = texture2D(uTextureB, gl_PointCoord);
    } else {
       textureColor = texture2D(uTextureC, gl_PointCoord);
    }

    gl_FragColor = vec4(vColor, textureColor.r);

}
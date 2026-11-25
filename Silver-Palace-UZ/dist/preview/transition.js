const stage = document.querySelector(".stage");
const canvas = stage.querySelector("canvas");
const buttons = [...stage.querySelectorAll("button")];
const images = ["/official/home_bg.webp", "/city.webp"];
const descriptions = ["Silvernianing yashirin sirlarini och.", "Viktoriya davridan ilhomlangan shaharni kashf et."];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const pointer = [0.5, 0.5];
let current = 0;
let target = 0;
let progress = 0;
let aim = 0;
let frame = 0;
let render;

function show(index) {
  current = target = index;
  stage.dataset.scene = index;
  document.getElementById("scene-title").textContent = buttons[index].textContent;
  document.getElementById("scene-description").textContent = descriptions[index];
  buttons.forEach((button, position) => button.setAttribute("aria-pressed", String(index === position)));
  canvas.hidden = true;
}

function animate() {
  frame = 0;
  progress += (aim - progress) * .14;
  if (Math.abs(progress - aim) < .002) {
    show(aim === 1 ? target : current);
    progress = aim = 0;
    return;
  }
  render(current, target, progress, pointer);
  frame = requestAnimationFrame(animate);
}

function move(index) {
  if (!render || reducedMotion.matches) {
    show(index);
    return;
  }
  if (!frame && current === index) return;
  target = 1 - current;
  aim = Number(index === target);
  canvas.hidden = false;
  if (!frame) frame = requestAnimationFrame(animate);
}

buttons.forEach((button, index) => button.addEventListener("click", () => move(index)));
stage.addEventListener("pointermove", (event) => {
  pointer[0] = event.clientX / innerWidth;
  pointer[1] = 1 - event.clientY / innerHeight;
});
stage.addEventListener("wheel", (event) => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
  const next = Number(event.deltaY > 0);
  if (next === current && !frame) return;
  event.preventDefault();
  move(next);
}, { passive: false });
window.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  move(Number(["ArrowRight", "ArrowDown"].includes(event.key)));
});
let swipeStart;
stage.addEventListener("touchstart", (event) => { swipeStart = event.changedTouches[0].clientX; }, { passive: true });
stage.addEventListener("touchend", (event) => {
  const distance = event.changedTouches[0].clientX - swipeStart;
  if (Math.abs(distance) >= 55) move(Number(distance < 0));
}, { passive: true });

async function createRenderer() {
  const gl = canvas.getContext("webgl", { alpha: false });
  if (!gl) return;
  gl.getExtension("OES_standard_derivatives");

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, `
    attribute vec2 point;
    varying vec2 uv;
    void main() { uv = point * .5 + .5; gl_Position = vec4(point, 0., 1.); }
  `));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D oldScene,newScene;
    uniform vec2 oldScale,newScale,focus;
    uniform float progress,aspect,reverse;
    float hash(vec2 p){return fract(sin(dot(p,vec2(61.7,127.1)))*15731.743);}
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }
    float fbm(vec2 p){return .55*noise(p)+.27*noise(p*2.04)+.12*noise(p*4.12)+.06*noise(p*8.2);}
    void main(){
      vec2 point=(uv-focus)*vec2(aspect,1.);
      float grain=fbm(uv*vec2(19.,12.))-.5;
      float circle=length(point) / max(aspect,1.);
      float wipe=mix(circle,uv.y,reverse);
      float distanceToEdge=wipe+grain*.22-mix(-.15,1.35,progress);
      float width=.007;
      #ifdef GL_OES_standard_derivatives
      width=max(width,fwidth(distanceToEdge));
      #endif
      float reveal=1.-smoothstep(-width,width,distanceToEdge);
      vec2 a=(uv-.5)*oldScale/(1.+progress*.12)+.5;
      vec2 b=(uv-.5)*newScale/(1.+(1.-progress)*.12)+.5;
      vec3 from=texture2D(oldScene,a).rgb*(1.-progress*.28);
      vec3 to=texture2D(newScene,b).rgb;
      float edge=exp(-abs(distanceToEdge)*90.)*sin(progress*3.14159);
      gl_FragColor=vec4(mix(from,to,reveal)+vec3(.75,.49,.22)*edge*.40,1.);
    }
  `));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, "point");
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(
    ["oldScene","newScene","oldScale","newScale","focus","progress","aspect","reverse"]
      .map((name) => [name, gl.getUniformLocation(program, name)])
  );
  const textures = await Promise.all(images.map(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    for (const axis of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, axis, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return { texture, aspect: image.naturalWidth / image.naturalHeight };
  }));

  return (from, to, value, center) => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const width = Math.round(stage.clientWidth * ratio);
    const height = Math.round(stage.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    const aspect = width / height;
    [from,to].forEach((index, unit) => {
      const item = textures[index];
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, item.texture);
      gl.uniform1i(unit ? uniforms.newScene : uniforms.oldScene, unit);
      gl.uniform2f(unit ? uniforms.newScale : uniforms.oldScale,
        Math.min(1, aspect / item.aspect), Math.min(1, item.aspect / aspect));
    });
    gl.uniform2f(uniforms.focus, .45 + center[0]*.1, .45 + center[1]*.1);
    gl.uniform1f(uniforms.progress, value);
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform1f(uniforms.reverse, from);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  render = undefined;
  show(Number(aim === 1 ? target : current));
});
if (!reducedMotion.matches) createRenderer().then((draw) => { render = draw; }).catch(() => {});

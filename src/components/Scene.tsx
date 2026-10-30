import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { NR, world } from '../world'
import { sound } from '../audio'

/* ------------------------------------------------------------------ *
 * WATER: full-screen fragment shader. Caustics, god rays, ripples from
 * the cursor, depth tint, bioluminescence near the seabed.
 * ------------------------------------------------------------------ */
const waterVert = /* glsl */ `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`
const waterFrag = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uT, uD, uVel, uOn, uNight; uniform vec3 uRip[${NR}]; uniform float uStr[${NR}]; uniform vec2 uM;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*vn(p);p=p*2.03+7.1;a*=.5;}return s;}
// ripple height + analytic gradient in a single pass (was 3 full passes)
vec3 ripples(vec2 uv, vec2 asp){
  float h=0.; vec2 g=vec2(0.);
  for(int i=0;i<${NR};i++){
    float age=uT-uRip[i].z;
    if(age>0.&&age<5.){
      vec2 dd=(uv-uRip[i].xy)*asp;
      float d=length(dd);
      float x=d-age*.36;
      float env=exp(-x*x*49.)*exp(-age*.75)*uStr[i];
      float a=x*55.;
      float sn=sin(a);
      h+=sn*env;
      float dh=env*(55.*cos(a)-98.*x*sn);
      if(d>1e-4) g+=dh*(dd/d)*asp;
    }
  }
  return vec3(h,g);
}
float caustic(vec2 p,float t){
  vec2 i=p;float c=1.;float inten=.0055;
  for(int n=0;n<4;n++){
    float tt=t*(1.-(3.5/float(n+1)));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));
  }
  c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;uv.y=1.-uv.y;
  vec2 asp=vec2(uRes.x/uRes.y,1.);
  vec3 rp=uOn>.5?ripples(uv,asp):vec3(0.);
  float h=rp.x; vec2 g=rp.yz;
  vec2 duv=uv+g*.0016;
  float d=uD;
  vec3 c0=vec3(.80,.94,.95), c1=vec3(.22,.62,.74), c2=vec3(.04,.22,.40), c3=vec3(.01,.05,.14), c4=vec3(.0,.02,.06);
  // moonlit surface: the same depth ramp, starting from deep indigo instead of bright aqua
  c0=mix(c0,vec3(.05,.10,.24),uNight); c1=mix(c1,vec3(.04,.15,.34),uNight); c2=mix(c2,vec3(.03,.12,.26),uNight*.6);
  vec3 col=mix(c0,c1,smoothstep(0.,.13,d));
  col=mix(col,c2,smoothstep(.1,.42,d));
  col=mix(col,c3,smoothstep(.45,.8,d));
  col=mix(col,c4,smoothstep(.8,1.,d));
  float flow=fbm(duv*asp*2.2+vec2(uT*.03,-uT*.02+uD*3.));
  col+=(flow-.5)*.07*(1.-d*.6);
  col*=1.-.22*smoothstep(.2,1.,uv.y)*(.4+d);
  // caustics + god rays only exist in the lit part of the water
  if(d<.66){
    vec2 cp=mod((duv*asp+vec2(0.,uD*1.5))*6.2831*1.3,6.2831)-250.;
    float cs=clamp(caustic(cp,uT*.55+23.),0.,1.);
    float cmask=(1.-smoothstep(.0,.62,d))*(.2+.8*smoothstep(1.,.0,uv.y));
    col+=vec3(.75,1.,1.)*cs*.38*cmask*(1.-.6*uNight);
    if(d<.5){
      float ray=pow(max(0.,sin(duv.x*asp.x*7.+uT*.15+flow*3.)),6.)*(1.-uv.y)*(1.-smoothstep(0.,.5,d));
      col+=mix(vec3(.9,1.,.95),vec3(.45,.6,1.),uNight)*ray*.12*(1.-.5*uNight);
    }
    // a soft moon halo near the top-right of the surface at night
    vec2 mp=(uv-vec2(.8,.1))*asp;
    col+=vec3(.55,.65,1.)*exp(-dot(mp,mp)*28.)*.32*uNight*(1.-smoothstep(0.,.4,d));
  }
  if(uOn>.5){
    float spec=pow(clamp(dot(normalize(vec3(-g*.03,1.)),normalize(vec3(.3,-.4,.85))),0.,1.),64.);
    col+=vec3(1.)*spec*.5*(1.-d*.4)+vec3(g.x+g.y)*.0016*(1.-d);
  }
  float bio=smoothstep(.5,1.,d);
  if(bio>.001){
    vec2 md=(uv-uM)*asp;
    float glow=exp(-dot(md,md)*16.)*bio;
    // the expensive noise only runs right around the cursor; ambient sparkle is a cheap hash twinkle
    float spark=glow>.004?smoothstep(.7,.95,fbm(duv*asp*18.+uT*.15)):0.;
    vec2 tc=duv*asp*64.;
    float tr=step(.988,h21(floor(tc)+floor(uT*.7)));
    float tw=tr*(1.-smoothstep(0.,.5,length(fract(tc)-.5)))*bio*(.5+.5*sin(uT*3.+duv.x*40.));
    col+=vec3(.2,.9,1.)*(glow*.55+spark*glow*1.8+tw*.55);
    col+=vec3(.0,.5,.7)*abs(h)*.2*(0.4+bio);
  }
  float av=abs(uVel);
  if(av>300.) col+=vec3(.5,.9,1.)*pow(fbm(vec2(uv.x*40.,uv.y*2.-uT*2.)),3.)*clamp(av/3500.,0.,1.)*.25*(1.-d*.5);
  float vg=smoothstep(1.2,.3,length((uv-.5)*vec2(1.,.9)));
  col*=mix(.8,1.,vg);
  gl_FragColor=vec4(col,1.);
}`

function Water() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const size = useMemo(() => new THREE.Vector2(), [])
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uT: { value: 0 },
      uD: { value: 0 },
      uVel: { value: 0 },
      uOn: { value: 0 },
      uNight: { value: 0 },
      uRip: { value: Array.from({ length: NR }, () => new THREE.Vector3(0, 0, -100)) },
      uStr: { value: new Array<number>(NR).fill(0) },
      uM: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [],
  )
  useFrame(({ gl }) => {
    gl.getDrawingBufferSize(size)
    // R3F clones the `uniforms` prop, so always write to the live material's copy
    const u = mat.current?.uniforms as typeof uniforms | undefined
    if (!u) return
    u.uRes.value.copy(size)
    u.uT.value = world.reduced ? 2 : world.t
    u.uD.value = world.depth
    u.uVel.value = world.vel
    u.uM.value.set(world.nx, world.ny)
    let on = 0
    for (let i = 0; i < NR; i++) {
      if (world.t - world.rip[i * 3 + 2] < 5) on = 1
      u.uRip.value[i].set(world.rip[i * 3], world.rip[i * 3 + 1], world.rip[i * 3 + 2])
      u.uStr.value[i] = world.str[i]
    }
    u.uOn.value = on
    u.uNight.value = world.night
  })
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={waterVert} fragmentShader={waterFrag} uniforms={uniforms} depthTest={false} depthWrite={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ *
 * JELLYFISH: pulsing fresnel bell + shader-animated tentacles.
 * They drift upward, scatter from the cursor, and one follows it.
 * ------------------------------------------------------------------ */
const bellVert = /* glsl */ `
uniform float uT, uPhase;
varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vP;
void main(){
  vec3 p = position;
  float pulse = sin(uT*2.2 + uPhase);
  float rim = 1.0 - smoothstep(0.55, 1.0, p.y);
  p.xz *= 1.0 + 0.2*pulse*rim + 0.04*pulse;
  p.y  *= 1.0 - 0.12*pulse;
  vP = p; vY = p.y;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vN = normalize(normalMatrix * normalize(position));
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const bellFrag = /* glsl */ `
uniform vec3 uColor; uniform float uVis, uT, uPhase;
varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vP;
void main(){
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  float ang = atan(vP.z, vP.x);
  float veins = pow(abs(sin(ang*7.0 + uT*0.4)), 12.0) * smoothstep(1.0,0.55,vY);
  float core = smoothstep(0.55, 1.0, vY) * 0.35;
  float a = (fres*0.85 + veins*0.35 + core + 0.06) * uVis;
  vec3 col = uColor * (0.7 + fres*1.3) + vec3(0.6,0.9,1.0)*veins*0.6;
  gl_FragColor = vec4(col*a, a);
}`
const tentVert = /* glsl */ `
attribute float aA; attribute float aS;
uniform float uT, uPhase; varying float vS;
void main(){
  float s = aS; vS = s;
  float pulse = sin(uT*2.2 + uPhase);
  vec3 p = vec3(cos(aA)*0.62*(1.0+0.15*pulse), 0.58, sin(aA)*0.62*(1.0+0.15*pulse));
  float L = 2.9;
  p.y -= s*L*(1.0 - 0.12*pulse);
  p.x += sin(uT*1.5 - s*6.0 + aA*3.0 + uPhase)*0.22*s;
  p.z += cos(uT*1.2 - s*5.0 + aA*5.0 + uPhase)*0.22*s;
  p.xz *= 1.0 - s*0.25;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`
const tentFrag = /* glsl */ `
uniform vec3 uColor; uniform float uVis; varying float vS;
void main(){ float a = (1.0 - vS) * 0.55 * uVis; gl_FragColor = vec4(uColor*a, a); }`

const bellGeo = new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.56)
function makeTentacles(T = 14, S = 16) {
  const pos: number[] = [], a: number[] = [], s: number[] = []
  for (let t = 0; t < T; t++) {
    const ang = (t / T) * Math.PI * 2 + Math.sin(t * 12.9) * 0.1
    for (let k = 0; k < S; k++) {
      pos.push(0, 0, 0, 0, 0, 0)
      a.push(ang, ang)
      s.push(k / S, (k + 1) / S)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('aA', new THREE.Float32BufferAttribute(a, 1))
  g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1))
  return g
}
const tentGeo = makeTentacles()

interface JellySpec { x: number; y: number; scale: number; hue: number; leader?: boolean; phase: number }

function Jelly({ spec }: { spec: JellySpec }) {
  const group = useRef<THREE.Group>(null)
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0, init: false })
  const color = useMemo(() => new THREE.Color().setHSL(spec.hue, 0.85, 0.62), [spec.hue])
  const uni = useMemo(() => ({ uT: { value: 0 }, uPhase: { value: spec.phase }, uColor: { value: color }, uVis: { value: 0 } }), [spec.phase, color])
  const bellMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: bellVert, fragmentShader: bellFrag, uniforms: uni, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    [uni],
  )
  const tentMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: tentVert, fragmentShader: tentFrag, uniforms: uni, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    [uni],
  )

  useFrame(({ viewport }) => {
    const g = group.current
    if (!g) return
    const s = st.current
    const dt = world.dt
    const vw = viewport.width, vh = viewport.height
    if (!s.init) {
      s.x = (spec.x - 0.5) * vw
      s.y = (spec.y - 0.5) * vh
      s.init = true
    }
    const speed = world.reduced ? 0.02 : 0.22 + spec.phase * 0.01
    // upward drift + scroll parallax (diving makes them rise past you)
    s.vy += ((speed + Math.max(0, world.vel) * 0.0016) - s.vy) * Math.min(1, dt * 1.2)
    s.vx += Math.sin(world.t * 0.4 + spec.phase) * 0.12 * dt
    const px = (world.nx - 0.5) * vw, py = (0.5 - world.ny) * vh
    const dx = s.x - px, dy = s.y - py
    const d2 = dx * dx + dy * dy
    if (spec.leader && world.active) {
      s.vx += ((px - s.x) * 0.9 - s.vx * 1.9) * dt * 2.2
      s.vy += ((py - s.y) * 0.9 - s.vy * 1.9) * dt * 2.2
    } else if (world.active && d2 < 2.6 && d2 > 0.0001) {
      const d = Math.sqrt(d2)
      s.vx += (dx / d) * (2.6 - d2) * 2.2 * dt
      s.vy += (dy / d) * (2.6 - d2) * 2.2 * dt
    }
    s.vx *= 1 - Math.min(1, dt * 0.9)
    s.x += s.vx * dt
    s.y += s.vy * dt
    if (s.y > vh / 2 + 3.4) { s.y = -vh / 2 - 3.4; s.x = (Math.random() - 0.5) * vw * 0.95; s.vx = 0 }
    if (Math.abs(s.x) > vw / 2 + 2.5) s.x *= -0.95
    g.position.set(s.x, s.y, spec.leader ? 0.5 : -1.5 - (spec.phase % 3))
    g.rotation.z = -s.vx * 0.2
    g.rotation.y = world.t * 0.18 + spec.phase
    g.rotation.x = 0.12 + s.vy * 0.05
    const sc = spec.scale * (vw < 7 ? 0.62 : 1)
    g.scale.setScalar(sc)
    uni.uT.value = world.t
    const dpt = world.depth
    const target = spec.leader ? Math.min(1, 0.25 + dpt * 1.3) : Math.max(0, Math.min(1, (dpt - 0.12) / 0.35))
    uni.uVis.value += (target - uni.uVis.value) * Math.min(1, dt * 2)
    g.visible = uni.uVis.value > 0.01
  })

  return (
    <group ref={group}>
      <mesh geometry={bellGeo} material={bellMat} frustumCulled={false} />
      <lineSegments geometry={tentGeo} material={tentMat} frustumCulled={false} />
    </group>
  )
}

function Jellies() {
  const specs = useMemo<JellySpec[]>(() => {
    const m = typeof window !== 'undefined' && window.innerWidth < 760
    const n = m ? 5 : 9
    return Array.from({ length: n }, (_, i) => ({
      x: (i * 0.618 + 0.13) % 1,
      y: (i * 0.37 + 0.08) % 1,
      scale: i === 0 ? 0.95 : 0.35 + ((i * 0.29) % 0.55),
      hue: [0.5, 0.56, 0.62, 0.9, 0.45, 0.7][i % 6],
      leader: i === 0,
      phase: i * 1.7,
    }))
  }, [])
  return <>{specs.map((s, i) => <Jelly key={i} spec={s} />)}</>
}


/* ------------------------------------------------------------------ *
 * WHALE: a procedural silhouette that glides past in the twilight zone.
 * Lathe body + fluke, bent by a travelling sine wave in the vertex shader.
 * ------------------------------------------------------------------ */
const whaleVert = /* glsl */ `
uniform float uT, uPhase;
varying vec3 vN; varying vec3 vV; varying float vX;
void main(){
  vec3 p = position;
  float k = smoothstep(-0.4, 2.0, p.x);          // tail weight (head is -x)
  p.y += sin(uT*1.1 + uPhase - p.x*1.5) * 0.34 * k * k;
  p.z += cos(uT*0.8 + uPhase - p.x*1.2) * 0.05 * k;
  vX = p.x;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const whaleFrag = /* glsl */ `
uniform float uVis; varying vec3 vN; varying vec3 vV; varying float vX;
void main(){
  vec3 n = normalize(vN);
  float fres = pow(1.0 - abs(dot(n, normalize(vV))), 2.4);
  float belly = smoothstep(0.1, -0.7, n.y);
  vec3 col = vec3(0.015, 0.07, 0.13) + vec3(0.04,0.14,0.2)*belly + vec3(0.25,0.75,1.0)*fres*1.15;
  col += vec3(0.05,0.2,0.3) * smoothstep(-1.6,-0.4,vX) * 0.35;
  gl_FragColor = vec4(col, uVis * 0.94);
}`

function makeWhaleGeo() {
  const pts: THREE.Vector2[] = []
  const L = 4
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const r = Math.max(0.015, 1.08 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (0.34 + 0.66 * t))
    pts.push(new THREE.Vector2(r, t * L))
  }
  const body = new THREE.LatheGeometry(pts, 28)
  body.translate(0, -L / 2 - 0.2, 0)
  body.rotateZ(Math.PI / 2) // head (t=1) now points to -x
  body.scale(1, 0.92, 1)
  // tail flukes: two swept triangles at +x
  const fl: number[] = [
    1.7, 0, 0, 2.55, 0.06, 0.95, 2.1, 0.02, 0.2,
    1.7, 0, 0, 2.1, 0.02, -0.2, 2.55, 0.06, -0.95,
    1.7, 0.02, 0.08, 2.3, 0.0, 0.0, 1.7, 0.02, -0.08,
  ]
  const fg = new THREE.BufferGeometry()
  fg.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3))
  fg.computeVertexNormals()
  const flip = new THREE.CylinderGeometry(0.0, 0.12, 0.9, 6)
  flip.rotateZ(Math.PI / 2.4)
  flip.translate(-0.8, -0.34, 0.55)
  const flip2 = flip.clone(); flip2.translate(0, 0, -1.1)
  const merged = mergeGeos([body, fg, flip, flip2])
  return merged
}
function mergeGeos(gs: THREE.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = []
  gs.forEach((g) => {
    const gi = g.index ? g.toNonIndexed() : g
    gi.computeVertexNormals()
    pos.push(...Array.from(gi.getAttribute('position').array as ArrayLike<number>))
    nor.push(...Array.from(gi.getAttribute('normal').array as ArrayLike<number>))
  })
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return out
}

function Whale({ phase, z, size, y0, from, to }: { phase: number; z: number; size: number; y0: number; from: number; to: number }) {
  const g = useRef<THREE.Group>(null)
  const geo = useMemo(() => makeWhaleGeo(), [])
  const sang = useRef(false)
  const uni = useMemo(() => ({ uT: { value: 0 }, uPhase: { value: phase }, uVis: { value: 0 } }), [phase])
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: whaleVert, fragmentShader: whaleFrag, uniforms: uni, transparent: true, side: THREE.DoubleSide, depthWrite: false }), [uni])
  useFrame(({ viewport }) => {
    const grp = g.current
    if (!grp) return
    const k = (world.depth - from) / (to - from)
    const on = k > 0 && k < 1
    uni.uT.value = world.t
    const vis = on ? Math.sin(Math.PI * Math.min(1, Math.max(0, k))) ** 0.5 : 0
    uni.uVis.value += (vis - uni.uVis.value) * 0.12
    grp.visible = uni.uVis.value > 0.01
    // one call per pass, as the whale swims into view
    if (uni.uVis.value > 0.3 && !sang.current) { sang.current = true; sound.whale() }
    if (uni.uVis.value < 0.02) sang.current = false
    if (!grp.visible) return
    const vw = viewport.width, vh = viewport.height
    const dir = phase > 3 ? -1 : 1 // swim direction
    const x = dir * (vw * 0.78 - k * vw * 1.56)
    grp.position.set(x, vh * y0 + Math.sin(world.t * 0.4 + phase) * 0.25, z)
    grp.rotation.set(0.05, dir > 0 ? 0 : Math.PI, Math.sin(world.t * 0.3 + phase) * 0.05)
    grp.scale.setScalar(size * (vw < 7 ? 0.6 : 1))
  })
  return (
    <group ref={g} renderOrder={-2}>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * MARINE SNOW: drifting particles with scroll parallax
 * ------------------------------------------------------------------ */
const snowVert = /* glsl */ `
attribute float aSeed; uniform float uT, uScroll, uPx, uH; varying float vA;
void main(){
  vec3 p = position;
  float spd = 0.08 + aSeed*0.22;
  p.y = mod(p.y - uT*spd - uScroll*(0.35 + aSeed) + uH*0.5, uH) - uH*0.5;
  p.x += sin(uT*0.3 + aSeed*20.0)*0.3;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.5 + aSeed*5.5) * uPx * 8.0 / -mv.z;
  vA = 0.12 + aSeed*0.55;
}`
const snowFrag = /* glsl */ `
uniform float uVis; varying float vA;
void main(){ float d = length(gl_PointCoord-0.5); if (d > 0.5) discard; float a = (1.0 - d*2.0) * (1.0 - d*2.0) * vA * uVis; gl_FragColor = vec4(vec3(0.75,0.95,1.0)*a, a); }`

function Snow() {
  const { geo, uni, mat } = useMemo(() => {
    const N = 750
    const pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16
      pos[i * 3 + 2] = -7 + Math.random() * 9
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const u = { uT: { value: 0 }, uScroll: { value: 0 }, uPx: { value: 1 }, uH: { value: 16 }, uVis: { value: 0.3 } }
    const m = new THREE.ShaderMaterial({ vertexShader: snowVert, fragmentShader: snowFrag, uniforms: u, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    return { geo: g, uni: u, mat: m }
  }, [])
  useFrame(({ gl }) => {
    uni.uT.value = world.t
    uni.uScroll.value = world.scrollY * 0.0035
    uni.uPx.value = gl.getPixelRatio()
    uni.uVis.value = 0.25 + world.depth * 0.95
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

/** Watches frame time and trades resolution for smoothness. The water is soft, so this is nearly invisible. */
function Adaptive({ max }: { max: number }) {
  const setDpr = useThree((st) => st.setDpr)
  const acc = useRef({ t: 0, n: 0, dpr: max, calm: 0 })
  useFrame((_s, delta) => {
    const a = acc.current
    a.t += Math.min(delta, 0.25); a.n++
    if (a.n < 40) return
    const avg = a.t / a.n
    a.t = 0; a.n = 0
    if (avg > 0.021 && a.dpr > 0.45) { a.dpr = Math.max(0.45, a.dpr * 0.82); a.calm = 0; setDpr(a.dpr) }
    else if (avg < 0.0125 && a.dpr < max) { if (++a.calm > 4) { a.dpr = Math.min(max, a.dpr * 1.12); a.calm = 0; setDpr(a.dpr) } }
    else a.calm = 0
  })
  return null
}

export default function Scene() {
  return (
    <Canvas
      className="scene"
      dpr={0.85}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 60 }}
      aria-hidden="true"
    >
      <Adaptive max={1} />
      <Water />
      <Snow />
      <Whale phase={0.6} z={-5} size={1.45} y0={0.12} from={0.24} to={0.5} />
      <Whale phase={4.2} z={-11} size={1.1} y0={-0.2} from={0.56} to={0.8} />
      <Jellies />
    </Canvas>
  )
}

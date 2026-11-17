import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {THREE, makeBoy, makeBot, makeDesk, makeRoom, Mood, BotMood} from './world';

export type Cam = {pos: [number, number, number]; look: [number, number, number]; fov: number};
export type ShotState = {
  morning: boolean;
  cam: Cam;
  boy: Partial<Mood> | null;   // null = hidden
  bot: Partial<BotMood> | null;
  botPos?: [number, number, number]; botScale?: number; botRotY?: number;
};
const W = 1080, H = 1920;
const defMood: Mood = {mouth: 0, smile: 0, brow: 0, blink: 0, lookX: 0, lookY: 0, headTilt: 0, headTurn: 0, headNod: 0, armUp: 0, phone: 0, typing: 0, breathe: 0};
const defBot: BotMood = {eyes: 'open', hop: 0, tilt: 0, talk: 0, squash: 0, lookX: 0};

// ONE persistent WebGL canvas for the whole reel; `at(t)` returns the shot state for global time t (s).
export const Stage: React.FC<{at: (t: number) => ShotState}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const world = useMemo(() => {
    const scene = new THREE.Scene();
    const night = makeRoom(false), day = makeRoom(true); scene.add(night, day);
    scene.add(makeDesk());
    const boy = makeBoy(); boy.root.position.set(0, 2.55, -2.35); scene.add(boy.root);
    const bot = makeBot(); scene.add(bot.root);
    const mk = (m: boolean) => {
      const g = new THREE.Group();
      g.add(new THREE.HemisphereLight(m ? '#ffe6cf' : '#5a6aa8', m ? '#a0705c' : '#2a1c22', m ? 1.3 : 0.75));
      const key = new THREE.PointLight(m ? '#ffd2a8' : '#ffa25a', m ? 40 : 75, 30, 1.6); key.position.set(-3.2, 4.6, 2.5); g.add(key);
      const sh = new THREE.SpotLight(m ? '#fff0e0' : '#ffb070', m ? 30 : 45, 40, 0.75, 0.6, 1.4); sh.position.set(-4, 9, 7); sh.target.position.set(-0.5, 1.5, -1); sh.castShadow = true; sh.shadow.mapSize.set(1024, 1024); sh.shadow.bias = -0.0008; g.add(sh, sh.target);
      const rim = new THREE.DirectionalLight(m ? '#fff4e4' : '#6f8dff', m ? 1.6 : 2.2); rim.position.set(6, 6, -4); g.add(rim);
      const fill = new THREE.DirectionalLight(m ? '#ffffff' : '#ffc9a8', m ? 1.0 : 0.55); fill.position.set(0, 3, 8); g.add(fill);
      scene.add(g); return g;
    };
    const lightsN = mk(false), lightsD = mk(true);
    scene.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.fog = new THREE.Fog('#0c1330', 14, 30);
    const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    return {scene, boy, bot, camera, night, day, lightsN, lightsD};
  }, []);
  const renderer = useRef<any>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!renderer.current) {
      const r = new THREE.WebGLRenderer({canvas: ref.current, antialias: true, preserveDrawingBuffer: true});
      r.setSize(W, H, false); r.setPixelRatio(1);
      r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.outputColorSpace = THREE.SRGBColorSpace; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.current = r;
    }
    const t = frame / fps;
    const s = at(t);
    const {scene, boy, bot, camera, night, day, lightsN, lightsD} = world;
    night.visible = lightsN.visible = !s.morning; day.visible = lightsD.visible = s.morning;
    const bg = s.morning ? '#e8c3a4' : '#0c1330';
    scene.background = new THREE.Color(bg); scene.fog.color = new THREE.Color(bg);
    boy.root.visible = !!s.boy;
    if (s.boy) boy.set({...defMood, breathe: t, ...s.boy});
    bot.root.visible = !!s.bot;
    if (s.bot) { bot.root.position.set(...(s.botPos ?? [-2.3, 0, 1.0])); bot.root.scale.setScalar(s.botScale ?? 0.7); bot.root.rotation.y = s.botRotY ?? 0.35; bot.set({...defBot, ...s.bot}, t); }
    const c = s.cam;
    camera.fov = c.fov; camera.position.set(...c.pos); camera.lookAt(...c.look); camera.updateProjectionMatrix();
    renderer.current.render(scene, camera);
  }, [frame, fps, at, world]);

  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />;
};

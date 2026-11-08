import React from 'react';
import {AbsoluteFill, Composition, Img, registerRoot, staticFile, useVideoConfig} from 'remotion';
import {GlowBg, GlowCover, GlowLines, GlowTile, type GlowCoverProps} from '../brand/GlowCover';
import {GlowWide} from '../brand/GlowWide';

const props: GlowCoverProps = {
  variant: 'glow', line1: '35B AI Model', line2: '3 GiB Active?',
  leftLogo: {text: '35B', color: '#fff', bg: 'linear-gradient(150deg,#194e80,#072139)', glow: '#29d4e7'},
  rightLogo: {text: 'SSD', color: '#fff', bg: 'linear-gradient(150deg,#5f3899,#21123f)', glow: '#af84ff'},
};

const Cover: React.FC = () => {
  const {height, width} = useVideoConfig();
  if (width > height) return <GlowWide {...props}/>;
  if (height === 1920) return <GlowCover {...props}/>;
  const square = height === 1080;
  const scale = square ? .47 : .62;
  const poseTop = square ? 275 : 355;
  const tile = square ? 220 : 264;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <GlowBg/>
    <div style={{position: 'absolute', top: square ? 435 : 560, left: 32}}><GlowTile logo={props.leftLogo} size={tile} rotate={-9}/></div>
    <div style={{position: 'absolute', top: square ? 435 : 560, right: 32}}><GlowTile logo={props.rightLogo} size={tile} rotate={9}/></div>
    <Img src={staticFile('glow/pose-B-cut.png')} style={{position: 'absolute', width: 1072 * scale, height: 1920 * scale, left: (1080 - 1072 * scale) / 2, top: poseTop}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: square ? 70 : 100, display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 18}}>
      <GlowLines line1={props.line1} line2={props.line2} sizes={[160, 120]} maxWidths={[1000, 990]}/>
    </div>
  </AbsoluteFill>;
};

registerRoot(() => <>
  {[[1080,1920],[1080,1440],[1080,1350],[1080,1080],[1280,720]].map(([width,height]) =>
    <Composition key={`${width}x${height}`} id={`EdgeCover${width}x${height}`} component={Cover} durationInFrames={1} fps={30} width={width} height={height}/>
  )}
</>);

import React from 'react';
import {AbsoluteFill, Composition, Img, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {GlowBg, GlowCoverProps, GlowLines, GlowTile} from './GlowCover';
import {GlowWide} from './GlowWide';
import {LOGO} from './glowCovers';
import {GLOW} from './tokens';

loadFont({family: 'BrInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});

// Review-only covers preserve the glow template while keeping both lines and the
// complete head inside the smallest grid crop. Existing published covers are untouched.
type Props = GlowCoverProps & {cropY?: number; scale?: number};
const asset = (src?: string) => src?.startsWith('static:') ? staticFile(src.slice(7)) : src;
const resolveAssets = (props: Props): Props => ({...props,
  leftLogo: {...props.leftLogo, src: asset(props.leftLogo.src), mask: asset(props.leftLogo.mask)},
  rightLogo: {...props.rightLogo, src: asset(props.rightLogo.src), mask: asset(props.rightLogo.mask)},
  pose: props.pose ? {...props.pose, src: asset(props.pose.src)!} : undefined});
const Cover: React.FC<Props> = ({cropY = 0, scale = 1, ...input}) => {
  const props = resolveAssets(input);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
  <GlowBg/>
  <div style={{position: 'absolute', width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: '0 0', top: -cropY * scale}}>
    <div style={{position: 'absolute', left: 106.5, top: 831.3}}><GlowTile logo={props.leftLogo} size={251.6} rotate={-9}/></div>
    <div style={{position: 'absolute', left: 721.9, top: 831.3}}><GlowTile logo={props.rightLogo} size={251.6} rotate={9}/></div>
    <Img src={props.pose?.src ?? staticFile(GLOW.pose.src)} style={{position: 'absolute', left: (1080 - 1072 * .612) / 2, top: 664.7, width: 1072 * .612, height: 1920 * .612,
      maskImage: 'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, #000 72%, transparent)', maskComposite: 'intersect'}}/>
    <div style={{position: 'absolute', top: 425, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15.3}}>
      <GlowLines line1={props.line1} line2={props.line2} sizes={[149.6, 112.2]} maxWidths={[858.5, 850]}/>
    </div>
  </div>
</AbsoluteFill>;
};
const Wide: React.FC<Props> = props => <GlowWide {...resolveAssets(props)}/>;

const props: Props = {variant: 'glow', line1: 'Claude Killed', line2: 'Instagram',
  leftLogo: LOGO.claude, rightLogo: LOGO.instagram,
  pose: {src: staticFile('growth-revision-20261108/cover-pose.png')}};
const asComponent = Cover as React.FC<Record<string, unknown>>;
const Root = () => <>
  <Composition id="ReviewPortrait" component={asComponent} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={props}/>
  <Composition id="ReviewLinkedIn" component={asComponent} width={720} height={1280} fps={30} durationInFrames={1} defaultProps={{...props, scale: 2 / 3}}/>
  <Composition id="ReviewGrid" component={asComponent} width={1080} height={1440} fps={30} durationInFrames={1} defaultProps={{...props, cropY: 240}}/>
  <Composition id="ReviewFeed" component={asComponent} width={1080} height={1350} fps={30} durationInFrames={1} defaultProps={{...props, cropY: 285}}/>
  <Composition id="ReviewSquare" component={asComponent} width={1080} height={1080} fps={30} durationInFrames={1} defaultProps={{...props, cropY: 420}}/>
  <Composition id="ReviewWide" component={Wide as React.FC<Record<string, unknown>>} width={1280} height={720} fps={30} durationInFrames={1} defaultProps={props}/>
</>;
registerRoot(Root);

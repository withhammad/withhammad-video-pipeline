import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import {Clone,type CloneProps} from './Clone';
import {CloneV2} from './CloneV2';
import props from './clone.preflight.json';
import '../fonts';
const meta=({props:p}:{props:CloneProps})=>({durationInFrames:Math.ceil(p.duration*30)});
registerRoot(()=> <>
 <Composition id="CLONE" component={(p:CloneProps)=><AbsoluteFill><Clone {...p}/></AbsoluteFill>} width={1080} height={1920} fps={30} durationInFrames={1647} defaultProps={props as unknown as CloneProps} calculateMetadata={meta}/>
 <Composition id="CLONE2" component={(p:CloneProps)=><AbsoluteFill><CloneV2 {...p}/></AbsoluteFill>} width={1080} height={1920} fps={30} durationInFrames={1647} defaultProps={props as unknown as CloneProps} calculateMetadata={meta}/>
</>);

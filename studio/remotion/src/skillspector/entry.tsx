import {Still, registerRoot} from 'remotion';
import {SkillSpectorInfographic, type InfographicProps} from './Infographic';
// Public dir: studio/.local/jobs/skillspector-infographic/public (nvidia.png, avatar.jpg, props/*.png).
registerRoot(() => <Still id="SKILLSPECTOR-INFOGRAPHIC" component={SkillSpectorInfographic} width={1080} height={1350}
  defaultProps={{score: 35} as InfographicProps}/>);

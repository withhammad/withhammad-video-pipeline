import { MyComposition } from "./Composition";
import { ExplainerComposition } from "./explainer/Explainer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <ExplainerComposition />
    </>
  );
};

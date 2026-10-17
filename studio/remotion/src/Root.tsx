import { Still } from "remotion";
import { MyComposition } from "./Composition";
import {
  Cover,
  CoverSheet,
  calculateCoverMetadata,
  calculateCoverSheetMetadata,
  coverDefaults,
  coverSheetDefaults,
  SHEET_W,
  sheetHeight,
} from "./Cover";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Still
        id="Cover"
        component={Cover}
        width={1080}
        height={1920}
        defaultProps={coverDefaults}
        calculateMetadata={calculateCoverMetadata}
      />
      <Still
        id="CoverSheet"
        component={CoverSheet}
        width={SHEET_W}
        height={sheetHeight(3)}
        defaultProps={coverSheetDefaults}
        calculateMetadata={calculateCoverSheetMetadata}
      />
    </>
  );
};

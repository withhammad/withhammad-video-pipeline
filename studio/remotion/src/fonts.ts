import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// OFL-licensed fonts shipped in public/fonts (licences alongside). Loaded once, before any frame renders.
export const fontsReady = Promise.all([
  loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-800-normal.woff2"), weight: "800" }),
  loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-600-normal.woff2"), weight: "600" }),
  loadFont({ family: "Instrument Serif", url: staticFile("fonts/instrument-serif-latin-400-italic.woff2"), style: "italic", weight: "400" }),
]);

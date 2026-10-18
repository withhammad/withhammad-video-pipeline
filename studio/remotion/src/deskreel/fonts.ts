import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { fontsReady } from "../fonts";

// OFL fonts from fontsource, vendored in public/fonts with their licence files (OFL-*.txt). Archivo Black is the
// FDE reel's heavy grotesque, Titan One the stack reel's bubbly display, Lilita One a narrower rounded display for the
// values, Comfortaa its rounded small text, Source Serif 4 our stat cards, Noto Color Emoji every emoji (never a
// system emoji font). studio/app/deskreel_fonts.json holds their advance widths and coverage for the text-fit check.
// loadFont wraps each face in delayRender, so no frame renders before every face is ready.
export const EMOJI_FAMILY = "Noto Color Emoji";

export const deskFontsReady = Promise.all([
  fontsReady,
  loadFont({ family: "Archivo Black", url: staticFile("fonts/archivo-black-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "Titan One", url: staticFile("fonts/titan-one-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "Lilita One", url: staticFile("fonts/lilita-one-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "Comfortaa", url: staticFile("fonts/comfortaa-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "Comfortaa", url: staticFile("fonts/comfortaa-latin-700-normal.woff2"), weight: "700" }),
  loadFont({ family: "Source Serif 4", url: staticFile("fonts/source-serif-4-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: "Source Serif 4", url: staticFile("fonts/source-serif-4-latin-700-normal.woff2"), weight: "700" }),
  loadFont({ family: "Source Serif 4", url: staticFile("fonts/source-serif-4-latin-700-italic.woff2"), weight: "700", style: "italic" }),
  loadFont({ family: EMOJI_FAMILY, url: staticFile("fonts/noto-color-emoji-400-normal.woff2"), weight: "400" }),
]);

/** CSS font stack: the named face first, then the vendored emoji font. edit_deskreel.validate() refuses any character
 *  neither covers, so the generic fallback is never reached. */
export const fontStack = (family: string) => `'${family}', '${EMOJI_FAMILY}', sans-serif`;

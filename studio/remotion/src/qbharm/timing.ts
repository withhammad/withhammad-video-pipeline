// Timing of the QB-HARM reel, in frames at 30 fps, measured on the reference's own audio (its stereo AAC track, decoded to
// 26.355 s). Words: faster-whisper large-v3 read-backs (prompted and not); edges checked on a 50 ms loudness envelope and
// two spectrograms (ref/spec_open.png, ref/spec_end.png).
// The recording: silence (a click at 1.10) | voice from 1.40: «إِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّ» 1.40-4.50 | «فَلَا كَاشِفَ لَهُۥٓ إِلَّا
// هُوَ» 4.50-14.70, then the waqf (ۖ) dip 14.75-15.05 | «وَإِن يُرِدْكَ بِخَيْرٍ» 15.05-18.02 | «فَلَا رَآدَّ لِفَضْلِهِۦ» 18.02-26.25
// (the voice stops sharply at 26.25, the reference's own cut at the ۚ) | silence to 26.36.
// The reference is ONE continuous shot (no cuts): the pose changes here are slow dissolves, placed on word edges:
//   2.52 «يَمْسَسْكَ|ٱللَّهُ» | 8.54 «كَاشِفَ|لَهُۥٓ» | 15.66 «وَإِن|يُرِدْكَ» | 21.50 inside the long madd of «رَآدَّ»
export const POSE: [string, number][] = [
  ['shots/s01-sad.jpg', 0], ['shots/s02-listen.jpg', 76], ['shots/s03-calm.jpg', 256], ['shots/s04-hope.jpg', 470],
  ['shots/s03-calm.jpg', 645]];
export const DIS = 20;                         // dissolve length, centred on the pose frame
export const HOOK_END = 72;                    // the hook alone from frame 0, gone at 2.4 s
export const VOICE_IN = 42;                    // 1.40 s
// the heart: broken until «فَلَا» (4.50 s), the halves close and it is mended by 5.0 s ("there is no remover of it ..."),
// it starts to glow on «كَاشِفَ» (7.54 s) and glows full on «إِلَّا هُوَ» (12.52 s, "... except Him")
export const MEND_START = 135, MEND = 150, GLOW_START = 226, GLOW_FULL = 376;
// phrases on screen: [phrase id, first frame, end frame]
export const PH: [string, number, number][] = [['A', VOICE_IN, 135], ['B', 135, 446], ['C', 451, 541], ['D', 541, 790]];
export const REC_END_F = 790;                  // 26.33 s: the voice stopped at 26.25
export const TOTAL_F = REC_END_F + 105;        // + a 3.5 s end card (the file's own silence, then padding)

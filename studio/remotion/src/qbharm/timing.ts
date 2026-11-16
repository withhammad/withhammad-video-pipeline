// Timing of the QB-HARM reel, in frames at 30 fps. Audio (public/audio.wav): 1.00 s of silence (room for the hook), then
// the whole of Mishary Alafasy's Yunus 10:107 (everyayah.com Alafasy_128kbps/010107.mp3, 32.85 s), untouched.
// Words: faster-whisper large-v3 read-backs (prompted and not, both 24/24 words); pauses on a 100 ms loudness envelope.
// On the Alafasy file: «وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّ» 0.0-4.0 | «فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ» 4.0-10.7, waqf ۖ pause 10.7-11.0 |
// «وَإِن يُرِدْكَ بِخَيْرٍ» 11.0-13.8 | «فَلَا رَآدَّ لِفَضْلِهِۦ» 13.8-20.0, waqf ۚ pause 20.0-20.4 | «يُصِيبُ بِهِۦ مَن يَشَآءُ مِنْ
// عِبَادِهِۦ» 20.4-26.8, waqf ۚ pause 26.8-27.1 | «وَهُوَ ٱلْغَفُورُ ٱلرَّحِيمُ» 27.1-32.5, reverb out by 32.85.
// Frames below = 30 (the lead silence) + seconds x 30.
// The reference is ONE continuous shot (no cuts): the pose changes are slow dissolves, placed on word edges:
//   «ٱللَّهُ» 2.16 | «لَهُۥٓ» 6.68 | «يُرِدْكَ» 11.88 | the ۚ pause 20.2 | the ۚ pause 26.95
export const AUDIO_LEAD = 30;
export const POSE: [string, number][] = [
  ['shots/s01-sad.jpg', 0], ['shots/s02-listen.jpg', 95], ['shots/s03-calm.jpg', 230], ['shots/s04-hope.jpg', 386],
  ['shots/s03-calm.jpg', 636], ['shots/s02-listen.jpg', 838]];
export const DIS = 20;                         // dissolve length, centred on the pose frame
export const HOOK_END = 72;                    // the hook from frame 0, gone at 2.4 s
export const VOICE_IN = 30;                    // 1.00 s
// the heart: broken until «فَلَا» (4.0 s), the halves close and it is mended by 4.5 s ("there is no remover of it ..."),
// it starts to glow on «كَاشِفَ» (5.58 s) and glows full on «إِلَّا هُوَ» (8.92 s, "... except Him")
export const MEND_START = 150, MEND = 165, GLOW_START = 197, GLOW_FULL = 298;
// phrases on screen: [phrase id, first frame, end frame]
export const PH: [string, number, number][] = [
  ['A', VOICE_IN, 150], ['B', 150, 351], ['C', 360, 444], ['D', 444, 636], ['E', 642, 834], ['F', 843, 1010]];
export const REC_END_F = 1010;                 // 33.67 s: «ٱلرَّحِيمُ» and its reverb are done (32.5-32.7 s on the file)
export const TOTAL_F = REC_END_F + 105;        // + a 3.5 s end card (the file's own tail, then padding)

// Timing of the QB-REPEL reel, in frames at 30 fps, measured on the reference's own audio (its stereo track, decoded to
// 31.093 s). Words: faster-whisper large-v3 (two full read-backs + one read-back per phrase window); edges refined on the
// 250-3000 Hz envelope (10 ms hops) of the recitation, which never falls silent (reverb), so every edge is a dip.
// The reciter (Hafs): A 0.00-3.38 | B 3.38-5.68 | C 5.70-9.98 (pause) | C again 9.98-13.33, joined (ikhfa) to
// D 13.33-17.25 (pause 17.25-17.65) | E 17.65-23.62 (pause 23.62-23.96) | F 23.96-30.05, then silence to the end of the file.
// Picture cuts, each on a dip between two words (never inside a word):
//   2.30 the onset of «ٱلسَّيِّئَةُ» | 3.38 pause A/B | 4.70 «بِٱلَّتِى|هِىَ» | 5.68 pause B/C | 7.66 «بَيْنَكَ|وَبَيْنَهُۥ» |
//   9.98 pause C/C | 11.54 «بَيْنَكَ|وَبَيْنَهُۥ» | 13.33 the /k/ closure of «عَدَٰوَةٌ|كَأَنَّهُۥ» | 15.30 «كَأَنَّهُۥ|وَلِىٌّ» |
//   17.40 pause D/E | 19.06 the glottal onset of «يُلَقَّىٰهَآ|إِلَّا» | 22.70 «ٱلَّذِينَ|صَبَرُوا۟» | 27.30 «إِلَّا|ذُو»
export const CUT = [69, 101, 141, 170, 230, 299, 346, 400, 459, 522, 572, 681, 819];
export const HOOK_END = 72;                   // the hook alone on frame 0, gone at 2.4 s
// phrases on screen: [phrase id, first frame, end frame]; the repeated C keeps its text and only pulses
export const PH: [string, number, number][] = [
  ['A', 12, 101], ['B', 101, 170], ['C', 170, 299], ['C', 299, 400], ['D', 400, 522], ['E', 522, 714], ['F', 714, 903]];
export const REC_END_F = 903;                 // 30.10 s: the recitation's reverb has died (-48 dB dip at 30.09 s)
export const TOTAL_F = REC_END_F + 105;       // + a 3.5 s end card (the file's own silence, then padding)

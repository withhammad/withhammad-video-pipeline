// Exact text for the private knitted "Dua for a child slow to speak" reel (DUA-KNIT), for the owner's wife (@heal.ingthroughquran).
// Reference DgL4E_JTUV5 (@tinytalesof_ashmal): a SILENT 15 s slideshow (no audio stream), cover + 4 duas.
// Quran text = api.quran.com text_uthmani (checked against alquran.cloud quran-uthmani / Tanzil: same letters and marks, Tanzil
// only adds the open tanween sign U+06ED), saved in the job at src/quran.json. English = Saheeh International (brackets removed).
// FIX vs the reference: its slide 4 (Quran 3:38) leaves out «طَيِّبَةً»; here the ayah is complete.
// Dua 2 has no Quran or sound-hadith source for this wording, so it is labelled honestly.
// Dua 3: Sahih Ibn Hibban 974 (Anas), graded sahih by al-Albani (as-Silsilah as-Sahihah 2886); the wording here is the
// Hisn al-Muslim one, which matches one Ibn Hibban manuscript.
export type Dua = {n: number; ar: string[]; tr: string; en: string; src: string; tip: string};

export const DUAS: Dua[] = [
  {n: 1,
    ar: ['رَبِّ ٱشْرَحْ لِى صَدْرِى ﴿٢٥﴾', 'وَيَسِّرْ لِىٓ أَمْرِى ﴿٢٦﴾', 'وَٱحْلُلْ عُقْدَةً مِّن لِّسَانِى ﴿٢٧﴾', 'يَفْقَهُوا۟ قَوْلِى ﴿٢٨﴾'],
    tr: 'Rabbi-shraḥ lī ṣadrī, wa yassir lī amrī, waḥlul ʿuqdatan min lisānī, yafqahū qawlī',
    en: 'My Lord, expand for me my breast, ease for me my task, and untie the knot from my tongue, that they may understand my speech.',
    src: 'Quran 20:25–28 · the dua of Musa (AS)', tip: 'Asks Allah to untie the knot of the tongue'},
  {n: 2,
    ar: ['رَبِّ يَسِّرْ وَلَا تُعَسِّرْ', 'وَتَمِّمْ بِالْخَيْرِ'],
    tr: 'Rabbi yassir wa lā tuʿassir wa tammim bil-khayr',
    en: 'My Lord, make it easy, do not make it hard, and complete it with good.',
    src: 'A commonly recited dua · not a Quran verse or hadith wording, its meaning is good', tip: 'For ease in every new word'},
  {n: 3,
    ar: ['اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا', 'وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا'],
    tr: 'Allāhumma lā sahla illā mā jaʿaltahu sahlā, wa anta tajʿalul-ḥazna idhā shiʾta sahlā',
    en: 'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You will.',
    src: 'Sahih Ibn Hibban 974 · sahih (al-Albani)', tip: 'When speaking feels hard'},
  {n: 4,
    ar: ['رَبِّ هَبْ لِى مِن لَّدُنكَ', 'ذُرِّيَّةً طَيِّبَةًۖ', 'إِنَّكَ سَمِيعُ ٱلدُّعَآءِ'],
    tr: 'Rabbi hab lī min ladunka dhurriyyatan ṭayyibah, innaka samīʿud-duʿāʾ',
    en: 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.',
    src: 'Quran 3:38 · the dua of Zakariya (AS)', tip: 'For a righteous child who remembers Allah'},
];

export const HANDLE = '@heal.ingthroughquran';

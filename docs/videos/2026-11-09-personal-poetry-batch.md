# Personal poetry edits — 9 November

Owner: “Separate personal edits.” Later clarification: personal status use only, no business uploads, no cartoons for this batch. Use cinematic imagery/motion graphics, original sound and captions. These are deliberately excluded from the business inbox and queue.

All eleven distinct URLs were inspected in the existing Chrome and downloaded. No identical file hashes in this batch. Shared poetry themes are intentional. The urgent Dikhawa reference was moved first at the owner’s request.

| Reference | Working label | Source length | Status |
|---|---|---:|---|
| [DfT3T7Iy8F_](https://www.instagram.com/reel/DfT3T7Iy8F_/) | Courage and spirit | 25.63s | Full personal MP4 + SRT finished |
| [DfRSqTbR_1a](https://www.instagram.com/reel/DfRSqTbR_1a/) | A single gesture | 22.47s | Full personal MP4 + SRT finished |
| [DfLqb8qtYRh](https://www.instagram.com/reel/DfLqb8qtYRh/) | Kaaba and prostrations | 27.33s | Full personal MP4 + SRT finished |
| [DfJyYbJyJ2L](https://www.instagram.com/reel/DfJyYbJyJ2L/) | Deserts and seas | 23.40s | Full personal MP4 + SRT finished |
| [DfGsUSvSKvt](https://www.instagram.com/reel/DfGsUSvSKvt/) | Seek them with the beloved lamp | 23.43s | Full personal MP4 + SRT finished |
| [DfBVYpUMJAw](https://www.instagram.com/reel/DfBVYpUMJAw/) | Hardships of struggle | 62.88s | Full personal MP4 + SRT finished |
| [De-zAp8M8iN](https://www.instagram.com/reel/De-zAp8M8iN/) | Gate of Khaibar | 22.27s | Full personal MP4 + SRT finished |
| [De56ZCoMpvv](https://www.instagram.com/reel/De56ZCoMpvv/) | Message of oneness | 23.70s | Full personal MP4 + SRT finished |
| [DfFKSo_PYdt](https://www.instagram.com/reel/DfFKSo_PYdt/) | Diyar-e-ishq mein apna maqam | 28.21s | Full personal MP4 + SRT finished |
| [DdYT44ixsZ6](https://www.instagram.com/reel/DdYT44ixsZ6/) | Saada dil bande kidhar jaayein | 29.12s | Full personal MP4 + SRT finished |
| [DdS2umGNd5m](https://www.instagram.com/reel/DdS2umGNd5m/) | Dikhawa — urgent personal status | 11.86s | Full video + image delivered |

Urgent deliverable: chat workspace outputs/Personal-Dikhawa/Dikhawa-full-video.mp4, plus Dikhawa-status.png and captions.srt. Full original sound is retained byte for byte. The image treatment is photorealistic, with a slow camera move and timed Urdu captions; no character-walking animation is claimed. Source acquisition, transcript and render evidence: work/personal-references-20261109.

Separate earlier valley film: owner approved its 5.76-second genuine Blender walking sample. Its full 35.409-second film is finished; see docs/videos/2026-11-09-personal-iqbal.md.


## Delivery — 10 November

All ten remaining files are in chat `outputs/Personal-Poetry` and `~/Downloads/10 November/Personal`. `watch.html` plays the full 12-file collection (including Dikhawa and the valley film); `START-HERE.md` links every MP4. No publishing or scheduling.

The first eight retain original moving insets over a new photorealistic Hammad courtyard scene. The last two use full-screen photographic scenes and camera moves. Captions: corrected published Urdu and new English renderings. No new narration or cartoons. Original music/recitation is retained; nine tracks are byte-identical, while Safha-e-Dahr gets a constant −1 dB gain to meet the peak ceiling. Maarka-Ara preserves the complete 62.878-second source, which ends mid-verse.

Reproduce: `studio/heavy.sh studio/.venv/bin/python work/personal-references-20261109/finish-batch.py [reference-id ...]`. Visual review precedes `deliver.py`. Source spec, caption times, crops and wording are in `work/personal-references-20261109/spec.md` and `studio/remotion/src/personal-iqbal/poetry-data.ts`. All 10 films have 1 fps filmstrips and per-file audio/frame/hash proof. Studio suite: 646 passed; new Remotion sources pass ESLint. Full-tree TypeScript reports 23 pre-existing diagnostics outside these changes.

Final gain correction proof: Safha-e-Dahr −15.15 LUFS / −1.89 dBTP, decoded correlation 0.999906 and zero sample offset at 16 kHz. Other nine new poetry tracks measure −14.02 to −14.28 LUFS and peak below −3.3 dBTP. All 12 Download copies match their final SHA256 values; every viewing-page link resolves. Collection proof: `outputs/personal/reviews/2026-11-10-collection.json`.

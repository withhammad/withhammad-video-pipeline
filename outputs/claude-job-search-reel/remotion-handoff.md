# Remotion handoff — graphics ready, avatar rejected

Entry: `studio/remotion/src/job-search/index.tsx` · composition `JobSearch` · 1080×1920 · 30fps.
Preview: http://localhost:3119/JobSearch (open in Google Chrome).

The current user rejected the generated avatar. Defaults remain `avatar: ""`, `draftMode: true`. Do not use video `ab4754f5b1ec88be3acd14c4dff02bc9` for the final cut. No final video has been rendered. Review images contain an explicitly labeled pending-presenter card.

## Layout

330×587 presenter PIP at x670,y1213, rounded 28px, object-fit contain. Main graphics are above it; captions use x80,y1375,width530 so they cannot overlap the presenter. Branding sits x80 near the bottom. Main titles use Source Serif4, supporting copy Inter; both are existing vendored OFL fonts. All fictional resume/role/form material says ILLUSTRATIVE EXAMPLE.

## Props

```json
{
  "avatar": "job-search/approved-avatar.mp4",
  "duration": 69,
  "beats": [0, 12, 21, 27, 36, 45, 52, 57, 64],
  "captions": [],
  "docsVideo": "job-search/playwright-docs.mp4",
  "draftMode": false,
  "avatarPosition": "center"
}
```

These are interface examples, not approved production values. Avatar may be public-relative or HTTPS. Duration and nine scene starts are seconds. Beat order: hook,connect,criteria,research,shortlist,draft,permissions,review,CTA. Actual speech must determine final times. Caption entries accept Remotion Caption `{text,startMs,endMs,timestampMs,confidence}` or existing pipeline `{text,start,end}` in seconds. Phrase captions of 3–5 words fit the lower-left region; word timings also display, one active item at a time. Captions share the presenter timeline, so move/trim that sequence as a unit. The completed avatar is the audio source.

## Assets and verification

- Real official Microsoft documentation capture: `shots/01-playwright-docs.mp4`, 1080×720, 9.78s. Public copy: `studio/remotion/public/job-search/playwright-docs.mp4`.
- Nine scene PNG reviews and contact sheet: `previews/`. The review caption snippets are layout checks, not aligned final speech.
- Independent scene compositions available in JobSearch-Scenes.
- Entry compiles with a targeted TypeScript check. Whole-repository check also found an unrelated unused Img import in `src/claudeedit/full.tsx`; it was left untouched.
- No shared Root.tsx was edited. No final MP4, upload, application submission or commit performed.

Before a final render: receive approved replacement, stage it in public/job-search, supply final captions/beats/duration, set draftMode false, verify docs beat remains within the recording or adjust the clip, render and inspect all scene/caption transitions.

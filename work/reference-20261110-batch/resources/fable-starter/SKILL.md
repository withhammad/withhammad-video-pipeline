---
name: creative-scene-starter
description: Plan, build and inspect one small interactive or rendered scene from a concrete brief. Never promise a one-shot result or spend on external generation without approval.
---

# Creative scene starter

This is a WITHHAMMAD starter workflow, not the source creator's proprietary skill. It is usable with a coding
assistant and local tools; model access, compute and external generation services may have costs.

1. Read the brief and existing project. Write `scene-plan.md`: subject, setting, camera, interactions, aspect ratio,
   duration, visual style, reference provenance, free assets and success criteria. Identify unsupported assumptions.
2. Choose the appropriate build. Use Blender for rendered 3D shots. Use Three.js/WebGL when a browser interaction
   is required. Do not silently substitute a video for an interactive scene or call a paid image/video API.
3. Create one small working scene first. Keep the source editable and deterministic; use named objects, clear
   parameters and a seed for any randomness. Show an early still or short preview before the full render.
4. Validate the actual artifact: missing textures, camera clipping, lighting, geometry intersections, readable
   text, frame rate, memory, interactions and audio. State which checks ran and which did not.
5. Fix observed defects, preserving the approved direction. Do not regenerate assets merely to try a variation.
6. Deliver the source, a README with exact run commands, the preview, license/provenance notes and `review.md`.
   Do not claim a successful build until the commands run and the output has been inspected. Do not publish.

## Example scene brief

Build a compact cyberpunk street scene inspired by rainy city nights, with original signs and no real brands.
Use blue and amber light, wet pavement, a narrow camera path and subtle atmospheric movement. The browser version
must support dragging to look around, a pause control and keyboard focus. Keep the first build small enough for an
ordinary laptop. Use procedural materials and free assets only. Report frame rate and any shortcuts. For a rendered
version, create a 1080×1920, 30fps Blender clip with a smooth five-second camera move and save the `.blend` file.

No promise of one-click perfection: inspect the actual output and revise the specific defect.

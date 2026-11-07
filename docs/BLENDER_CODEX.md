# Blender connection and rendering

Installed 8 November 2026 for the owner's 3D/cartoon workflow.

- Blender: `/Applications/Blender.app/Contents/MacOS/Blender`, verified **5.2.3 LTS**.
- Free MIT integration: [MCP for Blender](https://github.com/ahujasid/mcp-for-blender), package pinned to **2.2.7**.
- Addon: `~/Library/Application Support/Blender/5.2/scripts/addons/blender_mcp.py`, enabled in saved preferences.
- Bridge: **127.0.0.1:9876**, starts automatically while Blender is open. Telemetry disabled.
- Codex: `~/.codex/config.toml`, server `blender`, command `/Users/hammad/.local/bin/uvx`, arguments
  `--python 3.11 mcp-for-blender==2.2.7`. Existing server entries preserved.

The configured stdio MCP server was initialized and advertised nine tools. `get_scene_info` read the live Blender
scene; `execute_blender_code` created the separate `WITHHAMMAD_MCP_PROOF` scene and returned Blender version,
1080x1920 and 30 fps. Proof: `work/codex-takeover/blender-mcp-proof.json`. The current Codex chat's native tool list
may require an app restart to discover the new server. The stdio client and headless renderer work immediately.

Headless verification ran through the shared heavy-command lock:

```sh
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P work/codex-takeover/enable-blender.py
```

The original, free-asset boxing test uses procedural geometry, lighting, camera animation and keyed arms, head
recoil and sparks. Its source is `studio/blender/growth-hook/build.py`; it is an engineering/animation test, not
an approved production reel. Render a still before the full sequence:

```sh
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/growth-hook/build.py -- work/blender-render/growth-hook preview
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b work/blender-render/growth-hook/growth-hook.blend -a
```

The rendered test was completed and shown in chat: 90 frames, 3.000 seconds, 1080x1920, 30 fps, H.264 limited range,
with original synthesized music and an impact sound. Final measured loudness: -14.0 LUFS, true peak -5.7 dBFS.
The 4 fps filmstrip was inspected. The second render process explicitly enabled the Apple M1 Pro Metal device;
Cycles device preferences must be set in each background process, because the scene alone does not persist them.
Use the local `work/codex-takeover/resume-blender.py` example to resume after the last complete PNG.

Remotion's GROWTH composition accepts optional `takeFile`, `voiceFile` and `blenderHook` paths in its timing data.
These let the revision use separate assets while previous exports and source takes remain available. The
composition bundled successfully, and all 625 studio tests passed (one existing deprecation warning).

Use Blender for reference shots containing 3D objects, cartoons or 3D animation; composite the rendered plate into
the corresponding Remotion/HyperFrames beat. Preserve the reference's framing, motion and timing. The avatar take
is only one layer: captions, animation, recordings, music and the full six-gate review remain mandatory. Never
reset an owner's open Blender scene; construct each shot in a separate headless process or a new named scene.

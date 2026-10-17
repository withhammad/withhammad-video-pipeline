import type { Caption } from "@remotion/captions";

export type Scene =
  | { type: "title"; startMs: number; endMs: number; line1: string; line2: string; image?: string }
  | { type: "split"; startMs: number; endMs: number; image: string; zoomFrom?: number; zoomTo?: number; panY?: [number, number] }
  | { type: "broll"; startMs: number; endMs: number; image: string }
  | { type: "end"; startMs: number; endMs: number; word: string };

export type EditProps = {
  avatar: string;
  captions: Caption[];
  emphasis: string[];
  scenes: Scene[];
  durationMs: number;
};

export const defaultEdit: EditProps = {
  avatar: "avatar.mp4",
  captions: [],
  emphasis: [],
  scenes: [],
  durationMs: 5000,
};

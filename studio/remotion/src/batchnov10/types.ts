export type Word = {text: string; startMs: number; endMs: number};
export type Segment = {start: number; end: number; ref: [number, number]; camera: boolean; avatarStart: number};
export type BatchProps = {
  job: string; keyword: 'HIGGS' | 'ADVISOR'; duration: number; draft: boolean;
  voice?: string; avatar?: string; words: Word[]; segments: Segment[];
  timingSource?: 'preflight' | 'recorded'; voiceVerified?: boolean; avatarVerified?: boolean;
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GuideDoc} from '../brand/GuideDoc';
import {BLUE, CARD_H, Infographic, NAVY, PITCH, ROW0, STAGES} from './Infographic';

const FONT = 'CbInter, Inter, Arial, sans-serif';

// 9:16 for Reels / TikTok / Shorts: 2-line hook from frame 0, then the seven stage cards (no inner header) at 0.9,
// brand row under them. Everything sits inside y 230-1500 and left of x 965.
export const Vertical: React.FC = () => <AbsoluteFill style={{background: '#F5F7FC', fontFamily: FONT}}>
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs><pattern id="cbgridv" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="rgba(6,18,46,.045)" strokeWidth={1.2}/></pattern></defs>
    <rect width={1080} height={1920} fill="url(#cbgridv)"/></svg>
  <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', lineHeight: 1.05}}>
    <div style={{fontSize: 70, fontWeight: 800, color: NAVY, letterSpacing: -2}}>How AI chatbots are built</div>
    <div style={{display: 'inline-block', fontSize: 70, fontWeight: 800, color: '#fff', background: BLUE, letterSpacing: -2, marginTop: 12, padding: '4px 30px 10px', borderRadius: 18}}>in 7 stages</div>
  </div>
  <div style={{position: 'absolute', left: 0, top: 452, width: 1080, height: 1020, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 50 - 30 * 0.9, top: -(ROW0 - 12) * 0.9, width: 1080, height: 1350, transform: 'scale(0.9)', transformOrigin: 'top left'}}><Infographic bare/></div>
  </div>
  <div style={{position: 'absolute', left: 70, top: 1436, fontSize: 30, fontWeight: 800, letterSpacing: 4, color: NAVY}}>WITH<span style={{color: BLUE}}>HAMMAD</span>
    <span style={{fontSize: 24, fontWeight: 600, letterSpacing: 0, color: '#5A6275', marginLeft: 18}}>@with.hammad</span></div>
</AbsoluteFill>;

// one stage for the carousel item page (860x480, rendered at scale 2): banner, the stage's flow row, a sourced fact
export type StageProps = {n: number};
const ROWS: {fact: string; src: string}[] = [
  {fact: 'Llama 3 cleaned its web data with de-duplication, heuristic and model-based quality filters, and PII / adult-content filters.', src: 'Meta, The Llama 3 Herd of Models (2024), section 3.1'},
  {fact: 'Llama 3 was pretrained on about 15 trillion tokens. The model only ever learns one thing: guess the next token.', src: 'Meta, The Llama 3 Herd of Models (2024), section 3'},
  {fact: 'InstructGPT’s supervised fine-tuning set had about 13,000 prompts with answers written by human labelers.', src: 'Ouyang et al., Training language models to follow instructions (OpenAI, 2022)'},
  {fact: 'RLHF trains a reward model on human rankings. DPO learns from the same preference pairs with a simple classification loss, no separate reward model.', src: 'Ouyang et al. 2022 (RLHF); Rafailov et al. 2023 (DPO)'},
  {fact: 'Before GPT-4 shipped, OpenAI engaged more than 50 experts to test it adversarially and find risky behaviour.', src: 'OpenAI, GPT-4 Technical Report and System Card (2023)'},
  {fact: 'Models ship behind an API with safety classifiers on prompts and replies, such as Meta’s Llama Guard.', src: 'Inan et al., Llama Guard (Meta, 2023); Llama 3 paper, section 5.4'},
  {fact: 'OpenAI says it added a reward signal from ChatGPT thumbs-up / thumbs-down feedback in an April 2025 update.', src: 'OpenAI, Expanding on what we missed with sycophancy (May 2025)'},
];
export const Stage: React.FC<StageProps> = ({n}) => {
  const r = ROWS[n - 1], s = STAGES[n - 1], sc = 0.86, top = ROW0 + (n - 1) * PITCH;
  return <AbsoluteFill style={{background: '#F5F7FC', fontFamily: FONT}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 92, background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18}}>
      <div style={{fontSize: 17, fontWeight: 800, letterSpacing: 2, color: '#8FB0FF'}}>STAGE {n}/7</div>
      <div style={{fontSize: 38, fontWeight: 800, letterSpacing: -0.8}}>{s.title}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 104, width: 860, height: (CARD_H + 24) * sc, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -58 * sc, top: -(top - 10) * sc, width: 1080, height: 1350, transform: `scale(${sc})`, transformOrigin: 'top left'}}>
        <Infographic frame={0} all/></div></div>
    <div style={{position: 'absolute', left: 22, right: 22, top: 248, bottom: 18, borderRadius: 14, background: '#fff', border: '2px solid #DCE3F2',
      borderLeft: `7px solid ${BLUE}`, padding: '18px 24px', boxSizing: 'border-box'}}>
      <div style={{fontSize: 15, fontWeight: 800, letterSpacing: 2, color: BLUE}}>REAL-WORLD FACT</div>
      <div style={{fontSize: 25, fontWeight: 700, color: NAVY, lineHeight: 1.25, marginTop: 8}}>{r.fact}</div>
      <div style={{fontSize: 14, fontWeight: 500, color: '#5A6275', marginTop: 10}}>Source: {r.src}</div>
    </div>
  </AbsoluteFill>;
};

// carousel recap page: the template's paper page, header and footer (GuideDoc "more" page, no items) + the full infographic
export const Recap: React.FC<{docTitle: string}> = ({docTitle}) => <AbsoluteFill>
  <GuideDoc docTitle={docTitle} index={0} pages={[{kind: 'more', title: 'The whole *picture*', sub: 'Seven stages, one loop. Save this page.', items: []}]}/>
  <div style={{position: 'absolute', left: (1080 - 1080 * 0.645) / 2, top: 372, width: 1080, height: 1350, transform: 'scale(0.645)', transformOrigin: 'top left',
    border: '4px solid #0E1320', borderRadius: 22, overflow: 'hidden', boxShadow: '0 18px 40px rgba(14,19,32,.22)'}}><Infographic all/></div>
</AbsoluteFill>;

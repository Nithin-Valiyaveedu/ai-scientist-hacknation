import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';

import { Scene0Title } from './Scene0Title';
import { Scene1Input } from './Scene1Input';
import { Scene2LitQC } from './Scene2LitQC';
import { Scene3GeneratingPlan } from './Scene3GeneratingPlan';
import { Scene4PlanBudget } from './Scene4PlanBudget';
import { Scene5Materials } from './Scene5Materials';
import { Scene6VoiceAgent } from './Scene6VoiceAgent';

const FPS = 30;
const TRANS_FRAMES = 12; // ~0.4s slide transition

// Scene durations in seconds × fps
const SCENE_DURATIONS = {
  s0: 3 * FPS,   // Title
  s1: 4 * FPS,   // Input
  s2: 5 * FPS,   // Lit QC
  s3: 2 * FPS,   // Generating plan overlay
  s4: 6 * FPS,   // Plan / Budget
  s5: 6 * FPS,   // Materials
  s6: 4 * FPS,   // Voice agent (extra second for reply to type)
};

// Total = 30s * 30fps = 900 frames, minus transitions
// 6 transitions × 12 frames = 72 frames deducted
export const TOTAL_FRAMES =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) - TRANS_FRAMES * 6;

const SLIDE = slide({ direction: 'from-right' });
const FADE = fade();

export function LabProcureDemo() {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Scene 0 — Title: fade in */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s0}>
          <Scene0Title />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={SLIDE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 1 — Input */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s1}>
          <Scene1Input />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={SLIDE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 2 — Literature QC */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s2}>
          <Scene2LitQC />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={FADE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 3 — Generating plan overlay */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s3}>
          <Scene3GeneratingPlan />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={SLIDE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 4 — Plan / Budget */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s4}>
          <Scene4PlanBudget />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={SLIDE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 5 — Materials */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s5}>
          <Scene5Materials />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={SLIDE}
          timing={linearTiming({ durationInFrames: TRANS_FRAMES })}
        />

        {/* Scene 6 — Voice agent */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.s6}>
          <Scene6VoiceAgent />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

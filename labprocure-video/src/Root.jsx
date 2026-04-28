import { Composition } from 'remotion';
import { LabProcureDemo, TOTAL_FRAMES } from './LabProcureDemo';

export function Root() {
  return (
    <Composition
      id="LabProcureDemo"
      component={LabProcureDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}

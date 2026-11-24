import { assetPath, checkAssetName } from '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/src/pipeline.ts';
const values = [
  ['trailing-dot', 'avatar-base.'],
  ['trailing-space', 'avatar-base '],
  ['windows-drive-relative', 'C:avatar-base'],
  ['nul', 'avatar-base\0'],
  ['very-long', 'a'.repeat(300)],
  ['out', 'out'],
  ['assets', 'assets'],
  ['case-mismatch', 'Avatar-base'],
];
for (const [label, name] of values) {
  let guard = 'accepted';
  try { checkAssetName(name); } catch (error) { guard = (error as Error).message; }
  let path = 'accepted';
  try { assetPath(name); } catch (error) { path = (error as Error).message.split('. Known assets:')[0]!.split('\n')[0]!; }
  console.log(JSON.stringify({ label, guard, assetPath: path }));
}

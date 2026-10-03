import fs from 'node:fs';
fs.writeFileSync('src/components/ui/animated-number.tsx',`import type { HTMLAttributes } from "react";
type AnimatedNumberProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number; duration?: number; format?: (value: number) => string;
};
const defaultFormat = (value: number) => value.toLocaleString("th-TH");
// Optional count-up is omitted to preserve exact counts and stable text widths.
export function AnimatedNumber({value,duration: _duration,format=defaultFormat,...props}:AnimatedNumberProps) {
  return <span {...props}>{format(value)}</span>;
}
`);
const building='src/app/(platform)/buildings/buildings-workspace.tsx';
fs.writeFileSync(building,fs.readFileSync(building,'utf8').replaceAll('onClick={() => dialogRef.current?.close()}','onClick={dismiss}'));

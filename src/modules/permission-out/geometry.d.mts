import type { Coordinate, RouteLine, Segment } from "./domain";
export function distance(a: Coordinate,b: Coordinate): number;
export function lineLength(coords: Coordinate[]): number;
export function sampleLine(coords: Coordinate[],interval: number): Coordinate[];
export function deduplicate(lines: RouteLine[],threshold: number,interval: number): RouteLine[];
export function analyzeRoutes(base: RouteLine[],compare: RouteLine[],options: {threshold:number;interval:number;dedupe:boolean}): Segment[];

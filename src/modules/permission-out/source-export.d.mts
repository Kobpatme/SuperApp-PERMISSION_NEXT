import type {RouteLine} from "./domain";
export function csvDirectOverlapMeters(a:RouteLine,b:RouteLine,threshold:number):number;
export type MatchRow={rd03Line:RouteLine|null;maxiLine:RouteLine|null;overlapMeters:number|"";overlapPercent:number|""};
export function csvDirectMatchRows(lines:RouteLine[],threshold:number,selectedKeys?:Set<string>|null):Promise<MatchRow[]>;
export function exportTrimmedMaxi(line:RouteLine,references:RouteLine[],threshold:number):RouteLine[];
export function trimExportSourceLines(lines:RouteLine[],threshold:number):RouteLine[];
export function buildExportOverlapGroups(lines:RouteLine[],threshold:number,interval:number):Map<RouteLine,string>;

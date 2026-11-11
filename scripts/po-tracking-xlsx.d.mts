export type WorkbookRow = { number: number; cells: Record<number, string> };
export function readWorkbook(buffer: Buffer, sheetName?: string): { name: string; rows: WorkbookRow[] };

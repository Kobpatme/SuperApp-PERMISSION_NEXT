import { mutateBuildingRequest } from "@/lib/building-editor-api";

export async function POST(request: Request) { return mutateBuildingRequest(request); }

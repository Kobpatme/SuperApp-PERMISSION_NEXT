import "server-only";
import { getMicrosoft365Config } from "@/lib/microsoft365/config";
import { graphGet } from "@/lib/microsoft365/graph";

type GraphSite = { id: string; displayName?: string; webUrl?: string };
type GraphDrive = { id: string; name: string; webUrl?: string; driveType?: string };
type GraphDriveItem = { id: string; name: string; webUrl?: string; folder?: { childCount?: number } };

export type SharePointReadiness = {
  site: { id: string; name: string; webUrl: string };
  library: { id: string; name: string; webUrl: string };
  folder: { id: string; name: string; webUrl: string; childCount: number | null };
};

function encodeGraphPath(value: string) {
  return value.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export async function checkSharePointReadiness(): Promise<SharePointReadiness> {
  const config = getMicrosoft365Config();
  const site = config.SHAREPOINT_SITE_ID
    ? await graphGet<GraphSite>(`/sites/${encodeURIComponent(config.SHAREPOINT_SITE_ID)}?$select=id,displayName,webUrl`)
    : await graphGet<GraphSite>(`/sites/${config.SHAREPOINT_HOSTNAME}:${config.SHAREPOINT_SITE_PATH}?$select=id,displayName,webUrl`);

  let drive: GraphDrive | undefined;
  if (config.SHAREPOINT_DRIVE_ID) {
    drive = await graphGet<GraphDrive>(`/drives/${encodeURIComponent(config.SHAREPOINT_DRIVE_ID)}?$select=id,name,webUrl,driveType`);
  } else {
    const drives = await graphGet<{ value: GraphDrive[] }>(`/sites/${encodeURIComponent(site.id)}/drives?$select=id,name,webUrl,driveType`);
    drive = drives.value.find((candidate) => candidate.name === config.SHAREPOINT_DOCUMENT_LIBRARY);
  }
  if (!drive) throw new Error(`SharePoint document library not found: ${config.SHAREPOINT_DOCUMENT_LIBRARY}`);

  const folderPath = encodeGraphPath(config.SHAREPOINT_ROOT_FOLDER);
  const folder = await graphGet<GraphDriveItem>(`/drives/${encodeURIComponent(drive.id)}/root:/${folderPath}?$select=id,name,webUrl,folder`);
  if (!folder.folder) throw new Error(`SharePoint path is not a folder: ${config.SHAREPOINT_ROOT_FOLDER}`);

  return {
    site: { id: site.id, name: site.displayName || config.SHAREPOINT_SITE_PATH, webUrl: site.webUrl || "" },
    library: { id: drive.id, name: drive.name, webUrl: drive.webUrl || "" },
    folder: { id: folder.id, name: folder.name, webUrl: folder.webUrl || "", childCount: folder.folder.childCount ?? null },
  };
}


import { NativeModuleFoundation } from "@/components/native-module-foundation";

export default async function ModulePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <NativeModuleFoundation moduleId="work" previewRequested={params.preview === "1"}/>;
}

import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { SignatureWorkspace } from "@/modules/duct-rental/components/signature-workspace";
export default async function Page({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
 const access = await getAccessContext("duct-rental"); const { task } = await searchParams;
 if (!access.allowed) return <AccessDenied moduleName="งานลงนามเช่าท่อ" />;
 return <SignatureWorkspace userId={access.userId!} permissions={access.permissions} selected={task} />;
}

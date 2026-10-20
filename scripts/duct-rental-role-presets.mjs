// Generate a local reviewable migration; never connect or assign real users.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function evaluate(path, require) {
 const exports = {}, context = vm.createContext({ exports, require });
 vm.runInContext(ts.transpileModule(readFileSync(path,"utf8"), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022} }).outputText,context,{timeout:1000});
 return exports;
}
const capabilities = evaluate("src/modules/duct-rental/capabilities.ts", () => {throw Error("Unexpected runtime import");});
const {ductRentalRolePresets} = evaluate("src/modules/duct-rental/domain/role-presets.ts", name => {if(name!=="../capabilities")throw Error("Unexpected runtime import");return capabilities;});
const data=JSON.stringify(ductRentalRolePresets).replaceAll("'","''");
writeFileSync("supabase/migrations/0053_duct_rental_role_presets.sql",`-- Source: METRIX lib/utils.ts phase ownership and reachable annual/cancel controls.
-- Assignable, editable bundles only. Preserve existing customized bundles on replay.
-- No real-user assignments, positions or scopes are created.
do $presets$
declare bundle jsonb; created_id uuid;
begin
 for bundle in select value from jsonb_array_elements('${data}'::jsonb) loop
  created_id:=null;
  insert into public.roles(code,name,description,is_system)
   values(bundle->>'code',bundle->>'name',bundle->>'description',false)
   on conflict(code) do nothing returning id into created_id;
  if created_id is not null then
   insert into public.role_permissions(role_id,permission_code)
    select created_id,value from jsonb_array_elements_text(bundle->'permissions')
    on conflict do nothing;
  end if;
 end loop;
end $presets$;
`);
console.log(JSON.stringify({bundles:ductRentalRolePresets.length,assignmentsCreated:0,mode:"file-generation-only"}));

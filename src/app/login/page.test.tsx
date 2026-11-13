import {describe,it,expect,vi,beforeEach} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
const fixture=vi.hoisted(()=>({authenticated:false,action:false}));
vi.mock("@/lib/auth",()=>({getCurrentUser:async()=>fixture.authenticated?{id:"test-user"}:null}));
vi.mock("next/headers",()=>({headers:async()=>new Headers(fixture.action?{"next-action":"test-action"}:{})}));
vi.mock("next/navigation",()=>({redirect:(destination:string)=>{throw Error(`REDIRECT:${destination}`);}}));
vi.mock("@/components/login-form",()=>({LoginForm:()=> <form aria-label="เข้าสู่ระบบ"/>}));
vi.mock("@/components/auth/auth-shell",()=>({AuthShell:({children}:{children:React.ReactNode})=><main>{children}</main>}));
import LoginPage from "./page";
beforeEach(()=>{fixture.authenticated=false;fixture.action=false;});
describe("login page cookie-update render",()=>{
 it("keeps redirecting authenticated ordinary visits",async()=>{
  fixture.authenticated=true;
  await expect(LoginPage({searchParams:Promise.resolve({})})).rejects.toThrow("REDIRECT:/");
 });
 it("keeps the form mounted during the successful action rerender so client navigation can finish",async()=>{
  fixture.authenticated=true;fixture.action=true;
  expect(renderToStaticMarkup(await LoginPage({searchParams:Promise.resolve({})}))).toContain('aria-label="เข้าสู่ระบบ"');
 });
 it("renders the normal form for anonymous visits",async()=>{
  expect(renderToStaticMarkup(await LoginPage({searchParams:Promise.resolve({})}))).toContain('aria-label="เข้าสู่ระบบ"');
 });
});

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const {warnAboutProductionProxy}=await import("@/lib/env");
    warnAboutProductionProxy();
  }
}

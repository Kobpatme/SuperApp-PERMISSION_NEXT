/** Shared visual feedback; its label is available to assistive technology only. */
export function WorkspaceLoading({className=""}:{className?:string}) {
  return <div className={`workspace-loading ${className}`.trim()} role="status" aria-label="กำลังโหลด" aria-live="polite"><span className="workspace-loading-symbol" aria-hidden="true"/></div>;
}

export type BuildInfo = { shortCommit: string | null; branch: string | null; builtAt: string | null };
export function normalizeBuildInfo(input: { commit?: string | null; branch?: string | null; builtAt?: string | null }): BuildInfo {
  const commit = input.commit?.trim(), branch = input.branch?.trim();
  const date = input.builtAt ? new Date(input.builtAt) : null;
  return {
    shortCommit: commit && /^[a-f0-9]{7,64}$/i.test(commit) ? commit.slice(0, 12).toLowerCase() : null,
    branch: branch && branch.length <= 160 && /^[\w./-]+$/.test(branch) ? branch : null,
    builtAt: date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
  };
}
export function resolveBuildInfo(env: Record<string, string | undefined>, fallback: BuildInfo): BuildInfo {
  return normalizeBuildInfo({ commit: env.APP_COMMIT_SHA || env.VERCEL_GIT_COMMIT_SHA || env.CF_PAGES_COMMIT_SHA || env.GITHUB_SHA || fallback.shortCommit,
    branch: env.APP_BRANCH || env.VERCEL_GIT_COMMIT_REF || env.CF_PAGES_BRANCH || env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || fallback.branch,
    builtAt: env.APP_BUILT_AT || fallback.builtAt });
}

// This module is bundled by Cloudflare Pages' older Functions builder as well
// as Astro. Keep it self-contained; JSON import attributes are not supported
// by the hosted Wrangler 3 builder.
export const contactRelease = {
  enabled: true,
  origin: 'https://oneight.jp',
  productionBranch: 'feat/oneight-official-site',
} as const;

const productionOrigin = contactRelease.origin;

// Explicit environment settings remain the emergency stop and override.
// The owner's release applies only to the configured production site.
export function contactRuntimeEnabled(
  setting: string | undefined,
  allowedOrigin: string | undefined,
  requestOrigin: string,
): boolean {
  if (setting !== undefined) return setting === 'true';
  return contactRelease.enabled
    && allowedOrigin === productionOrigin
    && requestOrigin === productionOrigin;
}

export function contactBuildEnabled(
  setting: string | undefined,
  siteOrigin: string,
  pages: string | undefined,
  branch: string | undefined,
): boolean {
  if (setting !== undefined) return setting === 'true';
  return contactRelease.enabled
    && siteOrigin === productionOrigin
    && pages === '1'
    && branch === contactRelease.productionBranch;
}

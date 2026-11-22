import deployment from './deployment.json' with { type: 'json' };

const productionOrigin = new URL(deployment.siteUrl).origin;

// Explicit environment settings remain the emergency stop and override.
// The owner's release applies only to the configured production site.
export function contactRuntimeEnabled(
  setting: string | undefined,
  allowedOrigin: string | undefined,
  requestOrigin: string,
): boolean {
  if (setting !== undefined) return setting === 'true';
  return deployment.contact.enabled
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
  return deployment.contact.enabled
    && siteOrigin === productionOrigin
    && pages === '1'
    && branch === deployment.contact.productionBranch;
}

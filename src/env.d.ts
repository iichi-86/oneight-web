/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_ALLOW_INDEXING?: string;
  readonly PUBLIC_CONTACT_ENABLED?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_API_URL'),
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_BUCKET', 'strapi-media'),
        directory: env('SUPABASE_BUCKET_DIRECTORY', ''),
      },
      sizeLimit: 10 * 1024 * 1024, // 10 MB
    },
  },
});

export default config;

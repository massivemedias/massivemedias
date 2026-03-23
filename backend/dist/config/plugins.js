"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = ({ env }) => ({
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
exports.default = config;

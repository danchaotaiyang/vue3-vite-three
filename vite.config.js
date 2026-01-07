import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // let env = loadEnv(mode, process.cwd(), '');
    return {
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler'
                }
            }
        },
        plugins: [
            vue({
                // template: {
                //     transformAssetUrls: {
                //         base: '/src'
                //     }
                // }
            }),
        ],
        /*
        base: env.NODE_ENV === 'production' ? `http://localhost:8888/` : '/',
        build: {
            rollupOptions: {
                input: 'src/main.js',
                format: 'system',
                preserveEntrySignatures: true,
                output: {
                    name: 'appThree',
                }
            }
        },
        */
        server: {
            host: '0.0.0.0',
            port: 8888
        }
    };
});

import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        'process.env': {
            API: JSON.stringify(process.env.VITE_API_URL)
        }
    }
});
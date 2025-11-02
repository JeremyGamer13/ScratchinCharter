import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// https://github.com/vitejs/vite/issues/9743
const fullReloadAlways = {
    handleHotUpdate({ server }) {
        server.ws.send({ type: "full-reload" });
        return [];
    },
};

export default defineConfig({
    plugins: [sveltekit(), fullReloadAlways]
});

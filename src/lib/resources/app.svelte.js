import * as stores from 'svelte/store';

import Settings from "$lib/stores/settings";
import SaveState from "$lib/stores/state";
import SaveStateLarge from "$lib/stores/state-large";
import MelodiiChart from "$lib/resources/chart";

import updateStore from './update-store';

const state = $state({
    appLoaded: false,
    appTopBar: null,

    /** @type {import("wavesurfer.js").default} */
    timingPreview: null,
    /** @type {import("wavesurfer.js").default} */
    clipPreview: null,
    timeline: null,
});

class Application {
    static state = state;

    static async importSongFromBlob(blob) {
        if (!state.timingPreview) return;
        const audioUrl = URL.createObjectURL(blob);
        await state.timingPreview.load(audioUrl);

        // remember the last loaded song
        const arrayBuffer = await blob.arrayBuffer();
        updateStore(SaveStateLarge, (state) => { state.song = arrayBuffer });
    };
    static async importChartFromObject(object) {
        updateStore(SaveState, (state) => { state.chart = object; });
    };
    static async importChartFromString(jsonStr) {
        const obj = JSON.parse(jsonStr);
        await this.importChartFromObject(obj);
    };
};

export default Application;
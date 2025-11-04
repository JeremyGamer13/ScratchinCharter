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

    /** @type {"sections"|"section"} */
    timelineMode: "sections",
});

class Application {
    static state = state;

    static loadChartIntoTimeline() {
        if (state.timeline) return;
        if (state.timelineMode === "sections") {
            const timelineModel = MelodiiChart.getTimelineForSections();
            console.log(state.timeline);
            state.timeline.timeline.setModel(timelineModel);
        }
        state.timeline.rerenderOutline();
    }

    static async importSongFromBlob(blob) {
        if (!state.timingPreview) return;
        const audioUrl = URL.createObjectURL(blob);
        await state.timingPreview.load(audioUrl);

        // remember the last loaded song
        const arrayBuffer = await blob.arrayBuffer();
        updateStore(SaveStateLarge, (state) => { state.song = arrayBuffer });
    };
    static async importChartFromObject(object) {
        if (state.timeline && state.timelineMode == "sections") state.timeline = ""
        updateStore(SaveState, (state) => { state.chart = object; });
    };
    static async importChartFromString(jsonStr) {
        const obj = JSON.parse(jsonStr);
        await this.importChartFromObject(obj);
    };
};

export default Application;
import * as stores from 'svelte/store';

import Settings from "$lib/stores/settings";
import SaveState from "$lib/stores/state";
import SaveStateLarge from "$lib/stores/state-large";
import SMUIPrompts from '$lib/resources/smui-prompts';
import MelodiiChart from "$lib/resources/chart";

import updateStore from '$lib/resources/update-store';

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
    timelineSection: null,
});

class Application {
    static state = state;

    // for development
    static inspectSettings() {
        const settings = stores.get(Settings);
        return settings;
    }
    static inspectSaveState() {
        const saveState = stores.get(SaveState);
        return saveState;
    }
    static inspectSaveStateLarge() {
        const saveStateLarge = stores.get(SaveStateLarge);
        return saveStateLarge;
    }

    static async newProjectOnboarding() {
        let loadExisting = null;
        while (typeof loadExisting !== "boolean") {
            loadExisting = await SMUIPrompts.confirm("Would you like to load an existing chart? (on your computer)");
            if (loadExisting === false) break;
            try {
                const chart = await this.askForChartString();
                await this.importChartFromString(chart);
                this.loadChartIntoTimeline();
            } catch (err) {
                loadExisting = null;
                console.error(err);
                await SMUIPrompts.alert(`An error occurred.`
                    + `\n` + ` - Did you select a chart file? (.json)`
                    + `\n` + ` - Are you on a desktop device? (Mobile browsers may not work.)`
                    + `\n` + ` - Are you on an up-to-date browser? (Firefox has not been tested.)`
                    + `\n`
                    + `\n` + `Let's try that again.`);
            }
        }
        
        let songBlob = null;
        while (!songBlob) {
            await SMUIPrompts.alert(`Please select an audio file (.mp3, .ogg, .wav) to start with.`
                + `\n`
                + `\n` + `Please make sure the audio file is the same one you will use in your mod, and that it is compatible with Unity 2021.`);
            try {
                songBlob = await this.askForSongBlob();
                await this.importSongFromBlob(songBlob);
            } catch (err) {
                console.error(err);
                await SMUIPrompts.alert(`An error occurred.`
                    + `\n` + ` - Did you select an audio file? (.mp3, .ogg, .wav)`
                    + `\n` + ` - Are you on a desktop device? (Mobile browsers may not work.)`
                    + `\n` + ` - Are you on an up-to-date browser? (Firefox has not been tested.)`
                    + `\n`
                    + `\n` + `Let's try that again.`);
            }
        }

        // build chart
        if (loadExisting === false) {
            let sampleRate = null;
            while (!sampleRate) {
                sampleRate = Number(await SMUIPrompts.prompt(`Please enter the Sample rate (Hz) that this audio file is in.`
                    + `\n` + ` - It is recommended to use something like Audacity to find the Sample rate (but make sure you do not use the Project rate.)`
                    + `\n` + ` - This number cannot be changed later without conversion, which can cause inaccurate timing or buggy behavior.`
                    + `\n` + ` - You can convert other audio files to this Sample rate, but that can reduce audio quality in some cases.`
                    , 44100));
                if (sampleRate && !MelodiiChart.isValidSampleRate(sampleRate)) {
                    sampleRate = null;
                    await SMUIPrompts.alert(`That is not a valid Sample rate.`
                        + `\n` + ` - Only enter the Sample rate with numbers.`
                        + `\n` + ` - Make sure the Sample rate is in Hz. (Hertz)`
                        + `\n` + ` - Make sure you did not enter other values, like Bit rate.`
                        + `\n` + ` - The Sample rate must be an integer, and be non-negative.`
                        + `\n`
                        + `\n` + `Let's try that again.`);
                }
            }

            const chart = MelodiiChart.defaultChart();
            chart.sampleRate = sampleRate;
            await this.importChartFromObject(chart);
            this.loadChartIntoTimeline();
        }
    }

    static loadChartIntoTimeline() {
        if (!state.timeline) return;
        const saveState = stores.get(SaveState);
        const chart = saveState.chart;
        if (state.timelineMode === "sections") {
            const timelineModel = MelodiiChart.getTimelineForSections(chart);
            state.timeline.timeline.setModel(timelineModel);
        }
        if (state.timelineMode === "section") {
            const timelineModel = MelodiiChart.getTimelineForSection(chart, state.timelineSection);
            state.timeline.timeline.setModel(timelineModel);
        }
        state.timeline.reactive.rerenderOutline();
    }
    static saveCurrentChartTimeline() {
        if (!state.timeline) return;
        const saveState = stores.get(SaveState);
        const chart = saveState.chart;
        if (state.timelineMode === "sections") {
            const timelineModel = state.timeline.timeline.getModel();
            chart.sections = MelodiiChart.parseTimelineAsSections(timelineModel, chart.sampleRate);
        }
        if (state.timelineMode === "section") {
            // TODO: this
        }

        updateStore(SaveState, (state) => { state.chart = chart; });
        this.validateChart();
        this.loadChartIntoTimeline();
    }
    static switchTimelineToSections() {
        if (!state.timeline) return;
        state.timelineMode = "sections";
        this.validateChart();
        this.loadChartIntoTimeline();
    }
    static switchTimelineToSection(section) {
        if (!state.timeline) return;
        state.timelineSection = section;
        state.timelineMode = "section";
        this.validateChart();
        this.loadChartIntoTimeline();
    }
    static validateChart() {
        const saveState = stores.get(SaveState);
        const chart = saveState.chart;

        const goodChart = MelodiiChart.validateChart(chart);
        updateStore(SaveState, (state) => { state.chart = goodChart; });
        return goodChart;
    }

    static async askForSongBlob() {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-songimport",
            multiple: false,
            types: [{
                description: "Audio files",
                accept: { "audio/*": [".mp3", ".ogg", ".flac", ".wav"] }
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        return fileData;
    }
    static async askForChartBlob() {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-chartimport",
            multiple: false,
            types: [{
                description: "Melodii Chart",
                accept: { "application/json": [".json"] }
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        return fileData;
    }
    static async askForChartString() {
        const fileData = await this.askForChartBlob();
        const decoder = new TextDecoder("utf-8");
        const jsonStr = decoder.decode(await fileData.arrayBuffer());
        return jsonStr;
    }

    static async importSongFromBlob(blob) {
        if (!state.timingPreview) return;
        const audioUrl = URL.createObjectURL(blob);
        await state.timingPreview.load(audioUrl);
        state.timingPreview.zoom(0);

        // remember the last loaded song
        const arrayBuffer = await blob.arrayBuffer();
        updateStore(SaveStateLarge, (state) => { state.song = arrayBuffer });
    };
    static async importChartFromObject(object) {
        updateStore(SaveState, (state) => { state.chart = object; });
        this.validateChart();
    };
    static async importChartFromString(jsonStr) {
        const obj = JSON.parse(jsonStr);
        await this.importChartFromObject(obj);
    };
};

export default Application;
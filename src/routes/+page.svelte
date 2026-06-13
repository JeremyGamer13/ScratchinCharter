<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import { AutoAdjust } from '@smui/top-app-bar';
    import { AppContent } from '@smui/drawer';
    import WaveSurfer from 'wavesurfer.js';
    import localforage from "localforage";
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import SMUIPrompts from "$lib/resources/smui-prompts";
    import Polyfill from "$lib/resources/polyfill.js";
    import WaveSurferState from "$lib/state/wavesurfer.svelte.js";
    import MelodiiChart from "$lib/resources/chart";
    import TimelineMelodiiCreator from "$lib/components/Timeline/TimelineMelodii.svelte.js";

    // Components
    import TopBar from "$lib/components/TopBar/TopBar.svelte";
    import Properties from "$lib/components/Properties/Properties.svelte";
    import WaveSurferComponent from "$lib/components/WaveSurfer.svelte";
    import Timeline from "$lib/components/Timeline/Timeline.svelte";
    import TimelineMelodiiSvelte from "$lib/components/Timeline/TimelineMelodiiSvelte.svelte";
    
    let appTopBar = $state(null);
    
    /** @type {WaveSurfer} */
    let waveSurfer;
    let waveSurferContainer;
    const surferSetAllVolume = (volume) => {
        for (const key in WaveSurferState.waveSurfers) {
            const instance = WaveSurferState.waveSurfers[key];
            instance.waveSurfer.setVolume(volume);
        }
    };
    const surferGetsTimeUpdate = (newTime) => {
        if (Application.state.timelineMode === "sections") {
            // newTime is in MS
            waveSurfer.setTime(newTime / 1000);
        }
        if (Application.state.timelineMode === "section") {
            // newTime is what beat we are on * 1000
            // we also have to add the section's start time
            const startTime = (Application.state.timelineSection.start / $SaveState.chart.sampleRate);
            const seconds = MelodiiChart.beatToSeconds(newTime / 1000, $SaveState.chart.sampleRate, Application.state.timelineSection.samplesPerBeat);
            waveSurfer.setTime(seconds + startTime);
        }
    };
    onMount(() => {
        // Listen for resize so we can tell waveSurfer to update
        const observer = new ResizeObserver(() => {
            if (!waveSurfer) return;
            // TODO: Save the new size to settings
            waveSurfer.renderer.onContainerResize();
        });
        observer.observe(waveSurferContainer);
    });

    let timeline;
    const timelineGetsSurferUpdate = (newTime) => {
        // newTime is in seconds
        if (Application.state.timelineMode === "sections") {
            // need to convert to MS
            timeline.timeline.setTime(newTime * 1000);
        }
        if (Application.state.timelineMode === "section") {
            // need to convert to beat
            // also need to sub section start time
            const startTime = (Application.state.timelineSection.start / $SaveState.chart.sampleRate);
            const beat = MelodiiChart.secondsToBeat(newTime - startTime, $SaveState.chart.sampleRate, Application.state.timelineSection.samplesPerBeat);
            timeline.timeline.setTime(Math.max(0, beat * 1000));
        }
    };
    const timelineListenForEvents = () => {
        timeline.reactive.events.on("add-keyframe", () => {
            if (Application.state.timelineMode === "sections") {
                Application.state.timeline.melodii.addSectionAtCursor();
            }
            if (Application.state.timelineMode === "section") {
                Application.state.timeline.melodii.addNoteAtCursor();
            }
        });
        timeline.reactive.events.on("remove-keyframes", async () => {
            if (Application.state.timelineMode === "sections") {
                const iWantToDelete = await SMUIPrompts.confirm("Are you sure you want to delete the selected sections?\nAll notes inside will also be deleted.");
                if (!iWantToDelete) return;
                // save so we update the keyframe's timing values
                Application.state.timeline.melodii.applyChartChanges();
                // now we can clear the section so when we remove the keyframes, they arent left behind
                for (const keyframe of Application.state.timeline.reactive.selectedKeyframes) {
                    const newChart = MelodiiChart.clearSection(keyframe.section, $SaveState.chart);
                    $SaveState.chart = newChart;
                }
                Application.state.timeline.melodii.removeSelectedKeyframes();
            } else {
                Application.state.timeline.melodii.removeSelectedKeyframes();
            }
        });
    };

    const editorsAttachEachother = () => {
        waveSurfer.on("timeupdate", timelineGetsSurferUpdate);
        waveSurfer.on("seek", timelineGetsSurferUpdate);
        waveSurfer.on("audioprocess", timelineGetsSurferUpdate);
        timeline.timeline.onTimeChanged((event) => {
            if (event.source !== "user") return;
            surferGetsTimeUpdate(event.val);
        });
    };

    const appReadSettings = async () => {
        surferSetAllVolume($Settings.volume ?? 0.5);
    };
    const appReadSaveState = async () => {
        const chart = $SaveState.chart;
        await Application.importChartFromObject(chart);
        Application.loadChartIntoTimeline();
    };
    const appReadSaveStateLarge = async () => {
        const song = $SaveStateLarge.song;
        await Application.importSongFromBlob(new Blob([song]));
    };

    const componentsHasLoaded = {
        app: false,
        polyfill: false,
        stateSettings: false,
        stateSave: false,
        stateLarge: false,
        waveSurfer: false,
        timeline: false,
    };
    const componentLoaded = async () => {
        if (componentsHasLoaded.app) return;

        // make sure all other components have loaded, then we mark app as loaded
        if (!componentsHasLoaded.polyfill) return;
        if (!componentsHasLoaded.stateSettings) return;
        if (!componentsHasLoaded.stateSave) return;
        if (!componentsHasLoaded.stateLarge) return;
        if (!componentsHasLoaded.waveSurfer) return;
        if (!componentsHasLoaded.timeline) return;
        // add all the components
        Application.state.timingPreview = waveSurfer;
        Application.state.timeline = timeline;
        editorsAttachEachother();
        timelineListenForEvents();
        componentsHasLoaded.app = true;
        
        // Only interrupt reading if we need to create a new project.
        await appReadSettings();
        if ($SaveState.newProject) {
            await Application.newProjectOnboarding();
            $SaveState.newProject = false;
        }
        await appReadSaveStateLarge();
        await appReadSaveState();
        Application.state.appLoaded = true;
        window.dispatchEvent(new CustomEvent("scratchincharter-app-loaded"));
    };
    onMount(async () => {
        await Polyfill.registerPolyfill();
        if (!Polyfill.isBrowserSupported()) {
            while (true) {
                await SMUIPrompts.alert(`Your browser is not supported.`
                    + `\n` + `This can be due to an outdated browser version, or you are using a browser with some functionality missing.`
                    + `\n`
                    + `\n` + `Google Chrome or Chromium is recommended. Other Chromium-based browsers (ie, Microsoft Edge, Brave, Opera) may work also.`
                    + `\n`
                    + `\n` + ` - Are you on a desktop device? (Mobile browsers may not work.)`
                    + `\n` + ` - Are you on an up-to-date browser? (Firefox has not been tested.)`
                );
            }
            return;
        }

        componentsHasLoaded.polyfill = true;
        await componentLoaded();
    });
    onMount(async () => {
        // crazy ass shit because of inconsistent timing
        if ($Settings.loaded) componentsHasLoaded.stateSettings = true;
        if ($SaveState.loaded) componentsHasLoaded.stateSave = true;
        if ($SaveStateLarge.loaded) componentsHasLoaded.stateLarge = true;
        window.addEventListener("scratchincharting-loaded-settings", () => { componentsHasLoaded.stateSettings = true; componentLoaded(); });
        window.addEventListener("scratchincharting-loaded-state", () => { componentsHasLoaded.stateSave = true; componentLoaded(); });
        window.addEventListener("scratchincharting-loaded-state-large", () => { componentsHasLoaded.stateLarge = true; componentLoaded(); });
        await componentLoaded();
        window.ScratchinCharter = Application;
    });
</script>

{#if !Application.state.appLoaded}
    <div class="app-loading">
        <p class="app-loading-text">LOADING...</p>
    </div>
{/if}

<TopBar />
<AutoAdjust topAppBar={Application.state.appTopBar}>
    <div class="app-container" id="app-container">
        <Properties />
        <AppContent class="app-content" id="app-content">
            <div class="app-timingpreview" bind:this={waveSurferContainer}>
                <WaveSurferComponent
                    id="wavesurfer-main"
                    onload={(instance) => {
                        waveSurfer = instance.waveSurfer;
                        componentsHasLoaded.waveSurfer = true;
                        componentLoaded();
                    }}
                />
            </div>
            <div class="app-timeline">
                <Timeline
                    id="timeline-main"
                    onload={(instance) => {
                        timeline = instance;
                        timeline.melodii = TimelineMelodiiCreator.create(timeline);
                        componentsHasLoaded.timeline = true;
                        componentLoaded();
                    }}
                />
                <TimelineMelodiiSvelte />
            </div>
        </AppContent>
    </div>
</AutoAdjust>

<style>
    /* HACK: just providing the exact class name & padding size */
    :global(main .mdc-top-app-bar--dense-fixed-adjust)  {
        height: calc(100% - 48px);
    }

    .app-container {
        width: 100%;
        height: 100%;

        background: #271027;
    }
    :global(main .app-properties) {
        width: 25%;
        height: calc(100% - 48px);
        left: initial !important;
        right: 0 !important;
        
        border-top-left-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
    }
    /* NOTE: wacky css hacks to make mdc-drawer appear on the right instead */
    :global(main .app-properties.mdc-drawer--animate),
    :global(main .app-properties.mdc-drawer--closing) {
        transform: translateX(100%) !important;
    }
    /* NOTE: this style is already a thing in mdc but we have to do it again with !important or it wont work because of the --animate override */
    :global(main .app-properties.mdc-drawer--opening) {
        transform: translateX(0%) !important;
    }
    :global(main .app-container .mdc-drawer.mdc-drawer--open:not(.mdc-drawer--closing) + .app-content) {
        margin-left: 0 !important;
        width: calc(100% - 25%);
    }
    :global(.app-content) {
        height: 100%;

        display: flex;
        flex-direction: column;
    }
    .app-timingpreview {
        width: 100%;
        height: 25%;
        min-height: 24px;
        max-height: calc(100% - 128px);
        resize: vertical;

        overflow: hidden;
    }
    .app-timeline {
        width: 100%;
        min-height: 128px;
        
        flex: 1;

        overflow: hidden;
    }

    .app-loading {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        background: #00000067;
        overflow: hidden;

        user-select: none;
        z-index: 6;
    }
    .app-loading-text {
        color: white;
        font-size: 64px;
        font-family: "Comic Sans MS", Arial, Helvetica, sans-serif;
        text-shadow: 2px 2px 10px black,
            2px 2px 10px black,
            2px 2px 10px black;
        animation: app-loading-text 1s linear 0s infinite;
    }
    @keyframes app-loading-text {
        0% {
            color: white;
            transform: scaleX(1.25) scaleY(1.25);
        }
        25% {
            transform: scaleX(1.15) scaleY(1.35);
        }
        50% {
            color: gold;
        }
        75% {
            transform: scaleX(1.35) scaleY(1.15);
        }
        100% {
            color: white;
            transform: scaleX(1.25) scaleY(1.25);
        }
    }
</style>
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
    import WaveSurferState from "$lib/state/wavesurfer.svelte.js";
    import MelodiiChart from "$lib/resources/chart";

    // Components
    import TopBar from "$lib/components/TopBar/TopBar.svelte";
    import Properties from "$lib/components/Properties/Properties.svelte";
    import WaveSurferComponent from "$lib/components/WaveSurfer.svelte";
    
    let appTopBar = $state(null);
    
    /** @type {WaveSurfer} */
    let waveSurfer;
    const surferSetAllVolume = (volume) => {
        for (const key in WaveSurferState.waveSurfers) {
            const instance = WaveSurferState.waveSurfers[key];
            instance.waveSurfer.setVolume(volume);
        }
    };

    const appReadSettings = async () => {
        surferSetAllVolume($Settings.volume ?? 0.5);
    };
    const appReadSaveState = async () => {
        const chart = $SaveState.chart || MelodiiChart.defaultChart();
        await Application.importChartFromObject(chart);
    };
    const appReadSaveStateLarge = async () => {
        const song = $SaveStateLarge.song;
        if (song) await Application.importSongFromBlob(new Blob([song]));
    };

    const componentsHasLoaded = {
        app: false,
        stateSettings: false,
        stateSave: false,
        stateLarge: false,
        waveSurfer: false,
    };
    const componentLoaded = async () => {
        if (componentsHasLoaded.app) return;

        // make sure all other components have loaded, then we mark app as loaded
        if (!componentsHasLoaded.stateSettings) return;
        if (!componentsHasLoaded.stateSave) return;
        if (!componentsHasLoaded.stateLarge) return;
        if (!componentsHasLoaded.waveSurfer) return;
        // add all the components
        Application.state.timingPreview = waveSurfer;
        componentsHasLoaded.app = true;
        
        await appReadSettings();
        await appReadSaveStateLarge();
        await appReadSaveState();
        Application.state.appLoaded = true;
    };
    onMount(async () => {
        // crazy ass shit because of inconsistent timing
        if ($Settings.loaded) componentsHasLoaded.stateSettings = true;
        if ($SaveState.loaded) componentsHasLoaded.stateSave = true;
        if ($SaveStateLarge.loaded) componentsHasLoaded.stateLarge = true;
        window.addEventListener("scratchincharting-loaded-settings", () => { componentsHasLoaded.stateSettings = true; componentLoaded(); });
        window.addEventListener("scratchincharting-loaded-state", () => { componentsHasLoaded.stateSave = true; componentLoaded(); });
        window.addEventListener("scratchincharting-loaded-state-large", () => { componentsHasLoaded.stateLarge = true; componentLoaded(); });
        await componentLoaded();
    });
</script>

{#if !Application.state.appLoaded}
    <div class="app-loading">
        <p class="app-loading-text">LOADING...</p>
    </div>
{/if}

<TopBar />
<AutoAdjust topAppBar={Application.state.appTopBar}>
    <div class="app-container">
        <Properties />
        <AppContent class="app-content">
            <div class="app-timingpreview">
                <WaveSurferComponent
                    id="wavesurfer-main"
                    onload={(instance) => {
                        waveSurfer = instance.waveSurfer;
                        componentsHasLoaded.waveSurfer = true;
                        componentLoaded();
                    }}
                />
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
        
        border-top-left-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
    }
    :global(main .app-container .mdc-drawer.mdc-drawer--open:not(.mdc-drawer--closing) + .app-content) {
        margin-left: 0 !important;
        width: calc(100% - 25%);
    }
    :global(.app-content) {
        height: 100%;
    }
    .app-timingpreview {
        width: 100%;
        height: 100%;
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
        z-index: 999999;
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
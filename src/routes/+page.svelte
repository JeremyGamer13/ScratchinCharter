<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import WaveSurfer from 'wavesurfer.js';
    import localforage from "localforage";
    import TopAppBar, {
        Row,
        Section,
        Title,
        AutoAdjust,
    } from '@smui/top-app-bar';
    import IconButton from '@smui/icon-button';
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import WaveSurferState from "$lib/state/wavesurfer.svelte.js";
    import MelodiiChart from "$lib/resources/chart";

    // Components
    import MenuFile from "$lib/components/TopBar/MenuFile.svelte";
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

    const appLoadSettings = async () => {
        surferSetAllVolume($Settings.volume ?? 0.5);
    };
    const appLoadSaveState = async () => {
        const chart = $SaveState.chart || MelodiiChart.defaultChart();
        await Application.importChartFromObject(chart);
    };
    const appLoadSaveStateLarge = async () => {
        const song = $SaveStateLarge.song;
        console.log("we are app loading", song);
        Application.importSongFromBlob(new Blob([song]));
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
        
        await appLoadSettings();
        await appLoadSaveStateLarge();
        await appLoadSaveState();
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

<TopAppBar bind:this={appTopBar} variant="standard" dense>
    <Row>
        <Section>
            <MenuFile {appTopBar}></MenuFile>
        </Section>
    </Row>
</TopAppBar>
<AutoAdjust topAppBar={appTopBar}>
<!-- <div class="app-topbar">
    <img width="32" height="32" src="/favicon.svg" alt="Favicon" />

    <button disabled={appLoading} onclick={chartImport}>Import Chart</button>
    <button disabled={appLoading} onclick={songImport}>Import Song</button>
    <button disabled={appLoading} onclick={chartExport}>Export</button>
</div> -->
<!-- <div class="app-optionsbar">
    <div class="app-optionsbar-meta">
        <label>
            <span>Name:</span>
            <input type="text" value="" placeholder="File name">
        </label>
        <label>
            <span>Path:</span>
            <input type="text" value="" placeholder="File path to audio file">
        </label>
        <label>
            <span style="transform: scaleX(0.75) translateX(-12px);">SampleRate:</span>
            <input type="number" step="0.01" value="" placeholder="Sample rate">
        </label>
    </div>
    <div class="app-optionsbar-timing">
        <label>
            <span>BPM:</span>
            <input type="number" step="1" value={120} placeholder="BPM">
        </label>
        <label>
            <span style="transform: scaleX(0.85) translateX(-6px);">IconSpeed:</span>
            <input type="number" step="0.01" value={4.9} placeholder="Icon Speed">
        </label>
        <label data-left="true">
            <input type="checkbox" checked={true}>
            <span>Link BPM & IconSpeed?</span>
        </label>
    </div>
</div> -->
<div class="app-mainarea">
    <WaveSurferComponent
        id="wavesurfer-main"
        onload={(instance) => {
            waveSurfer = instance.waveSurfer;
            componentsHasLoaded.waveSurfer = true;
            componentLoaded();
        }}
    />
</div>
</AutoAdjust>

<style>
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
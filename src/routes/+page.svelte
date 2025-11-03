<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import * as TopAppBar from '@smui/top-app-bar';
    import WaveSurfer from 'wavesurfer.js';
    import localforage from "localforage";
    
    import WaveSurferState from "$lib/state/wavesurfer.svelte.js";

    // Components
    import WaveSurferComponent from "$lib/components/WaveSurfer.svelte";
    
    let appLoading = $state(true);
    let appTopBar = $state(null);
    let appSaveStateLarge = {
        song: null
    };
    let appSaveState = {
        volume: 0.5,
    };
    
    /** @type {WaveSurfer} */
    let waveSurfer;
    const surferSetAllVolume = (volume) => {
        for (const key in WaveSurferState.waveSurfers) {
            const instance = WaveSurferState.waveSurfers[key];
            instance.waveSurfer.setVolume(volume);
        }
    };

    const appLoadSaveStateLarge = async () => {
        // load
        const saveStateLarge = await localforage.getItem("scratchinchartin-statelarge");
        appSaveStateLarge.song = saveStateLarge.song;
        // parse
        songImportFromBlob(new Blob([appSaveStateLarge.song]));
    };
    const appLoadSaveState = async () => {
        // load
        const saveState = await localforage.getItem("scratchinchartin-state");
        appSaveState.volume = saveState.volume ?? 0.5;
        // parse
        surferSetAllVolume(appSaveState.volume);
    };
    const appSaveSaveStateLarge = async () => {
        console.log("saving large", appSaveStateLarge);
        await localforage.setItem("scratchinchartin-statelarge", appSaveStateLarge);
    };
    const appSaveSaveState = async () => {
        console.log("saving", appSaveState);
        await localforage.setItem("scratchinchartin-state", appSaveState);
    };

    const songImportFromBlob = async (blob) => {
        const audioUrl = URL.createObjectURL(blob);
        waveSurfer.load(audioUrl);

        // remember the last loaded song
        appSaveStateLarge.song = await blob.arrayBuffer();
        appSaveSaveStateLarge();
    };
    const songImport = async () => {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-songimport",
            multiple: false,
            types: [{
                description: "Audio files",
                accept: {"audio/*": [".mp3", ".ogg", ".flac", ".wav"]}
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        await songImportFromBlob(fileData);
    };

    const chartImportFromObject = async (object) => {

    };
    const chartImportFromString = async (jsonStr) => {
        const obj = JSON.parse(jsonStr);
        await chartImportFromObject(obj);
    };
    const chartImport = async () => {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-chartimport",
            multiple: false,
            types: [{
                description: "Audio files",
                accept: {"audio/*": [".mp3", ".ogg", ".flac", ".wav"]}
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        const decoder = new TextDecoder("utf-8");
        const jsonStr = decoder.decode(await fileData.arrayBuffer());
        await chartImportFromString(jsonStr);
    };
    const chartExport = async () => {
        const fileHandle = await window.showSaveFilePicker({
            id: "scratchin-charting-chartexport",
            suggestedName: "sumidk.json",
            types: [{
                description: "Melodii Chart",
                accept: {"application/json": [".json"]}
            }]
        });
        const writable = await fileHandle.createWritable();
        // TODO: actually export charts
        await writable.write("Wouldnt it be nice to have a chart here?");
        await writable.close();
    };

    const componentsHasLoaded = {
        app: false,
        waveSurfer: false,
    };
    const componentLoaded = async () => {
        if (componentsHasLoaded.app) return;

        // make sure all other components have loaded, then we mark app as loaded
        if (!componentsHasLoaded.waveSurfer) return;
        componentsHasLoaded.app = true;
        
        await appLoadSaveStateLarge();
        await appLoadSaveState();
        appLoading = false;
    };
    onMount(async () => {
        await componentLoaded();
    });
</script>

{#if appLoading}
    <div class="app-loading">
        <p class="app-loading-text">LOADING...</p>
    </div>
{/if}
<div class="app-topbar">
    <img width="32" height="32" src="/favicon.svg" alt="Favicon" />

    <button disabled={appLoading} onclick={chartImport}>Import Chart</button>
    <button disabled={appLoading} onclick={songImport}>Import Song</button>
    <button disabled={appLoading} onclick={chartExport}>Export</button>
</div>
<div class="app-optionsbar">
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
</div>
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

<style>
    .app-topbar {
        width: 100%;
        height: 32px;

        background: #542353;
    }
    .app-topbar {
        display: flex;
        flex-direction: row;
    }
    .app-topbar button,
    .app-topbar input,
    .app-optionsbar button,
    .app-optionsbar input {
        margin: 0;
        padding: 0;
        border: 0;
        height: 100%;
    }
    .app-topbar button,
    .app-topbar label,
    .app-optionsbar button,
    .app-optionsbar label {
        color: white;
        font-family: Helvetica, Arial, sans-serif;
    }
    .app-topbar button {
        margin: 0 4px;
        padding: 0 8px;

        background: transparent;
        font-weight: bold;
    }
    .app-topbar button:hover {
        background: rgba(255, 255, 255, 0.1);

        cursor: pointer;
    }

    .app-optionsbar {
        width: 100%;
        height: 64px;
        
        display: flex;
        flex-direction: row;

        background: #3d1b3d;
    }
    .app-optionsbar-meta {
        width: 200px;
        height: 100%;
        
        display: flex;
        flex-direction: column;
    }
    .app-optionsbar-timing {
        width: 210px;
        height: 100%;

        display: flex;
        flex-direction: column;
    }
    .app-optionsbar-meta label,
    .app-optionsbar-timing label {
        width: 100%;
        height: calc(100% / 3);
        
        display: flex;
        flex-direction: row;
    }
    .app-optionsbar-meta label:nth-child(2),
    .app-optionsbar-timing label:nth-child(2) {
        background: rgba(255, 255, 255, 0.1);
    }
    .app-optionsbar-meta label span,
    .app-optionsbar-timing label span {
        display: block;

        width: 72px;
    }
    .app-optionsbar-meta label[data-left="true"] span,
    .app-optionsbar-timing label[data-left="true"] span {
        width: calc(100% - 32px);
    }
    .app-optionsbar-meta label input[type="text"],
    .app-optionsbar-meta label input[type="number"],
    .app-optionsbar-timing label input[type="text"],
    .app-optionsbar-timing label input[type="number"] {
        width: calc(100% - 72px);
        height: 100%;
    }
    .app-optionsbar-meta label input[type="checkbox"],
    .app-optionsbar-meta label input[type="radio"],
    .app-optionsbar-timing label input[type="checkbox"],
    .app-optionsbar-timing label input[type="radio"] {
        width: 32px;
        height: 100%;
    }

    .app-mainarea {
        width: 100%;
        height: calc(100% - 32px - 64px);
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
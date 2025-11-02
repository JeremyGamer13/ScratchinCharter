<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import WaveSurfer from 'wavesurfer.js';
    import localforage from "localforage";
    
    let appLoading = $state(true);
    let appSaveStateLarge = {
        song: null
    };
    let appSaveState = {
        volume: 0.5,
    };
    
    /** @type {WaveSurfer} */
    let waveSurfer;
    if (browser) {
        waveSurfer = WaveSurfer.create({
            container: "#waveSurfer",
            waveColor: "#BA83F7",
            progressColor: "#FF93F8",
            cursorColor: "#FFFFFF",
            height: "auto",
            normalize: true,
        });
        window.WaveSurfer = waveSurfer;
    }

    const surferSeekWithX = (x) => {
        const width = waveSurfer.getWidth();
        waveSurfer.seekTo(Math.min(Math.max(0, x / width), width));
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
        waveSurfer.setVolume(appSaveState.volume);
    };
    const appSaveSaveStateLarge = async () => {
        console.log("saving large", appSaveStateLarge);
        await localforage.setItem("scratchinchartin-statelarge", appSaveStateLarge);
    };
    const appSaveSaveState = async () => {
        console.log("saving", appSaveState);
        await localforage.setItem("scratchinchartin-state", appSaveState);
    };
    const appMouseWasDown = (x, y) => {
        if (appLoading) return;
        surferSeekWithX(event.clientX);
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

    if (browser) {
        let mouseDown = false;
        window.addEventListener("mouseup", (event) => {
            if (appLoading) return;
            mouseDown = false;
            appMouseWasDown(event.clientX, event.clientY);
        });
        window.addEventListener("mousemove", (event) => {
            if (appLoading) return;
            mouseDown = event.buttons & (1 << 0); // who the fuck designed this shit?
            if (mouseDown) appMouseWasDown(event.clientX, event.clientY);
        });
        window.addEventListener("mousedown", (event) => {
            if (appLoading) return;
            mouseDown = true;
            appMouseWasDown(event.clientX, event.clientY);
        });

        window.addEventListener("keydown", (event) => {
            if (appLoading) return;
            if (event.key === " ") {
                event.preventDefault();
                waveSurfer.playPause();
            }
        });
    }

    onMount(async () => {
        await appLoadSaveStateLarge();
        await appLoadSaveState();
        appLoading = false;
    });
</script>

{#if appLoading}
    <div class="app-loading">
        <p class="app-loading-text">LOADING...</p>
    </div>
{/if}
<div class="app-topbar">
    <button disabled={appLoading} onclick={chartImport}>Import Chart</button>
    <button disabled={appLoading} onclick={songImport}>Import Song</button>
    <button disabled={appLoading} onclick={chartExport}>Export</button>
</div>
<div class="app-mainarea">
    <div id="waveSurfer"></div>
</div>

<style>
    .app-topbar {
        width: 100%;
        height: 64px;

        background: #542353;
    }
    .app-topbar button {
        height: 100%;
    }

    .app-mainarea {
        width: 100%;
        height: calc(100% - 64px);
    }
    #waveSurfer {
        height: 100%;

        background: #271027;
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
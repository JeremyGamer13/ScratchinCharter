<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    import WaveSurfer from 'wavesurfer.js';
    import localforage from "localforage";
    
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
    const songExport = async () => {
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
            mouseDown = false;
            appMouseWasDown(event.clientX, event.clientY);
        });
        window.addEventListener("mousemove", (event) => {
            mouseDown = event.buttons & (1 << 0); // who the fuck designed this shit?
            if (mouseDown) appMouseWasDown(event.clientX, event.clientY);
        });
        window.addEventListener("mousedown", (event) => {
            mouseDown = true;
            appMouseWasDown(event.clientX, event.clientY);
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                event.preventDefault();
                waveSurfer.playPause();
            }
        });
    }

    onMount(async () => {
        await appLoadSaveStateLarge();
        await appLoadSaveState();
    });
</script>

<div class="app-topbar">
    <button onclick={songImport}>Import</button>
    <button onclick={songExport}>Export</button>
</div>
<div class="app-mainarea">
    <div id="waveSurfer"></div>
</div>

<style>
    .app-topbar {
        width: 100%;
        height: 64px;
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
</style>
<script>
    import { onDestroy, onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";

    import WaveSurfer from 'wavesurfer.js';
    
    import WaveSurferState from "$lib/state/wavesurfer.svelte.js";
    
    let props = $props();
    /** @type {HTMLDivElement} */
    let container = null;
    
    const id = props.id ?? `wavesurfer${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
    const instance = { id, created: false };
    
    /** @type {WaveSurfer} */
    let waveSurfer;
    onMount(() => {
        if (instance.created) return;
        waveSurfer = WaveSurfer.create({
            container: container,
            waveColor: "#BA83F7",
            progressColor: "#FF93F8",
            cursorColor: "#FFFFFF",
            height: "auto",
            normalize: true,
        });
        instance.waveSurfer = waveSurfer;
        instance.container = container;
        instance.created = true;

        WaveSurferState.waveSurfers[id] = instance;
        if (props.onload) props.onload(instance);
    });
    onDestroy(() => {
        waveSurfer?.destroy();
        instance.created = false;
    });
    
    const surferSeekWithX = (x) => {
        const { scrollLeft, scrollWidth, clientWidth } = waveSurfer.renderer.scrollContainer;
        waveSurfer.seekTo(Math.min(Math.max(0, (x + scrollLeft) / scrollWidth), 1));
    };
    
    // events
    onMount(() => {
        let mouseDown = false;
        window.addEventListener("mouseup", (event) => {
            if (mouseDown) {
                surferSeekWithX(event.clientX);
            }
            mouseDown = false;
        });
        window.addEventListener("mousemove", (event) => {
            const stillDown = event.buttons & (1 << 0); // who the fuck designed this shit?
            if (mouseDown && stillDown) {
                surferSeekWithX(event.clientX);
            }
        });
        container.addEventListener("mousedown", (event) => {
            mouseDown = true;
            surferSeekWithX(event.clientX);
        });

        let userZoom = 0;
        container.addEventListener("wheel", (event) => {
            // the max zoom is 1 sample filling the whole canvas
            const songData = waveSurfer.getDecodedData();
            const max = waveSurfer.getWidth() * songData.sampleRate;
            const zoom = -event.deltaY;
            userZoom = Math.max(0, Math.min(userZoom + zoom, max));
            waveSurfer.zoom(userZoom);
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === " ") {
                event.preventDefault();
                waveSurfer.playPause();
            }
        });
    });
</script>

<div
    bind:this={container}

    id={id}
    style="height:100%; background: #271027;"
></div>

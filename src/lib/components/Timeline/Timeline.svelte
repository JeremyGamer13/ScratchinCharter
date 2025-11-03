<script>
    import { page } from "$app/state";
    import * as stores from 'svelte/store';
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    
    import TimelineLibrary from "$lib/components/Timeline/TimelineLibrary.js";
    import TimelineState from "$lib/state/timeline.svelte.js";
    
    let props = $props();
    let container = null;

    /** @type {import("animation-timeline-js").Timeline} */
    let timeline = null;
    
    const id = props.id ?? `timeline${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
    const instance = { id, created: false };
    onMount(async () => {
        if (instance.created) return;
        const library = await TimelineLibrary();
        timeline = new library.Timeline({ id: container });
        instance.container = container;
        instance.timeline = timeline;
        instance.created = true;

        TimelineState.editors[id] = instance;
        if (props.onload) props.onload(instance);
    });
    onDestroy(() => {
        timeline?.dispose();
        instance.created = false;
    });
</script>

<div style="width: 100%;height: 100%;" {id} bind:this={container}></div>
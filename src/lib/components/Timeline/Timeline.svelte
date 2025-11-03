<script>
    import { page } from "$app/state";
    import * as stores from 'svelte/store';
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    
    import IconButton from '@smui/icon-button';
    
    import TimelineLibrary from "$lib/components/Timeline/TimelineLibrary.js";
    import TimelineState from "$lib/state/timeline.svelte.js";
    
    let props = $props();
    let container = null;
    let outlineHeader = null;
    let outlineContainer = null;
    let outlineScrollContainer = null;

    /** @type {import("animation-timeline-js").Timeline} */
    let timeline = $state(null);
    /** @type {import("animation-timeline-js").TimelineOptions} */
    let outlineTimelineOptions = $state(null);
    /** @type {import("animation-timeline-js").TimelineRow[]} */
    let rows = $state([]);
    
    const id = props.id ?? `timeline${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
    const instance = { id, created: false };
    const createOutlineAttachments = () => {
        const options = timeline.getOptions();
        timeline.onScroll((event) => {
            if (!options) return;
            if (!outlineContainer) return;
            outlineContainer.style.minHeight = event.scrollHeight + 'px';
            if (!outlineScrollContainer) return;
            outlineScrollContainer.scrollTop = event.scrollTop;
        });
    };
    const rerenderOutline = () => {
        if (!instance.created) return;
        const model = timeline.getModel();
        if (!model) return;
        const options = timeline.getOptions();
        if (!options) return;
        
        outlineTimelineOptions = options;
        outlineHeader.style.maxHeight = outlineHeader.style.minHeight = options.headerHeight + 'px';

        rows.splice(0, rows.length);
        rows.push(...model.rows);
    };
    onMount(async () => {
        if (instance.created) return;
        const library = await TimelineLibrary();
        timeline = new library.Timeline({ id: container });
        instance.container = container;
        instance.timeline = timeline;
        instance.rerenderOutline = rerenderOutline;
        createOutlineAttachments();
        rerenderOutline();
        instance.created = true;

        TimelineState.editors[id] = instance;
        if (props.onload) props.onload(instance);
    });
    onDestroy(() => {
        timeline?.dispose();
        instance.created = false;
    });
</script>

<div class="timeline-toolbar">
    <IconButton class="material-icons">build</IconButton>
</div>
<div class="timeline-container">
    <div class="outline">
        <div class="outline-header" id="outline-header" bind:this={outlineHeader}></div>
        <div class="outline-scroll-container" bind:this={outlineScrollContainer} onscroll={(event) => timeline?._handleWheelEvent(event)}>
            <div class="outline-items" bind:this={outlineContainer}>
                {#if timeline && outlineTimelineOptions}
                    {#each rows as row, index}
                        <div
                            class="outline-node"
                            style={`max-height:${(row.style ? row.style.height : 0) || (outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.height : 0)}px;`
                                + `min-height:${(row.style ? row.style.height : 0) || (outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.height : 0)}px;`
                                + `margin-bottom:${((outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.marginBottom : 0) || 0)}px;`}
                        >
                            {row.title || "Track " + index}
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
    <div style="width: 100%;height: 100%;" {id} bind:this={container}></div>
</div>

<style>
    .timeline-toolbar {
        position: relative;
        height: 48px;
        
        display: flex;

        background-color: #383838;
        overflow: hidden;
    }
    .timeline-container {
        width: 100%;
        height: calc(100% - 48px);

        display: flex;
        flex-direction: row;
    }

    .outline {
        width: 250px;
        min-width: 150px;
        height: 100%;
        
        display: flex;
        flex-direction: column;
        align-items: stretch;
        align-content: stretch;
        
        background: #383838;
        overflow: hidden;
    }
    .outline-header {
        height: 30px;
    }
    .outline-scroll-container {
        overflow: auto;
    }
    .outline-node {
        width: 100%;
        height: 30px;
        padding-left: 20px;
        
        display: flex;
        align-items: center;

        font-size: 12px !important;
        color: white;
        
        user-select: none;
    }
    .outline-node:hover {
        background-color: #3399ff;
    }
</style>
<script>
    import { page } from "$app/state";
    import * as stores from 'svelte/store';
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";

    import { EventEmitter } from "events";
    import Tooltip, { Wrapper } from '@smui/tooltip';
    import Button, { Label } from '@smui/button';
    import Textfield from '@smui/textfield';
    import Fab, { Icon } from '@smui/fab';
    import { Title } from '@smui/dialog';
    import Slider from '@smui/slider';
    import Menu from '@smui/menu';
    
    import Application from "$lib/resources/app.svelte";
    import TimelineLibrary from "$lib/components/Timeline/TimelineLibrary.js";
    import TimelineState from "$lib/state/timeline.svelte.js";
    import {makeFieldSubmitListener} from "$lib/resources/field-submit.js";
    
    let props = $props();
    let container = null;
    let outline = null;
    let outlineHeader = null;
    let outlineContainer = null;
    let outlineScrollContainer = null;

    let buttonMenuPlaybackSpeed = $state(null);

    /** @type {import("animation-timeline-js")} */
    let library = null;
    /** @type {import("animation-timeline-js").Timeline} */
    let timeline = $state(null);
    /** @type {import("animation-timeline-js").TimelineOptions} */
    let outlineTimelineOptions = $state(null);
    /** @type {import("animation-timeline-js").TimelineRow[]} */
    let rows = $state([]);
    let selectedRow = $state("");
    let selectedRowLast = $state("");
    /** @type {import("animation-timeline-js").TimelineKeyframe[]} */
    let selectedKeyframes = $state([]);

    let addTypeLabel = $state("section");
    
    const id = props.id ?? `timeline${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
    const instance = { id, created: false };
    const createOutlineAttachments = () => {
        const options = timeline.getOptions();
        timeline.onScroll((event) => {
            if (!options) return;
            if (!outlineContainer) return;
            // keeps empty space from being misaligned
            outlineContainer.style.minHeight = event.scrollHeight + 'px';
            if (!outlineScrollContainer) return;
            outlineScrollContainer.scrollTop = event.scrollTop;
        });
    };
    const outlineScrolled = (event) => {
        timeline?._handleWheelEvent(event);
    };
    const outlineCheckButtonClicked = (clickedElement) => {
        for (const row of rows) {
            if (!row) continue;
            const buttonId = `timeline-outlinebutton${id}${row.title}`;
            const button = document.getElementById(buttonId);
            if (!button) continue;
            if (button.contains(event.target) || event.target === button) {
                return button;
            }
        }
        return null;
    };
    const outlineTryDeselectRow = (event) => {
        if (!outline) return;
        if (!outline.contains(event.target)) return;
        // if no button was clicked then we should deselect any row selected
        if (!outlineCheckButtonClicked(event.target)) {
            selectedRow = "";
        }
    };

    const timelineOriginals = {};
    class TimelineReactive {
        static get selectedRow() {
            return selectedRow;
        }
        static set selectedRow(value) {
            selectedRow = value;
            if (value !== "") selectedRowLast = value;
        }
        static get selectedRowLast() {
            return selectedRowLast;
        }
        static get selectedKeyframes() {
            return selectedKeyframes;
        }
        static set selectedKeyframes(value) {
            selectedKeyframes = value;
            timeline.select(value, library.TimelineSelectionMode.Normal);
        }

        static get addTypeLabel() {
            return addTypeLabel;
        }
        static set addTypeLabel(value) {
            addTypeLabel = value;
        }

        static events = new EventEmitter();

        static rerenderOutline() {
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
    }
    const createEventListeners = () => {
        timeline.onSelected((event) => {
            selectedKeyframes = event.selected;
        });
    };
    /** @param {import("animation-timeline-js").Timeline} timeline */
    const createOriginals = (timeline) => {
        timelineOriginals["_renderKeyframe"] = timeline._renderKeyframe.bind(timeline);
        timelineOriginals["_formatUnitsText"] = timeline._formatUnitsText.bind(timeline);
    };
    onMount(async () => {
        if (instance.created) return;
        library = await TimelineLibrary();
        timeline = new library.Timeline({ id: container });
        instance.container = container;
        instance.library = library;
        instance.timeline = timeline;
        instance.reactive = TimelineReactive;
        createOriginals(timeline);
        instance.original = timelineOriginals;
        createOutlineAttachments();
        TimelineReactive.rerenderOutline();
        createEventListeners();
        instance.created = true;
        
        TimelineState.editors[id] = instance;
        if (props.onload) props.onload(instance);
    });
    onDestroy(() => {
        timeline?.dispose();
        instance.created = false;
    });

    let appWavesurferPlaying = $state(false);
    let appWavesurferSpeed = $state(1);
    const appWavesurferSetSpeed = (newSpeed) => {
        appWavesurferSpeed = newSpeed;

        const speed = Number($state.snapshot(appWavesurferSpeed));
        const realRate = (Number.isFinite(speed) && !Number.isNaN(speed)) ? Math.min(Math.max(0.01, speed), 1e+10) : 1;

        let wasPlaying = Application.state.timingPreview.isPlaying();
        let currentTime = Application.state.timingPreview.getCurrentTime();
        Application.state.timingPreview.pause();
        Application.state.timingPreview.setPlaybackRate(realRate);
        Application.state.timingPreview.setTime(currentTime);
        if (wasPlaying) Application.state.timingPreview.play();
    };
    onMount(() => {
        window.addEventListener("scratchincharter-app-loaded", () => {
            Application.state.timingPreview.on("play", () => {
                appWavesurferPlaying = true;
            });
            Application.state.timingPreview.on("pause", () => {
                appWavesurferPlaying = false;
            });
            Application.state.timingPreview.on("finish", () => {
                appWavesurferPlaying = false;
            });
            Application.state.timingPreview.on("load", () => {
                appWavesurferSpeed = Application.state.timingPreview.getPlaybackRate();
            });
            Application.state.timingPreview.on("decode", () => {
                appWavesurferSpeed = Application.state.timingPreview.getPlaybackRate();
            });
        });
    });
</script>

{#if Application.state.appLoaded}
    <Menu bind:this={buttonMenuPlaybackSpeed} style="padding:0 16px">
        <Title>Playback Speed</Title>
        <Textfield
            value={appWavesurferSpeed}
            variant="outlined"
            label="Playback Speed"
            suffix="x"
            onkeydown={makeFieldSubmitListener((event) => appWavesurferSetSpeed(event.target.value))}
            onchange={(event) => appWavesurferSetSpeed(event.target.value)}
            onblur={(event) => appWavesurferSetSpeed(event.detail.target.value)}
        />
        <!-- TODO: Need to figure out how to access `instance` in Slider so it can be
        updated when the value updates. This probably needs an SMUI fork entirely honestly. -->
        <Slider
            min={0.25}
            max={2}
            step={0.25}
            tickMarks
            discrete
            value={appWavesurferSpeed}
            onSMUISliderInput={(event) => appWavesurferSetSpeed(event.detail.value)}
        />
    </Menu>
{/if}
<div class="timeline-toolbar">
    {#if Application.state.appLoaded}
        <Wrapper><Fab color="primary" onclick={() => Application.state.timingPreview.playPause()}>
            <Icon class="material-symbols">{!appWavesurferPlaying ? "play_arrow" : "pause"}</Icon>
        </Fab><Tooltip>{!appWavesurferPlaying ? "Play" : "Pause"} the audio clip</Tooltip></Wrapper>
        <Wrapper><Fab color="primary" onclick={() => buttonMenuPlaybackSpeed.setOpen(true)}>
            <Icon class="material-symbols">slow_motion_video</Icon>
        </Fab><Tooltip>Change the playback speed</Tooltip></Wrapper>
        <div style="width:24px;"></div>
    {/if}
    <Wrapper><Fab color="primary" onclick={() => timeline?.setInteractionMode("selection")}>
        <Icon class="material-symbols">arrow_selector_tool</Icon>
    </Fab><Tooltip>Select tool</Tooltip></Wrapper>
    <Wrapper><Fab color="primary" onclick={() => timeline?.setInteractionMode("zoom")}>
        <Icon class="material-symbols">search</Icon>
    </Fab><Tooltip>Zoom tool (Ctrl + Click to zoom out)</Tooltip></Wrapper>
    <Wrapper><Fab color="primary" onclick={() => timeline?.setInteractionMode("nonInteractivePan")}>
        <Icon class="material-symbols">pan_tool</Icon>
    </Fab><Tooltip>Pan tool (drag on timeline to scroll)</Tooltip></Wrapper>
    <div style="width:24px;"></div>
    <Wrapper><Fab color="primary" onclick={() => timeline?.zoomOut()}>
        <Icon class="material-symbols">zoom_in</Icon>
    </Fab><Tooltip>Zoom in to timeline</Tooltip></Wrapper>
    <Wrapper><Fab color="primary" onclick={() => timeline?.zoomIn()}>
        <Icon class="material-symbols">zoom_out</Icon>
    </Fab><Tooltip>Zoom out of timeline</Tooltip></Wrapper>
    <div style="width:24px;"></div>
    <Wrapper><Fab color="secondary" onclick={() => TimelineReactive.events.emit("add-keyframe")}>
        <Icon class="material-symbols">add_diamond</Icon>
    </Fab><Tooltip>Add {addTypeLabel} at timeline cursor</Tooltip></Wrapper>
    <Wrapper><Fab color="secondary" onclick={() => TimelineReactive.events.emit("remove-keyframes")}>
        <Icon class="material-symbols">delete</Icon>
    </Fab><Tooltip>Remove {addTypeLabel}(s)</Tooltip></Wrapper>
</div>
<div class="timeline-container">
    <!-- TODO: remedy with a button in properties to deselect -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="outline" bind:this={outline} onclick={outlineTryDeselectRow}>
        <div class="outline-header" bind:this={outlineHeader}></div>
        <div class="outline-scroll-container" bind:this={outlineScrollContainer} onmousewheel={outlineScrolled}>
            <div class="outline-items" bind:this={outlineContainer}>
                {#if timeline && outlineTimelineOptions}
                    {#each rows as row, index}
                        <Button
                            id={`timeline-outlinebutton${id}${row.title}`}
                            class="outline-node"
                            variant={row.title === selectedRow ? "unelevated" : null}
                            onclick={() => { selectedRow = row.title; selectedRowLast = row.title; }}
                            style={`justify-content: flex-start;`
                                + `max-height:${(row.style ? row.style.height : 0) || (outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.height : 0)}px;`
                                + `min-height:${(row.style ? row.style.height : 0) || (outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.height : 0)}px;`
                                + `margin-bottom:${((outlineTimelineOptions.rowsStyle ? outlineTimelineOptions.rowsStyle.marginBottom : 0) || 0)}px;`}
                        >
                            <Label>{row.title || "Track " + index}</Label>
                        </Button>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
    <div style="width: calc(100% - 250px);height: 100%;" {id} bind:this={container}></div>
</div>

<style>
    .timeline-toolbar {
        position: relative;
        height: 64px;
        padding: 4px;
        
        display: flex;
        flex-direction: row;
        align-items: center;

        background-color: #383838;
        overflow: hidden;
    }
    .timeline-toolbar > :global(*) {
        margin-right: 8px;
    }
    .timeline-container {
        width: 100%;
        height: calc(100% - 64px);

        display: flex;
        flex-direction: row;
    }

    .outline {
        width: 250px;
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
        overflow-x: hidden;
        overflow-y: hidden;
    }
    .outline :global(.outline-node) {
        width: 100%;
        height: 30px;
        padding-left: 20px;
        
        display: flex;
        align-items: center;

        font-size: 12px !important;
        color: white;
        
        user-select: none;
    }
</style>
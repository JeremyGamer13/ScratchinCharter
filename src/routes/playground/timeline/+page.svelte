<script>
    import Timeline from "$lib/components/Timeline/Timeline.svelte";
    import TimelineState from "$lib/state/monaco.svelte.js";

    const onLoad = (timelineInstance) => {
        window.TimelineSvelte = timelineInstance;
        window.TimelineState = TimelineState;
    };
</script>

<Timeline
    id="timeline-test"
    onload={onLoad}
></Timeline>
<script>
    import { page } from "$app/state";
    import * as stores from 'svelte/store';
    import { browser } from "$app/environment";
    import { onMount, onDestroy } from "svelte";
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import SMUIPrompts from '$lib/resources/smui-prompts';
    import MelodiiChart from "$lib/resources/chart";
    import TimelineState from "$lib/state/timeline.svelte.js";
    
    import TimelineMelodiiCreator from "$lib/components/Timeline/TimelineMelodii.svelte.js";

    // The purpose of this file is to centralize all Melodii + Timeline actions,
    // while also keeping Svelte reactivity & syntax possible.
    // This file is only meant to be imported on the main route page.
    class TimelineMelodii {
        constructor(timelineInstance) {
            this.timelineInstance = timelineInstance;

            this.selected = [];

            // listen for events
            // Prevent the first keyframe from being moved in sections mode
            this.timelineInstance.timeline.onKeyframeChanged((event) => {
                if (event.source !== "user") return;
                if (event.target.type !== "keyframe") return;
                if (!this.shouldDragBeBlocked(event)) return;
                event.preventDefault();
                Application.loadChartIntoTimeline();
            });
            // Save on drag finish
            this.timelineInstance.timeline.onDragFinished((event) => {
                this.applyChartChanges();
            });
        }

        shouldDragBeBlocked(event) {
            // always block if this is a track helper
            if (event.target.keyframe.trackHelper === true) return true;
            // if we are in sections mode, the keyframe at 0 should not be dragged
            if (Application.state.timelineMode === "sections") {
                if (event.target.prevVal === 0) return true;
            }
            return false;
        }
        getAllKeyframesWithRows(model) {
            if (!model) model = this.timelineInstance.timeline.getModel();
            const allKeyframes = [];
            for (const row of model.rows) {
                for (const keyframe of row.keyframes) {
                    keyframe._row = row.title;
                    allKeyframes.push(keyframe);
                }
            }
            return allKeyframes;
        }
        resolveKeyframe(keyframe, model) {
            const allKeyframes = this.getAllKeyframesWithRows(model);
            return allKeyframes.find(k => keyframe.val === k.val && keyframe._row === k._row);
        }
        resolveKeyframes(keyframes, model) {
            return keyframes.map(keyframe => this.resolveKeyframe(keyframe, model))
                .filter(keyframe => !!keyframe);
        }
        preserveSelected() {
            this.selected = structuredClone(this.timelineInstance.timeline.getSelectedElements());
        }
        restoreSelected() {
            // actually get all keyframes with their row attached
            const allKeyframes = this.getAllKeyframesWithRows();
            // map each of the selected elements to one of the keyframes
            const selectedKeyframes = this.selected.map(keyframe => allKeyframes.find(k => keyframe.val === k.val && keyframe.row.title === k._row))
                .filter(keyframe => !!keyframe);
            this.timelineInstance.timeline.select(selectedKeyframes, this.timelineInstance.library.TimelineSelectionMode.Normal);
        }

        applyChartChanges() {
            this.preserveSelected();
            Application.saveCurrentChartTimeline();
            this.restoreSelected();
        }
        reloadChart() {
            this.preserveSelected();
            Application.validateChart();
            Application.loadChartIntoTimeline();
            this.restoreSelected();
        }

        setTimelineForSections() {
            const options = this.timelineInstance.timeline.getOptions();
            options.snapStep = 200;
            options.stepPx = 120;
            options.stepSmallPx = 30;
            options.stepVal = 1000;
            this.timelineInstance.timeline.setOptions(options);

            this.timelineInstance.timeline._renderKeyframe = this.timelineInstance.original._renderKeyframe;
            this.timelineInstance.timeline._formatUnitsText = this.timelineInstance.original._formatUnitsText;
        }
        setTimelineForSection(beatsPerMeasure) {
            const options = this.timelineInstance.timeline.getOptions();
            options.snapStep = 1000 / beatsPerMeasure;
            options.stepPx = 1000 / (beatsPerMeasure * 2);
            options.stepSmallPx = 1000 / (beatsPerMeasure * 4);
            options.stepVal = 1000;
            this.timelineInstance.timeline.setOptions(options);

            this.timelineInstance.timeline._renderKeyframe = this.timelineInstance.original._renderKeyframe;
            this.timelineInstance.timeline._formatUnitsText = (beat) => { return (beat / 1000) + 1; };
        }
        

        removeSelectedKeyframes() {
            // remove the selected keyframes from the model
            const model = this.timelineInstance.timeline.getModel();
            for (const row of model.rows) {
                row.keyframes = row.keyframes.filter((p) => !p.selected || p.deletable === false);
            }
            this.timelineInstance.timeline.setModel(model);

            // re-read from timeline & reload
            this.applyChartChanges();
        }

        addSectionAtCursor() {
            this.applyChartChanges();
            const chart = $SaveState.chart;
            const cursorTime = Application.state.timeline.timeline.getTime();
            const sampleTime = (cursorTime / 1000) * chart.sampleRate;
            const newSection = MelodiiChart.defaultSection();
            newSection.start = sampleTime;

            // Copy the last section's timing info
            const previousSections = chart.sections.filter(section => section.start <= sampleTime);
            const previousSection = previousSections[0] ? previousSections[previousSections.length - 1] : null;
            if (previousSection) {
                newSection.samplesPerBeat = previousSection.samplesPerBeat;
                newSection.beatsPerMeasure = previousSection.beatsPerMeasure;
            }

            // Update chart
            chart.sections.push(newSection);
            this.reloadChart();
        }
        addNoteAtCursor(row) {
            const rowToUse = row
                || Application.state.timeline.reactive.selectedRow
                || Application.state.timeline.reactive.selectedRowLast
                || Object.keys($SaveState.chart.tracks).at(0);
            if (!rowToUse) throw new Error("No row exists");

            this.applyChartChanges();
            const chart = $SaveState.chart;
            const section = Application.state.timelineSection;
            const cursorTime = Application.state.timeline.timeline.getTime();
            const sampleTime = (MelodiiChart.beatToSeconds(cursorTime / 1000, chart.sampleRate, section.samplesPerBeat) * chart.sampleRate) + section.start;
            const newNote = [sampleTime, sampleTime];

            // Update chart
            const track = chart.tracks[rowToUse];
            track.push(newNote);
            this.reloadChart();
        }
    }

    TimelineMelodiiCreator.create = (timelineInstance) => {
        return new TimelineMelodii(timelineInstance);
    };
</script>

<div style="display: none;"></div>

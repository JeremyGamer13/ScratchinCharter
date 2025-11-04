import TimelineLibrary from "$lib/components/Timeline/TimelineLibrary.js";

class MelodiiChart {
    static defaultChart() {
        return {
            "format": "1",
            "song": "",
            "version": 1,
            "sampleRate": 44100,
            "sections": [
                this.defaultSection(),
            ],
            "tracks": {}
        };
    }
    static defaultSection() {
        return {
            "name": "Section",
            "start": 0,
            "samplesPerBeat": 22050,
            "beatsPerMeasurement": 4
        };
    }

    static isValidVersion(version) {
        return Number.isSafeInteger(version) && version >= 0;
    }
    static isValidSampleRate(sampleRate) {
        if (!sampleRate) return false;
        return Number.isSafeInteger(sampleRate) && sampleRate > 0;
    }
    static isValidEventId(eventId) {
        // arbitrary but probably a good idea
        return (/[a-zA-Z0-9\-\_]/gi).test(eventId);
    }

    /** @returns {import("animation-timeline-js").TimelineModel} */
    static getTimelineForSections(chart) {
        // we can mostly map each section to a keyframe easily,
        // but we need 1 keyframe at the very beginning
        // and it cannot be moved.
        // Each section starts at a specific sample time, and we need it in ms
        const keyframes = chart.sections.map(section => ({
            val: (section.start / chart.sampleRate) * 1000,
            name: section.name,
            samplesPerBeat: section.samplesPerBeat,
            beatsPerMeasurement: section.beatsPerMeasurement,
        }));
        if (!keyframes[0]) keyframes[0] = {
            val: 0,
            name: this.defaultSection().name,
            samplesPerBeat: this.defaultSection().samplesPerBeat,
            beatsPerMeasurement: this.defaultSection().beatsPerMeasurement,
        };
        // make the first keyframe not movable
        const firstKeyframe = keyframes[0];
        firstKeyframe.draggable = false;
        return {
            rows: [
                {
                    title: "Sections",
                    keyframes,
                },
            ],
        };
    }
    /** @param {import("animation-timeline-js").TimelineModel} model */
    static parseTimelineAsSections(model, sampleRate) {
        if (model.rows.length > 1) throw new Error("Unexpected row count " + model.rows.length);
        const timelineSections = model.rows[0];
        return timelineSections.keyframes.map(keyframe => ({
            ...(this.defaultSection()),
            "name": keyframe.name,
            "start": (keyframe.val / 1000) * sampleRate,
            "samplesPerBeat": keyframe.samplesPerBeat,
            "beatsPerMeasurement": keyframe.beatsPerMeasurement
        }));
    }
}

export default MelodiiChart;
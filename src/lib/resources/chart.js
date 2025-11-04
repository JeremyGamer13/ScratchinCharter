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
        return Number.isSafeInteger(sampleRate) && sampleRate > 0;
    }
    static isValidEventId(eventId) {
        // arbitrary but probably a good idea
        return (/[a-zA-Z0-9\-\_]/gi).test(eventId);
    }

    /** @returns {import("animation-timeline-js").TimelineModel} */
    static getTimelineForSections(chart) {
        const keyframes = [
            {
                val: 0
            }
        ];
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
    static parseTimelineForSections(model) {

    }
}

export default MelodiiChart;
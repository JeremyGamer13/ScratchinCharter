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

    static validateChart(chart) {
        /**
         * @type {{ sections:[{}] }}
         */
        const fixedChart = structuredClone(chart);
        // chart props
        if (!this.isValidVersion(fixedChart.version))
            fixedChart.version = 1;
        if (!this.isValidSampleRate(fixedChart.sampleRate))
            fixedChart.sampleRate = Math.trunc(Number(fixedChart.sampleRate));
        if (!this.isValidSampleRate(fixedChart.sampleRate))
            fixedChart.sampleRate = 44100; // RIP timing but no other way to fix sampleRate

        // fix sections, sort and remove duplicate timings
        fixedChart.sections.sort((a, b) => a.start - b.start);
        fixedChart.sections = fixedChart.sections.map((section, i) => {
            // first section HAS to start at 0
            if (i === 0) section.start = 0;

            if (!this.isValidSampleRate(section.samplesPerBeat))
                section.samplesPerBeat = Math.trunc(Number(section.samplesPerBeat));
            if (!this.isValidSampleRate(section.samplesPerBeat))
                section.samplesPerBeat = 22050; // RIP timing but no other way to fix samplesPerBeat
            return section;
        });
        fixedChart.sections = fixedChart.sections.filter((section, i) => fixedChart.sections.findIndex(s => s.start === section.start) === i);

        return fixedChart
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
        // make the first keyframe not touchable
        const firstKeyframe = keyframes[0];
        firstKeyframe.draggable = false;
        firstKeyframe.deletable = false; // not in the api but we handle deletion so
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
        const sections = timelineSections.keyframes.map(keyframe => ({
            ...(this.defaultSection()),
            "name": keyframe.name,
            "start": Math.trunc((keyframe.val / 1000) * sampleRate),
            "samplesPerBeat": keyframe.samplesPerBeat,
            "beatsPerMeasurement": keyframe.beatsPerMeasurement
        }));
        return sections;
    }
}

export default MelodiiChart;
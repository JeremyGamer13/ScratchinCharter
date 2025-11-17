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
            "beatsPerMeasure": 4
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

    static samplesPerBeatToBPM(samplesPerBeat, sampleRate) {
        return (sampleRate * 60) / samplesPerBeat;
    }
    static bpmToSamplesPerBeat(bpm, sampleRate) {
        return (sampleRate * 60) / bpm;
    }
    static secondsToBeat(seconds, sampleRate, samplesPerBeat) {
        return seconds * (sampleRate / samplesPerBeat);
    }
    static beatToSeconds(beat, sampleRate, samplesPerBeat) {
        return beat * (samplesPerBeat / sampleRate);
    }

    static validateChart(chart) {
        /** @type {{ sections:[{}] }} */
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

        // fix tracks, truncate decimals, sort notes, and remove duplicate notes
        for (const trackName in fixedChart.tracks) {
            const track = fixedChart.tracks[trackName]
                .map(note => {
                    if (!note[1])
                        note[1] = note[0];
                    note[0] = Math.abs(Math.trunc(Number(note[0])));
                    note[1] = Math.abs(Math.trunc(Number(note[1])));
                    return note;
                });
            track.sort((a, b) => a[0] - b[0]);
            fixedChart.tracks[trackName] = track
                .filter((note, i) => track.findIndex(n => n[0] === note[0]) === i);
        }

        return fixedChart
    }

    /** @returns {import("animation-timeline-js").TimelineModel} */
    static getTimelineForSections(chart) {
        // we can mostly map each section to a keyframe easily,
        // but we need 1 keyframe at the very beginning
        // and it cannot be moved.
        const rowTitle = "Sections";
        // Each section starts at a specific sample time, and we need it in ms
        const keyframes = chart.sections.map(section => ({
            _row: rowTitle,
            group: `justtoseparatekeyframes${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`,
            section,
            val: (section.start / chart.sampleRate) * 1000,
            name: section.name,
            samplesPerBeat: section.samplesPerBeat,
            beatsPerMeasure: section.beatsPerMeasure,
        }));
        if (!keyframes[0]) {
            const firstSection = this.defaultSection();
            keyframes[0] = {
                _row: rowTitle,
                group: `justtoseparatekeyframes${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`,
                section: firstSection,
                val: 0,
                name: firstSection.name,
                samplesPerBeat: firstSection.samplesPerBeat,
                beatsPerMeasure: firstSection.beatsPerMeasure,
            };
        }
        // make the first keyframe not touchable
        const firstKeyframe = keyframes[0];
        firstKeyframe.draggable = false;
        firstKeyframe.deletable = false; // not in the api but we handle deletion so
        return {
            rows: [
                {
                    title: rowTitle,
                    keyframes,
                },
            ],
        };
    }
    /** @param {{sections:[{}]}} chart @returns {import("animation-timeline-js").TimelineModel} */
    static getTimelineForSection(chart, section) {
        const sampleRate = chart.sampleRate;
        const sectionIdx = chart.sections.findIndex(s => s.start === section.start);
        if (sectionIdx === -1) throw new Error("Section not present in the chart");
        const nextSection = chart.sections[sectionIdx + 1];

        const tracks = Object.keys(chart.tracks).map(trackKey => {
            /** @type {[[start:number, end:number, payload:any?]]} */
            const track = chart.tracks[trackKey];
            const row = {
                title: trackKey,
                track,
                keyframes: track
                    .filter(note => note[0] >= section.start && (nextSection ? note[0] < nextSection.start : true))
                    .map(note => ({
                        _row: trackKey,
                        group: `justtoseparatekeyframes${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`,
                        note,
                        // TODO: Were samples placed based on samples per beat or are they exact timings in the song?
                        // This currently assumes exact song timings. Need to examine built-in songs to tell later.
                        val: this.secondsToBeat((note[0] - section.start) / sampleRate, sampleRate, section.samplesPerBeat) * 1000,
                        end: this.secondsToBeat((note[1] - section.start) / sampleRate, sampleRate, section.samplesPerBeat) * 1000,
                        payload: note[2],
                    })),
            };
            return row;
        });
        // add helper track if there's another section after this
        if (nextSection) {
            const helperTrackName = "(Section Length)";
            const helperTrack = {
                title: helperTrackName,
                trackHelper: true,
                keyframes: [
                    {
                        _row: helperTrackName,
                        group: `helpertracksectionlength`,
                        val: 0,
                        draggable: false,
                        deletable: false,
                        selectable: false,
                        trackHelper: true,
                    },
                    {
                        _row: helperTrackName,
                        group: `helpertracksectionlength`,
                        val: this.secondsToBeat((nextSection.start - section.start) / sampleRate, sampleRate, section.samplesPerBeat) * 1000,
                        draggable: false,
                        deletable: false,
                        selectable: false,
                        trackHelper: true,
                    }
                ]
            }
            tracks.unshift(helperTrack);
        }

        return {
            rows: tracks,
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
            "beatsPerMeasure": keyframe.beatsPerMeasure
        }));
        return sections;
    }
    /** @param {import("animation-timeline-js").TimelineModel} model */
    static parseTimelineAsSectionTracks(model, section, sampleRate) {
        const tracks = {};
        for (const row of model.rows) {
            if (row.trackHelper) continue;
            // each (real) row in the model is assigned an array of keyframes
            // currently these keyframes have no length but that might be adjusted later
            const notes = row.keyframes
                .filter(keyframe => !keyframe.trackHelper)
                .map(keyframe => {
                    const start = keyframe.val;
                    const end = keyframe.val; // see above comments
                    // to convert sampleTime to beat, we use
                    // this.secondsToBeat((note[0] - section.start) / sampleRate, sampleRate, section.samplesPerBeat) * 1000
                    // so we have to do the inverse
                    const note = [
                        (this.beatToSeconds(start / 1000, sampleRate, section.samplesPerBeat) * sampleRate) + section.start,
                        (this.beatToSeconds(end / 1000, sampleRate, section.samplesPerBeat) * sampleRate) + section.start
                    ];
                    if (keyframe.payload)
                        note.push(keyframe.payload);
                    return note;
                });
            tracks[row.title] = notes;
        }
        return tracks;
    }

    static clearSection(section, chart) {
        const newChart = structuredClone(chart);
        const sectionIdx = newChart.sections.findIndex(s => s.start === section.start);
        if (sectionIdx === -1) throw new Error("Section not present in the chart");
        const nextSection = newChart.sections[sectionIdx + 1];

        for (const trackName in newChart.tracks) {
            const track = newChart.tracks[trackName];
            // filter out the notes that are in the section, so we only keep the ones not in the section
            // this filter should be the same as the one that gets the timeline for this section (just prepended with ! for not)
            newChart.tracks[trackName] = track.filter(note => !(note[0] >= section.start && (nextSection ? note[0] < nextSection.start : true)))
        }
        return newChart;
    }
    static mergeTracks(tracks1, tracks2) {
        const mergedTracks = structuredClone(tracks1);
        for (const trackName in tracks2) {
            // if tracks2 has a track not present in mergedTracks then add it as an empty track for now
            if (!mergedTracks[trackName]) mergedTracks[trackName] = [];
            // merge the original track with the new track
            // should be sorted by start time & have no duplicates
            const originalTrack = tracks1[trackName];
            const newTrack = tracks2[trackName]
            const mergedTrack = [].concat(originalTrack, newTrack);
            mergedTrack.sort((a, b) => a[0] - b[0]);
            mergedTracks[trackName] = mergedTrack
                .filter((note, i) => mergedTrack.findIndex(n => n[0] === note[0]) === i);
        }
        return mergedTracks;
    }
}

export default MelodiiChart;
class MelodiiChart {
    static defaultChart() {
        return {
            "chartVersion": "1",
            "song": "",
            "version": 1,
            "sampleRate": 44100,
            "speed": {
                "player": 4.9,
                "mentor": 4.9
            },
            "sections": [],
            "tracks": {}
        };
    }
    static defaultSection() {
        return {
            "name": "",
            "start": 0,
            "samplesPerBeat": 22050,
            "beatsPerMeasurement": 4
        };
    }

    static isValidEventId(eventId) {
        // arbitrary but probably a good idea
        return (/[a-zA-Z0-9\-\_]/gi).test(eventId);
    }
}

export default MelodiiChart;
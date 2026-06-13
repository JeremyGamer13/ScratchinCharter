/**
 * A namespace declaring all the interfaces and types related to ScratchinCharting.
 */
declare namespace ScratchinCharting {
    /**
     * The structure for a ScratchinCharting MelodiiChart.
     */
    interface MelodiiChart {
        /**
         * The chart format.
         */
        format: "1";
        /**
         * The path to the audio file attached to this chart in Unity.
         */
        song: string;
        /**
         * The user-version number for this chart, essentially marking the revision count.
         * This is attached to high-scores & ranks on this chart.
         */
        version: number;
        /**
         * The sample rate that this chart's song is intended to play at.
         */
        sampleRate: number;
        sections: MelodiiChartSection[];
        tracks: MelodiiChartTracks;
    }

    interface MelodiiChartSection {
        /**
         * The user-defined name for this section.
         */
        name: string;
        /**
         * The sample which this section starts on.
         */
        start: number;
        /**
         * The samples-per-beat for this section.
         * This defines the BPM that this section plays at.
         */
        samplesPerBeat: number;
        /**
         * The amount of beats-per-measure for this section.
         * This defines the time signature (ie, 4/4) that this section plays in.
         * Assume (beatsPerMeasure) / 4 is the time signature.
         */
        beatsPerMeasure: number;
    }

    interface MelodiiChartTracks {
        [key: string]: MelodiiChartNote[];
    }

    /**
     * A note within MelodiiChartTracks.
     */
    type MelodiiChartNote = [
        startTime: number,
        endTime: number,
        payload: string | number | object | MelodiiChartNotePayloadVoiceClips | null
    ];

    /**
     * The structure for a ScratchinCharting MelodiiChartNotePayload of type Object, containing VoiceClips data.
     * This payload type is expected on tracks named "VoiceClips" and "VoiceClipsPlayer" in ScratchinCharting.
     */
    interface MelodiiChartNotePayloadVoiceClips {
        A_note?: MelodiiChartNotePayloadVoiceClipsNote;
        B_note?: MelodiiChartNotePayloadVoiceClipsNote;
        X_note?: MelodiiChartNotePayloadVoiceClipsNote;
        Y_note?: MelodiiChartNotePayloadVoiceClipsNote;
        L_note?: MelodiiChartNotePayloadVoiceClipsNote;
        R_note?: MelodiiChartNotePayloadVoiceClipsNote;
        Up_note?: MelodiiChartNotePayloadVoiceClipsNote;
        Left_note?: MelodiiChartNotePayloadVoiceClipsNote;
        Down_note?: MelodiiChartNotePayloadVoiceClipsNote;
        Right_note?: MelodiiChartNotePayloadVoiceClipsNote;
    }
    /**
     * The structure for a MelodiiChartNotePayloadVoiceClipsNote within VoiceClips payloads.
     */
    interface MelodiiChartNotePayloadVoiceClipsNote {
        /**
         * When the note key is pressed (ex, A, B, Left, Right) more times than there are samples:
         * - `true` = The last sample will be repeated (ex: "stir", "and", "mix", "mix", "mix", "mix")
         * - `false` = The sample selection will loop-around (ex: "stir", "and", "mix", "stir", "and", "mix")
         */
        sticky: boolean;

        /**
         * The path to the sound files (samples) attached to this note in Unity.
         */
        sounds: string[];
    }
};

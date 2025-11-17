<script>
    import Drawer, {
        AppContent,
        Content,
        Header,
        Title,
        Subtitle,
    } from '@smui/drawer';
    import Textfield from '@smui/textfield';
    import Icon from '@smui/textfield/icon';
    import Button, { Label } from '@smui/button';
    import Select, { Option } from '@smui/select';
    import HelperText from '@smui/textfield/helper-text';
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import SMUIPrompts from '$lib/resources/smui-prompts';
    import MelodiiChart from "$lib/resources/chart";
    import {makeFieldSubmitListener} from "$lib/resources/field-submit.js";

    // keyframe -->
    let sectionKeyframeSelected = $derived(Application.state.timelineMode === "sections" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedKeyframes.length > 0
        : false);
    let noteSelected = $derived(Application.state.timelineMode === "section" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedKeyframes.length > 0
        : false);
    // rows -->
    let trackSelected = $derived(Application.state.timelineMode === "section" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedRow !== ""
        : false);
    let sectionsSelected = $derived(Application.state.timelineMode === "sections" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedRow === "Sections"
        : false);
    // no row or keyframe selected -->
    let sectionSelected = $derived(Application.state.timelineMode === "section" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedRow === ""
        : false);

    // no row or keyframe selected
    // project
    const propertiesProjectConvertRate = async () => {
        const doConvert = await SMUIPrompts.confirm("Are you sure you want to change the Sample rate of your chart?"
            + "\n"
            + "\n" + "This will be difficult to undo. It's recommended to make a backup of your current chart."
            + "\n" + " - All sections will be re-aligned to the new sample rate."
            + "\n" + " - All notes will be re-aligned to the new sample rate."
            + "\n" + " - Notes at the beginning/end of sections may bleed into other sections."
            + "\n" + " - Some notes may be slightly inaccurate due to rounding errors.");
        if (!doConvert) return;

        let sampleRate = null;
        while (!sampleRate) {
            sampleRate = Number(await SMUIPrompts.prompt(`Please enter the new Sample rate (Hz).`
                + `\n` + ` - It is recommended to use something like Audacity to find the Sample rate (but make sure you do not use the Project rate.)`
                + `\n` + ` - This number cannot be changed later without conversion, which can cause inaccurate timing or buggy behavior.`
                + `\n` + ` - You can convert other audio files to this Sample rate, but that can reduce audio quality in some cases.`
                , 44100));
            if (sampleRate && !MelodiiChart.isValidSampleRate(sampleRate)) {
                sampleRate = null;
                await SMUIPrompts.alert(`That is not a valid Sample rate.`
                    + `\n` + ` - Only enter the Sample rate with numbers.`
                    + `\n` + ` - Make sure the Sample rate is in Hz. (Hertz)`
                    + `\n` + ` - Make sure you did not enter other values, like Bit rate.`
                    + `\n` + ` - The Sample rate must be an integer, and be non-negative.`
                    + `\n`
                    + `\n` + `Let's try that again.`);
            }
        }
        if (!sampleRate) return;

        // TODO: this
        throw new Error("Not implemented");
    };
    // section
    const propertiesSectionExitSection = () => {
        Application.state.timeline.melodii.applyChartChanges();
        Application.switchTimelineToSections();
    };
    const propertiesSectionGeneratePinkWarning = () => {
        Application.state.timeline.melodii.applyChartChanges();
        // check for LineStart & add PinkWarning track if missing
        if (!Object.prototype.hasOwnProperty.call($SaveState.chart.tracks, "LineStart"))
            return SMUIPrompts.alert("No LineStart track exists.");
        if (!Object.prototype.hasOwnProperty.call($SaveState.chart.tracks, "PinkWarning"))
            $SaveState.chart.tracks["PinkWarning"] = [];
        const pinkWarningTrack = $SaveState.chart.tracks["PinkWarning"];
        const lineStartTrack = $SaveState.chart.tracks["LineStart"];

        // PinkWarnings should be placed half a beat before a new line
        const sampleRate = $SaveState.chart.sampleRate;
        const section = Application.state.timelineSection;
        for (const keyframe of lineStartTrack) {
            const beat = MelodiiChart.secondsToBeat((keyframe[0] - section.start) / sampleRate, sampleRate, section.samplesPerBeat);
            const newSampleTime = (MelodiiChart.beatToSeconds(beat - 0.5, sampleRate, section.samplesPerBeat) * sampleRate) + section.start;
            const newNote = [newSampleTime, newSampleTime];
            pinkWarningTrack.push(newNote);
        }
        Application.state.timeline.melodii.reloadChart();
    };
    const propertiesSectionGeneratePerfectBlue = () => {
        Application.state.timeline.melodii.applyChartChanges();
        // check for button tracks & add Perfect_Blue track if missing
        const buttonTracks = [
            "A_note_Player",
            "B_note_Player",
            "X_note_Player",
            "Y_note_Player",
            "L_note_Player",
            "R_note_Player",
            "Up_note_Player",
            "Left_note_Player",
            "Down_note_Player",
            "Right_note_Player",
        ];
        if (!buttonTracks.some((trackName) => Object.prototype.hasOwnProperty.call($SaveState.chart.tracks, trackName)))
            return SMUIPrompts.alert("None of the player button tracks exist.");
        if (!Object.prototype.hasOwnProperty.call($SaveState.chart.tracks, "Perfect_Blue"))
            $SaveState.chart.tracks["Perfect_Blue"] = [];
        // Perfect_Blue is just all player button tracks merged
        const sampleRate = $SaveState.chart.sampleRate;
        const section = Application.state.timelineSection;
        for (const trackName of buttonTracks) {
            if (!$SaveState.chart.tracks[trackName]) continue;
            const perfectBlueTrack = $SaveState.chart.tracks["Perfect_Blue"];
            $SaveState.chart.tracks["Perfect_Blue"] = perfectBlueTrack.concat($SaveState.chart.tracks[trackName]);
        }
        Application.state.timeline.melodii.reloadChart();
    };

    // rows
    // sections
    const propertiesSectionsSelectFirst = () => {
        const model = Application.state.timeline.timeline.getModel();
        if (!model) return;
        const row = model.rows[0];
        if (!row) return;
        const keyframe = row.keyframes[0];
        if (!keyframe) return;
        Application.state.timeline.reactive.selectedKeyframes = [keyframe];
    };
    const propertiesSectionsAddNew = () => {
        Application.state.timeline.melodii.addSectionAtCursor();
    };
    const propertiesSectionsOpenSection = (section) => {
        Application.state.timeline.melodii.applyChartChanges();
        Application.switchTimelineToSection(section);
    };
    // track

    // keyframe
    // section keyframe
    const propertiesSectionKeyframeOpenSection = (keyframe) => {
        if (keyframe._row !== "Sections") throw new Error("Unexpected row name");
        const sections = $SaveState.chart.sections;
        const possibleSections = sections.filter(section => section.name === keyframe.name);
        if (!possibleSections[0]) return;

        const sampleTime = Math.trunc((keyframe.val / 1000) * $SaveState.chart.sampleRate);
        const section = possibleSections.find(section => section.start === sampleTime);
        if (!section) return;
        
        propertiesSectionsOpenSection(section);
    };
    const propertiesSectionKeyframeGetValue = (key, keyframes = []) => {
        const values = keyframes.map(keyframe => keyframe[key]);
        if (values.every(value => value === values[0]))
            return values[0] ?? "";
        return "(mixed)";
    };
    const propertiesSectionKeyframeGetValueNumber = (key, keyframes = []) => {
        const values = keyframes.map(keyframe => keyframe[key]);
        return values[0] ?? 0;
    };
    const propertiesSectionKeyframeSetValue = (value, key, keyframes) => {
        const model = Application.state.timeline.timeline.getModel();
        const resolvedKeyframes = Application.state.timeline.melodii.resolveKeyframes(keyframes, model);

        const newValue = value;
        for (const keyframe of resolvedKeyframes) {
            keyframe[key] = newValue;
        }
        Application.state.timeline.timeline.setModel(model);
        Application.state.timeline.melodii.applyChartChanges();
    };
    const propertiesSectionKeyframeSetEventValue = (event, key, keyframes) => {
        const value = event.type === "blur" ? event.detail.target.value : event.target.value;
        propertiesSectionKeyframeSetValue(value, key, keyframes);
    };
    const propertiesSectionKeyframeGetBPMNumber = (key, keyframes = []) => {
        const values = keyframes.map(keyframe => keyframe[key]);
        const samplesPerBeat = values[0] || 0;
        return ($SaveState.chart.sampleRate * 60) / samplesPerBeat;
    };
    const propertiesSectionKeyframeSetEventBPMValue = (event, key, keyframes) => {
        const bpm = event.type === "blur" ? event.detail.target.value : event.target.value;
        propertiesSectionKeyframeSetValue(Math.trunc(($SaveState.chart.sampleRate * 60) / bpm), key, keyframes);
    };
    // note
</script>

<!-- TODO: The RTL -> LTR hack is causing some buggy UI, especially with Select elements.
Need to just patch the LTR style to allow the drawer to appear on the right of the page. -->
<Drawer class="app-properties" variant={Application.state.appLoaded ? "dismissible" : null} dir="rtl" bind:open={$Settings.propertiesOpen}>
    <Header dir="ltr">
        <Title>Properties</Title>
        <Subtitle>
            <!-- keyframe -->
            {#if sectionKeyframeSelected || noteSelected}
                {sectionKeyframeSelected ? "Section" : "Note"}
                {#if sectionKeyframeSelected || noteSelected}
                    ({Application.state.timeline.reactive.selectedKeyframes.length})
                {/if}
            <!-- rows -->
            {:else if trackSelected}
                Track
            {:else if sectionsSelected}
                Sections
            <!-- no row or keyframe selected -->
            {:else if sectionSelected}
                Section
            {:else}
                Project
            {/if}
        </Subtitle>
    </Header>
    <Content dir="ltr" class="app-properties-content">
        {#if Application.state.appLoaded}
            <!-- keyframe -->
            {#if sectionKeyframeSelected}
                <!-- Section -->
                <!-- Allow editing the section's properties -->
                <Textfield style="width:100%" variant="filled" type="text"
                    value={propertiesSectionKeyframeGetValue("name", Application.state.timeline.reactive.selectedKeyframes)}
                    onkeydown={makeFieldSubmitListener((event) => propertiesSectionKeyframeSetEventValue(event, "name", Application.state.timeline.reactive.selectedKeyframes))}
                    onchange={(event) => propertiesSectionKeyframeSetEventValue(event, "name", Application.state.timeline.reactive.selectedKeyframes)}
                    onblur={(event) => propertiesSectionKeyframeSetEventValue(event, "name", Application.state.timeline.reactive.selectedKeyframes)}
                    label="Name"
                >{#snippet helper()}
                    <HelperText>Custom name for this section.</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number"
                    value={propertiesSectionKeyframeGetBPMNumber("samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes)}
                    onkeydown={makeFieldSubmitListener((event) => propertiesSectionKeyframeSetEventBPMValue(event, "samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes))}
                    onchange={(event) => propertiesSectionKeyframeSetEventBPMValue(event, "samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes)}
                    onblur={(event) => propertiesSectionKeyframeSetEventBPMValue(event, "samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes)}
                    label="BPM"
                >{#snippet helper()}
                    <HelperText>The BPM (beats per minute) for this section onwards.</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number"
                    value={propertiesSectionKeyframeGetValueNumber("beatsPerMeasure", Application.state.timeline.reactive.selectedKeyframes)}
                    onkeydown={makeFieldSubmitListener((event) => propertiesSectionKeyframeSetEventValue(event, "beatsPerMeasure", Application.state.timeline.reactive.selectedKeyframes))}
                    onchange={(event) => propertiesSectionKeyframeSetEventValue(event, "beatsPerMeasure", Application.state.timeline.reactive.selectedKeyframes)}
                    onblur={(event) => propertiesSectionKeyframeSetEventValue(event, "beatsPerMeasure", Application.state.timeline.reactive.selectedKeyframes)}
                    label="Beats per Measure"
                >{#snippet helper()}
                    <HelperText>How many beats are in a measure during this section. All in-game songs use 4 beats per measure.</HelperText>
                {/snippet}</Textfield>
                {#if Application.state.timeline.reactive.selectedKeyframes.length === 1}
                    <Button style="width:100%" touch variant="raised" onclick={() => propertiesSectionKeyframeOpenSection(Application.state.timeline.reactive.selectedKeyframes[0])}>
                        <Label>Open Timeline</Label>
                    </Button>
                {/if}
            {:else if noteSelected}
                <!-- Note -->
                {#if Application.state.timeline.reactive.selectedKeyframes.length === 1}
                    <Title>Payload</Title>
                    <Subtitle>
                        Payloads allow notes to contain extra information.
                        This is needed for some tracks, like VoiceClips and LineStart.
                    </Subtitle>
                    <Select variant="outlined" label="Payload Type">
                        <Option value="text">Text</Option>
                        <Option value="number">Number</Option>
                        <Option value="object">Object</Option>
                    </Select>
                    <p>TODO: Payload editing</p>
                    <!-- TODO: Add payload editor for text -->
                    <!-- TODO: Add payload editor for number -->
                    <!-- TODO: Add payload editor for object using monaco -->
                    <!-- TODO: Add payload editor for VoiceClips using objects -->
                {:else}
                    <!-- NOTE: Might be possible, but only between notes of the same track & type.
                    Or maybe we just fallback to text only in that case. -->
                    <Subtitle>Can only edit the payload of 1 note at a time</Subtitle>
                {/if}
                <hr>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>
                        Delete
                        {#if Application.state.timeline.reactive.selectedKeyframes.length === 1}
                            note
                        {:else}
                            notes
                        {/if}
                    </Label>
                </Button>
            <!-- rows -->
            {:else if trackSelected}
                <!-- Track -->
                <!-- TODO: Add rename field -->
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Move track up</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Move track down</Label>
                </Button>
                <hr>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add note at cursor</Label>
                </Button>
                <hr>
                <Title>Presets</Title>
                <Subtitle>
                    Uses the Beats per Measure of this section to fill this entire track with notes.
                </Subtitle>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Star Beat notes at cursor</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Beat notes at cursor</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Back Beat notes at cursor</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Offbeat notes at cursor</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Off Star Beat notes at cursor</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Off Back Beat notes at cursor</Label>
                </Button>
                <hr>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Clear Track</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Delete Track</Label>
                </Button>
            {:else if sectionsSelected}
                <!-- Sections -->
                <Title>Info</Title>
                <Subtitle>
                    Each section marks a shift in the song.
                    <br>
                    You can change BPM at any section, and also how many
                    beats are in a measure.
                    <br>
                    <br>
                    You can also name each section for organization.
                    <br>
                    <br>
                    The first section is required.
                </Subtitle>
                <Button style="width:100%" touch variant="raised" onclick={propertiesSectionsSelectFirst}>
                    <Label>Select first section</Label>
                </Button>
                <Button style="width:100%" touch variant="raised" onclick={propertiesSectionsAddNew}>
                    <Label>Add new section at cursor</Label>
                </Button>
                <hr>
                <Title>Sections</Title>
                <Subtitle>Click on one of your sections to edit the notes inside.</Subtitle>
                {#each $SaveState.chart.sections as section}
                    <Button style="width:100%" touch variant="raised" onclick={() => propertiesSectionsOpenSection(section)}>
                        <Label>{section.name}</Label>
                    </Button>
                {/each}
            <!-- no row or keyframe selected -->
            {:else if sectionSelected}
                <!-- Section -->
                <!-- We are editing the notes of this section -->
                <Button style="width:100%" touch variant="raised" onclick={() => propertiesSectionExitSection()}>
                    <Label>Exit Timeline</Label>
                </Button>
                <hr>
                <Title>Generation</Title>
                <Subtitle>
                    Generates/fills certain tracks based on the notes placed in other tracks.
                    <br>
                    See the editor guide for more information on how this works.
                </Subtitle>
                <Button style="width:100%" touch variant="raised" onclick={() => propertiesSectionGeneratePerfectBlue()}>
                    <Label>Generate Perfect Blue Track</Label>
                </Button>
                <Button style="width:100%" touch variant="raised" onclick={() => propertiesSectionGeneratePinkWarning()}>
                    <Label>Generate Pink Warning Track</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Generate Next Line Track</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Generate Player Tracks</Label>
                </Button>
                <hr>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Undo Tracks Organization</Label>
                </Button>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Add Default Tracks</Label>
                </Button>
                <hr>
                <Button style="width:100%" touch variant="raised"> <!-- TODO: Add this -->
                    <Label>Delete All Tracks</Label>
                </Button>
            {:else}
                <!-- Project -->
                <Textfield style="width:100%" variant="filled"
                    bind:value={$SaveState.chart.song}
                    label="Audio file"
                >{#snippet helper()}
                    <HelperText>Path to the audio file in your Unity project.</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number"
                    invalid={!MelodiiChart.isValidVersion($SaveState.chart.version)}
                    bind:value={$SaveState.chart.version}
                    label="Chart version"
                >{#snippet helper()}
                    <HelperText>Update this number to reset player high-scores & ranks for this chart.</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number" disabled={true}
                    invalid={!MelodiiChart.isValidSampleRate($SaveState.chart.sampleRate)}
                    bind:value={$SaveState.chart.sampleRate}
                    label="Sample rate"
                ></Textfield>
                <Button style="width:100%" touch variant="raised" onclick={propertiesProjectConvertRate}> <!-- TODO: Add this -->
                    <Label>Convert Sample rate...</Label>
                </Button>
            {/if}
        {/if}
    </Content>
</Drawer>

<style>
    :global(.app-properties-content .mdc-drawer__title),
    :global(.app-properties-content .mdc-drawer__subtitle) {
        padding: 0 8px;
    }
</style>
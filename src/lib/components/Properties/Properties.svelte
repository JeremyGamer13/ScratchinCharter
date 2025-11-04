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
    import HelperText from '@smui/textfield/helper-text';
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import SMUIPrompts from '$lib/resources/smui-prompts';
    import MelodiiChart from "$lib/resources/chart";

    let sectionsSelected = $derived(Application.state.timelineMode === "sections" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedRow === "Sections"
        : false);
    let sectionSelected = $derived(Application.state.timelineMode === "sections" ?
        Application.state.timeline && Application.state.timeline.reactive.selectedKeyframes.length > 0
        : false);

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

    const propertiesSectionGetValue = (key, keyframes = []) => {
        const values = keyframes.map(keyframe => keyframe[key]);
        if (values.every(value => value === values[0]))
            return values[0];
        return "(mixed)";
    };
    const propertiesSectionGetValueNumber = (key, keyframes = []) => {
        const values = keyframes.map(keyframe => keyframe[key]);
        return values[0];
    };
    const propertiesSectionSetValue = (event, key, keyframes) => {
        const model = Application.state.timeline.timeline.getModel();
        const resolvedKeyframes = Application.state.timeline.melodii.resolveKeyframes(keyframes, model);

        const newValue = event.target.value;
        for (const keyframe of resolvedKeyframes) {
            keyframe[key] = newValue;
        }
        Application.state.timeline.timeline.setModel(model);

        Application.state.timeline.melodii.applyChartChanges();
        Application.state.timeline.melodii.reloadChart();
    };
</script>

<Drawer class="app-properties" variant={Application.state.appLoaded ? "dismissible" : null} dir="rtl" bind:open={$Settings.propertiesOpen}>
    <Header dir="ltr">
        <Title>Properties</Title>
        <Subtitle>
            {#if sectionSelected}
                Section ({Application.state.timeline.reactive.selectedKeyframes.length})
            {:else if sectionsSelected}
                Sections
            {:else}
                Project
            {/if}
        </Subtitle>
    </Header>
    <Content dir="ltr">
        {#if Application.state.appLoaded}
            {#if sectionSelected}
                <!-- Section -->
                <Textfield style="width:100%" variant="filled" type="text"
                    value={propertiesSectionGetValue("name", Application.state.timeline.reactive.selectedKeyframes)}
                    oninput={(event) => propertiesSectionSetValue(event, "name", Application.state.timeline.reactive.selectedKeyframes)}
                    label="Name"
                >{#snippet helper()}
                    <HelperText>Custom name for this section.</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number"
                    value={propertiesSectionGetValueNumber("samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes)}
                    oninput={(event) => propertiesSectionSetValue(event, "samplesPerBeat", Application.state.timeline.reactive.selectedKeyframes)}
                    label="samplesPerBeat"
                >{#snippet helper()}
                    <HelperText>samplesPerBeat</HelperText>
                {/snippet}</Textfield>
                <Textfield style="width:100%" variant="filled" type="number"
                    value={propertiesSectionGetValueNumber("beatsPerMeasurement", Application.state.timeline.reactive.selectedKeyframes)}
                    oninput={(event) => propertiesSectionSetValue(event, "beatsPerMeasurement", Application.state.timeline.reactive.selectedKeyframes)}
                    label="beatsPerMeasurement"
                >{#snippet helper()}
                    <HelperText>beatsPerMeasurement</HelperText>
                {/snippet}</Textfield>
            {:else if sectionsSelected}
                <!-- Sections -->
                <p>
                    Each section marks a shift in the song.
                    <br>
                    You can change BPM at any section, and also how many
                    beats are in a measurement.
                    <br>
                    <br>
                    You can also name each section for organization.
                    <br>
                    <br>
                    The first section is required.
                </p>
                <hr>
                <Button style="width:100%" touch variant="raised" onclick={propertiesSectionsSelectFirst}>
                    <Label>Select first section</Label>
                </Button>
                <hr>
                <Button style="width:100%" touch variant="raised" onclick={propertiesSectionsAddNew}>
                    <Label>Add new section at cursor</Label>
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
                <Button style="width:100%" touch variant="raised" onclick={propertiesProjectConvertRate}>
                    <Label>Convert Sample rate...</Label>
                </Button>
            {/if}
        {/if}
    </Content>
</Drawer>
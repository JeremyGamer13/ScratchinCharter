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
    import HelperText from '@smui/textfield/helper-text';
    
    import Application from "$lib/resources/app.svelte";
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import MelodiiChart from "$lib/resources/chart";
</script>

<Drawer class="app-properties" variant={Application.state.appLoaded ? "dismissible" : null} dir="rtl" bind:open={$Settings.propertiesOpen}>
    <Header dir="ltr">
        <Title>Properties</Title>
        <Subtitle>Project</Subtitle>
    </Header>
    <Content dir="ltr">
        {#if Application.state.appLoaded}
            <Textfield style="width:100%" variant="filled"
                bind:value={$SaveState.chart.song}
                label="Audio file"
            >{#snippet helper()}
                <HelperText>Path to the audio file in your Unity project.</HelperText>
            {/snippet}</Textfield>
            <Textfield style="width:100%" variant="filled" type="number"
                invalid={!MelodiiChart.isValidSampleRate($SaveState.chart.sampleRate)}
                bind:value={$SaveState.chart.sampleRate}
                label="Sample rate"
            >{#snippet helper()}
                <HelperText>Sample rate of your song file.</HelperText>
            {/snippet}</Textfield>
            <Textfield style="width:100%" variant="filled" type="number"
                invalid={!MelodiiChart.isValidVersion($SaveState.chart.version)}
                bind:value={$SaveState.chart.version}
                label="Chart version"
            >{#snippet helper()}
                <HelperText>Update this number to reset player high-scores & ranks for this chart.</HelperText>
            {/snippet}</Textfield>
        {/if}
    </Content>
</Drawer>
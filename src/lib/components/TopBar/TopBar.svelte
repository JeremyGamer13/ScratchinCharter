<script>
    import TopAppBar, {
        Row,
        Section,
        Title,
        AutoAdjust,
    } from '@smui/top-app-bar';
    import IconButton from '@smui/icon-button';
    
    import Application from '$lib/resources/app.svelte';
    import Settings from "$lib/stores/settings";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    
    // Components
    import MenuFile from "$lib/components/TopBar/MenuFile.svelte";
    import MenuEdit from "$lib/components/TopBar/MenuEdit.svelte";
    import MenuHelp from "$lib/components/TopBar/MenuHelp.svelte";

    let appTopBar = $state(null);
    $effect(() => {
        Application.state.appTopBar = appTopBar;
    });
</script>

<TopAppBar bind:this={appTopBar} variant="standard" dense>
    <Row>
        <Section>
            <MenuFile {appTopBar}></MenuFile>
            <MenuEdit {appTopBar}></MenuEdit>
            <MenuHelp {appTopBar}></MenuHelp>
        </Section>
        <Section align="end">
            <IconButton class="material-icons" onclick={() => { $Settings.propertiesOpen = !$Settings.propertiesOpen }}>menu</IconButton>
        </Section>
    </Row>
</TopAppBar>
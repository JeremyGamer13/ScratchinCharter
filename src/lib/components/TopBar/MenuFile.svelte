<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import Menu from '@smui/menu';
    import List, { Item, Separator, Text } from '@smui/list';
    import Button, { Label } from '@smui/button';
    
    import Application from "$lib/resources/app.svelte";
    import SaveState from "$lib/stores/state";
    import SaveStateLarge from "$lib/stores/state-large";
    import SMUIPrompts from "$lib/resources/smui-prompts";
    import MelodiiChart from "$lib/resources/chart";
    
    let props = $props();
    let appTopBar = $derived(props.appTopBar);

    let menu = null;

    const projectNew = async () => {
        const doLoad = await SMUIPrompts.confirm("Are you sure you want to make/load a new project?"
            + "\n" + "All of your unsaved work will be lost!");
        if (!doLoad) return;

        $SaveState.newProject = true;
        $SaveState.chart = MelodiiChart.defaultChart();
        Application.validateChart();
        location.reload();
    };
    const projectOpen = async () => {};
    const projectSave = async () => {};
    const projectSaveFile = async () => {};

    const songImport = async () => {
        const fileData = await Application.askForSongBlob();
        await Application.importSongFromBlob(fileData);
    };

    const chartImport = async () => {
        const jsonStr = await Application.askForChartString();
        await Application.importChartFromString(jsonStr);
        Application.loadChartIntoTimeline();
    };
    const chartExport = async () => {
        const fileHandle = await window.showSaveFilePicker({
            id: "scratchin-charting-chartexport",
            suggestedName: "chart.json",
            types: [{
                description: "Melodii Chart",
                accept: {"application/json": [".json"]}
            }]
        });
        // prepare to export
        Application.saveCurrentChartTimeline();
        Application.validateChart();
        const chartObject = $state.snapshot($SaveState.chart);
        const chartJson = JSON.stringify(chartObject);
        // exporting
        const writable = await fileHandle.createWritable();
        await writable.write(chartJson);
        await writable.close();
    };

    const importMenu = async () => {};

    const exportMenu = async () => {};
</script>

<Button onclick={() => menu.setOpen(true)}>
    <Label>File</Label>
</Button>
<Menu bind:this={menu}>
    <List>
        <Item onSMUIAction={projectNew}>
            <Text>New project...</Text>
        </Item>
        <Item onSMUIAction={projectOpen}>
            <Text>Open project...</Text>
        </Item>
        <Item onSMUIAction={projectSave}>
            <Text>Save project to browser</Text>
        </Item>
        <Item onSMUIAction={projectSaveFile}>
            <Text>Save project to file...</Text>
        </Item>
        <Separator />
        <Item onSMUIAction={importMenu}>
            <Text>Import...</Text>
        </Item>
        <Item onSMUIAction={exportMenu}>
            <Text>Export...</Text>
        </Item>
    </List>
</Menu>
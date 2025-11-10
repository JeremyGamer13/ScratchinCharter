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
</script>

<Button onclick={() => menu.setOpen(true)}>
    <Label>File</Label>
</Button>
<Menu bind:this={menu}>
    <List>
        <Item onSMUIAction={projectNew}>
            <Text>New project...</Text>
        </Item>
        <Separator />
        <Item onSMUIAction={chartImport}>
            <Text>Import Chart (.json)</Text>
        </Item>
        <Item onSMUIAction={songImport}>
            <Text>Import Song (audio)</Text>
        </Item>
        <Item onSMUIAction={() => {}}>
            <Text>Import Voices (folder with audio)</Text>
        </Item>
        <Separator />
        <Item onSMUIAction={chartExport}>
            <Text>Export Chart (.json)</Text>
        </Item>
    </List>
</Menu>
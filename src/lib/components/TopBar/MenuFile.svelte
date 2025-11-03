<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import Menu from '@smui/menu';
    import List, { Item, Separator, Text } from '@smui/list';
    import Button, { Label } from '@smui/button';
    
    import Application from "$lib/resources/app.svelte";
    
    let props = $props();
    let appTopBar = $derived(props.appTopBar);

    let menu = null;

    const songImport = async () => {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-songimport",
            multiple: false,
            types: [{
                description: "Audio files",
                accept: {"audio/*": [".mp3", ".ogg", ".flac", ".wav"]}
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        await Application.importSongFromBlob(fileData);
    };

    const chartImport = async () => {
        const [fileHandle] = await window.showOpenFilePicker({
            id: "scratchin-charting-chartimport",
            multiple: false,
            types: [{
                description: "Melodii Chart",
                accept: {"application/json": [".json"]}
            }]
        });
        if (!fileHandle) return;
        const fileData = await fileHandle.getFile();
        const decoder = new TextDecoder("utf-8");
        const jsonStr = decoder.decode(await fileData.arrayBuffer());
        await Application.importChartFromString(jsonStr);
    };
    const chartExport = async () => {
        const fileHandle = await window.showSaveFilePicker({
            id: "scratchin-charting-chartexport",
            suggestedName: "sumidk.json",
            types: [{
                description: "Melodii Chart",
                accept: {"application/json": [".json"]}
            }]
        });
        const writable = await fileHandle.createWritable();
        // TODO: actually export charts
        await writable.write("Wouldnt it be nice to have a chart here?");
        await writable.close();
    };
</script>

<Button onclick={() => menu.setOpen(true)}>
    <Label>File</Label>
</Button>
<Menu bind:this={menu}>
    <List>
        <Item onSMUIAction={chartImport}>
            <Text>Import Chart (.json)</Text>
        </Item>
        <Item onSMUIAction={songImport}>
            <Text>Import Song (audio)</Text>
        </Item>
        <Item onSMUIAction={() => {}}>
            <Text>Import Voices (folder with audio)</Text>
        </Item>
        <Item onSMUIAction={chartExport}>
            <Text>Export Chart (.json)</Text>
        </Item>
    </List>
</Menu>
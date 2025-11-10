<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import Menu from '@smui/menu';
    import List, { Item, Separator, Text } from '@smui/list';
    import Button, { Label } from '@smui/button';
    
    import Application from "$lib/resources/app.svelte";
    import SMUIPrompts from "$lib/resources/smui-prompts";
    import MelodiiChart from "$lib/resources/chart";
    
    let props = $props();
    let appTopBar = $derived(props.appTopBar);

    let menu = null;

    const preferences = () => {

    };
    const resetChart = async () => {
        const areYouSure = await SMUIPrompts.confirm("Are you sure you want to reset the entire chart? All of the chart information will be deleted!");
        if (!areYouSure) return;

        await Application.importChartFromObject(MelodiiChart.defaultChart());
        Application.loadChartIntoTimeline();
    };
</script>

<Button onclick={() => menu.setOpen(true)}>
    <Label>Edit</Label>
</Button>
<Menu bind:this={menu}>
    <List>
        <Item onSMUIAction={preferences}>
            <Text>Preferences...</Text>
        </Item>
        <Separator />
        <Item onSMUIAction={resetChart}>
            <Text>Reset chart</Text>
        </Item>
    </List>
</Menu>
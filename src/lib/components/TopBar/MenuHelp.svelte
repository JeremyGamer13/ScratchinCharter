<script>
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    
    import Menu from '@smui/menu';
    import List, { Item, Separator, Text } from '@smui/list';
    import Button, { Label } from '@smui/button';
    
    import Application from "$lib/resources/app.svelte";
    import SMUIPrompts from "$lib/resources/smui-prompts";
    
    let props = $props();
    let appTopBar = $derived(props.appTopBar);

    let menu = null;

    const credits = () => {
        const text = ``
            + `JeremyGamer13 - Code, Charting Mod`
            + `\n` + `hperrin - svelte-material-ui`
            + `\n` + `katspaugh - wavesurfer.js`
            + `\n` + `ievgennaida - animation-timeline-control`
            + `\n` + `localForage - localForage`
            + `\n` + `Microsoft - Monaco`
            + `\n` + `pngwn - MDsveX`
            + `\n` + `Made in Svelte v5, hosted on GitHub Pages`
            + `\n`
            + `\n` + `Not affiliated with Scratchin' Melodii or LJ LephemStar.`;
        SMUIPrompts.buildAndAwaitResult({
            title: "Scratchin' Charter",
            content: text
        });
    };
</script>

<Button onclick={() => menu.setOpen(true)}>
    <Label>Help</Label>
</Button>
<Menu bind:this={menu}>
    <List>
        <a href="https://github.com/JeremyGamer13/ScratchinCharter/issues" target="_blank">
            <Item>
                <Text>Report an issue...</Text>
            </Item>
        </a>
        <a href="https://github.com/JeremyGamer13/ScratchinCharter" target="_blank">
            <Item>
                <Text>GitHub...</Text>
            </Item>
        </a>
        <Separator />
        <Item onSMUIAction={credits}>
            <Text>Credits</Text>
        </Item>
    </List>
</Menu>
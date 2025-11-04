<script>
    import { browser } from "$app/environment";
    
    import Dialog, { Title, Header, Content, Actions } from '@smui/dialog';
    import IconButton from '@smui/icon-button';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import Button, { Label } from '@smui/button';

    import SMUIPrompts from "$lib/resources/smui-prompts";

	let { children } = $props();

    const dialogs = $state([]);
    let dialogsUpdateId = 0;
    const dialogsNeedToProcess = [];
    const dialogBuildAndAwaitResult = (content) => {
        const id = `dialog${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
        const dialog = $state({ ...content, id, open: true, result: null });

        // set result before creation if we have a field
        if (content.field && content.field.value) {
            dialog.result = content.field.value;
        }

        // onsubmit should be called by a button in the dialog with the dialog's return value.
        dialogsUpdateId += 1;
        const myDialogsUpdateId = dialogsUpdateId;
        return new Promise((resolve) => {
            dialog.onsubmit = (value) => {
                dialog.result = value;
                dialog.open = false;
                resolve(value);

                // Want to keep dialog animation so the dialog stays alive for 3 seconds and
                // then gets deleted from the dialog list.
                // However, we can't modify the array when another dialog is open or itll cause
                // animations to replay. This is why myDialogsUpdateId is used, since eventually
                // the last modal will close with myDialogsUpdateId matching dialogsUpdateId and
                // this timeout will run, then every dialog can be deleted.
                const processDelete = () => {
                    const idx = dialogs.findIndex(d => d.id === id);
                    if (idx === -1) return;
                    dialogs.splice(idx, 1);
                };
                // Process queued dialogs (see below & above)
                const processAllFunctions = () => {
                    processDelete();
                    for (const process of dialogsNeedToProcess) {
                        process();
                    }
                    dialogsNeedToProcess.splice(0, dialogsNeedToProcess.length);
                };
                // Queue up this dialog if it cant be deleted this time around.
                setTimeout(() => {
                    if (myDialogsUpdateId !== dialogsUpdateId) return dialogsNeedToProcess.push(processDelete);
                    processAllFunctions();
                }, 1000);
            };
            // push to be rendered
            dialogs.push(dialog);
        });
    };
    SMUIPrompts.buildAndAwaitResult = dialogBuildAndAwaitResult.bind(SMUIPrompts);

    const alert = async (text) => {
        await dialogBuildAndAwaitResult({
            title: "Alert",
            content: text,
        });
    };
    const confirm = async (text) => {
        return !!(await dialogBuildAndAwaitResult({
            title: "Confirm",
            content: text,
            actions: [{ label: "OK", value: true, action: "accept" }, { label: "Cancel", value: false }]
        }));
    };
    const prompt = async (text, defaultValue) => {
        return (await dialogBuildAndAwaitResult({
            title: "Prompt",
            content: text,
            field: { type: "Textfield", value: defaultValue || "", label: "Input" },
            actions: [{ label: "OK", action: "accept" }, { label: "Cancel", value: "" }]
        })) || "";
    };
    SMUIPrompts.alert = alert.bind(SMUIPrompts);
    SMUIPrompts.confirm = confirm.bind(SMUIPrompts);
    SMUIPrompts.prompt = prompt.bind(SMUIPrompts);

    if (browser) {
        window.SMUIPrompts = SMUIPrompts;
    }
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{#each dialogs as dialog}
    <Dialog
        bind:open={dialog.open}
        sheet
        onSMUIDialogClosing={() => dialog.onsubmit()}
        aria-labelledby={`${dialog.id}title`}
        aria-describedby={`${dialog.id}content`}
    >
        <Header>
            <Title id={`${dialog.id}title`}>{dialog.title}</Title >
            <IconButton action="close" class="material-icons" onclick={() => dialog.onsubmit()}>close</IconButton>
        </Header>
        <Content id={`${dialog.id}content`}>
            {#if dialog.content}
                <p style="white-space: pre-wrap;">{dialog.content}</p>
            {/if}
            {#if dialog.field}
                {#if dialog.field.type === "Textfield"}
                    <Textfield variant="outlined" bind:value={dialog.result} label={dialog.field.label}>
                        {#if dialog.field.helper}
                            <HelperText>{dialog.field.helper}</HelperText>
                        {/if}
                    </Textfield>
                {/if}
            {/if}
        </Content>
        {#if dialog.actions}
            <Actions>
                {#each dialog.actions as action}
                    <Button {...action} onclick={() => dialog.onsubmit(action.value ?? dialog.result)}>
                        <Label>{action.label || "Button"}</Label>
                    </Button>
                {/each}
            </Actions>
        {/if}
    </Dialog>
{/each}
<main>
    {@render children()}
</main>

<style>
    main {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        min-width: 750px;
        margin: 0;
        padding: 0;
        
        font-family: Helvetica, Arial, sans-serif;
        overflow: hidden;
    }
</style>
<script>
    import loader from '@monaco-editor/loader';
	import { onDestroy, onMount } from 'svelte';

    import MonacoState from "$lib/state/monaco.svelte.js";

    let props = $props();
    let container = null;

    const id = props.id ?? `monaco${Date.now()}${Math.random()}${Math.random()}${Math.random()}${Math.random()}`;
    const instance = { id, created: false };
    let monaco;
    let editor;
    const createEditor = async () => {
        monaco = await loader.init();
        editor = monaco.editor.create(container, {
            value: props.defaultCode,
            language: props.lang,
            overviewRulerBorder: true,
            theme: "vs-dark"
        });
        instance.monaco = monaco;
        instance.editor = editor;
        instance.container = container;
        instance.created = true;
        return instance;
    };

    onMount(async () => {
        if (instance.created) return;
        await createEditor();
        MonacoState.editors[instance.id] = instance;

        if (props.onload) props.onload(instance);
    });
    onDestroy(async () => {
        monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
    });
</script>

<div style="width: 100%;height: 100%;" {...{
    ...props,
    defaultCode: "",
    onload: null,
}} bind:this={container}></div>

<script>
    import Monaco from "$lib/components/Monaco.svelte";
    import MonacoState from "$lib/state/monaco.svelte.js";

    const onLoad = (monacoInstance) => {
        window.MonacoSvelte = monacoInstance;
        window.MonacoState = MonacoState;
    };
</script>

<Monaco
    id="monaco-test"
    defaultCode={"{\"test\":\"this is what monaco will be used for later\"}"}
    lang="json"

    onload={onLoad}
></Monaco>
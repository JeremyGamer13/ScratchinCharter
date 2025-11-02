<script>
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<main>
    {@render children()}
</main>

<style>
    main {
        position: absolute;
        left: 0;
        top: 0;
        margin: 0;
        padding: 0;

        width: 100%;
        height: 100%;
    }
</style>
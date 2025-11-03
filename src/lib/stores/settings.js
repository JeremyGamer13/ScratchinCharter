import { writable } from 'svelte/store';
import { browser } from "$app/environment";
import localforage from 'localforage';

const defaultSettings = {
    loaded: false,
    volume: 0.5,
};

const settings = writable(defaultSettings);
if (browser) {
    localforage.getItem('scratchincharting:settings').then((saved) => {
        settings.set({
            ...defaultSettings,
            ...(saved ?? {}),
            loaded: true,
        });
        window.dispatchEvent(new CustomEvent("scratchincharting-loaded-settings"));
    });
    settings.subscribe((value) => {
        localforage.setItem('scratchincharting:settings', value);
    });
}

export default settings;
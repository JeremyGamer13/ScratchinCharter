import { writable } from 'svelte/store';
import { browser } from "$app/environment";
import localforage from 'localforage';

const defaultStateLarge = {
    loaded: false,
    song: null,
};

const stateLarge = writable(defaultStateLarge);
if (browser) {
    localforage.getItem('scratchincharting:state-large').then((saved) => {
        stateLarge.set({
            ...defaultStateLarge,
            ...(saved ?? {}),
            loaded: true,
        });
        window.dispatchEvent(new CustomEvent("scratchincharting-loaded-state-large"));
    });
    stateLarge.subscribe((value) => {
        localforage.setItem('scratchincharting:state-large', value);
    });
}

export default stateLarge;
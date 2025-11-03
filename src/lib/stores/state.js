import { writable } from 'svelte/store';
import { browser } from "$app/environment";
import localforage from 'localforage';

const defaultState = {
    loaded: false,
    chart: null,
};

const state = writable(defaultState);
if (browser) {
    localforage.getItem('scratchincharting:state').then((saved) => {
        state.set({
            ...defaultState,
            ...(saved ?? {}),
            loaded: true,
        });
        window.dispatchEvent(new CustomEvent("scratchincharting-loaded-state"));
    });
    state.subscribe((value) => {
        localforage.setItem('scratchincharting:state', value);
    });
}

export default state;
import * as stores from 'svelte/store';

const updateStore = (store, callback) => {
    const state = stores.get(store);
    callback(state);
    store.set(state);
};

export default updateStore;
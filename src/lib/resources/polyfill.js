const registerPolyfill = async () => {
    // TODO: polyfill structuredClone and show save file picker / show open file picker
};
const isBrowserSupported = () => {
    return "structuredClone" in window
        && "showDirectoryPicker" in window
        && "showOpenFilePicker" in window
        && "showSaveFilePicker" in window
        ;
};

export default {
    registerPolyfill,
    isBrowserSupported
};
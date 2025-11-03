let library = null;

/** @returns {Promise<import("animation-timeline-js")>} */
const getLibrary = async () => {
    if (library) return library;
    library = await import("animation-timeline-js");
    return library;
};

export default getLibrary;
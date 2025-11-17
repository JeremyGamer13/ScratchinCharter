/**
 * Takes in an event and checks whether to run the submit callback or not.
 * Meant to be used with `onkeydown`.
 * @param {UIEvent} event The event to check.
 * @param {function(UIEvent):void} onSubmit The callback to run with the event, if we should submit.
 */
const tryFieldSubmit = (event, onSubmit) => {
    switch (event.type) {
        case "keydown":
            if (event.key === "Enter") return onSubmit(event);
            break;
    }
};

/**
 * Makes a callback to be used as an event listener.
 * Meant to be used with `onkeydown`.
 * @param {function(UIEvent):void} onSubmit The callback to run with the event, if we should submit.
 * @returns {function(UIEvent):void} The event listener callback.
 */
const makeFieldSubmitListener = (onSubmit) => {
    return (event) => tryFieldSubmit(event, onSubmit);
};

export {
    tryFieldSubmit,

    makeFieldSubmitListener,
};
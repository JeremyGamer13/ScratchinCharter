class SMUIPrompts {
    // All of these functions are to be overridden
    static async alert(text) {
        return await alert(text);
    }
    static async confirm(text) {
        return await confirm(text);
    }
    static async prompt(text, defaultText) {
        return await prompt(text, defaultText);
    }

    static async buildAndAwaitResult(content) {
        return await alert("Not implemented");
    }
}

export default SMUIPrompts;
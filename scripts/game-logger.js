class gameLogger {
    // Private
    #console = null;

    // Constructor
    constructor(outputLocation) {
        this.#console = outputLocation;
    }

    log(message) {
        if (this.#console && (message.length > 0)) {
            // Add the message to the console
            let para = $("<div width='100%'>");
            para.text(message);

            this.#console.prepend(para);
            
            // After 10 seconds, fade it out.
            setTimeout(function() { 
                para.fadeOut(3000);
            }, 10000);
        }
    }
}
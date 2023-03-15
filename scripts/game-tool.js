// These will be objects that can interact with each other or other game objects
class gameTool {
    draggable = true;
    image = new Image();

    constructor(imgSrc, draggable) {
        this.image.src = imgSrc;
        this.draggable = draggable;
    }
    

    // What can this object do?

    // Interacts with an other object
    onDragOverAnotherObject(obj) {
        if (obj instanceof Pet) {
            obj.__toolDraggedOver(this);
        }
    }
}
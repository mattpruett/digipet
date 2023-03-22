const gameToolType = {
    feed: 1
};

// These will be objects that can interact with each other or other game objects
class gameTool {
    draggable = true;
    image = new Image();
    type;
    x = 0;
    y = 0;
    width = 30;
    height = 30;

    constructor(imgSrc, draggable, type, x, y, width, height) {
        if (imgSrc) {
            this.image.src = imgSrc;
        }
        this.draggable = draggable;
        this.type = type;

        this.x      = x         ? x         : this.x;
        this.y      = y         ? y         : this.y;
        this.width  = width     ? width     : this.width;
        this.y      = height    ? height    : this.height;
    }
    

    // What can this object do?
    draw(context) {
        
        context.drawImage(this.image,
            this.x - (this.width / 2),
            this.y - (this.height / 2),
            this.width,
            this.height);

    }

    // Interacts with an other object.
    // TODO: Make use of this.
    onDragOverAnotherObject(obj) {
        if (obj instanceof Pet) {
            obj.__toolDraggedOver(this);
        }
    }

    // Static methods
    static createFromAndApplyToButton(button, draggable, type) {
        button.tool = this.createFromButton(button, draggable, type);
    }

    static createFromButton(button, draggable, type) {
        return button instanceof gameToolBarButton
            ? new gameTool(button.image.src, valueIsUndefined(draggable) ? false : draggable, type, button.x, button.y, button.width, button.height)
            : null;
    }
}
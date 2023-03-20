function valueIsUndefined(value) {
    return typeof value === "undefined";
}

function isUndefined(value) {
    return valueIsUndefined(value);
}

function pointInRect(point, rect) {
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;

    // Past the left.
    return point.x > rect.left 
        // Below the top.
        && point.y > rect.top 
        // Not beyond the right.
        && point.x < right 
        // And not past the bottom.
        && point.y < bottom;
}

function mouseToCanvasPosition(canvas, mouseX, mouseY) {
    var offset = $(canvas).offset();
    
    return {
        x: parseInt(mouseX - offset.left),
        y: parseInt(mouseY - offset.top)
    }
}
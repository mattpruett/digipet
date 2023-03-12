const direction = {
    left: 0,
    right: 1,
    up: 2,
    down: 3
}

const petType = {
    cat: "Cat"
}

const petState = {
    idling: 0,
    walking: 1,
    eyeShift: 2
}

// Keep this in order on what you want to check.
const stateChangeTable = [    
    { state: petState.idling, chance: 40, directions: [ direction.left, direction.right ] },
    { state: petState.eyeShift, chance: 10, directions: [ direction.left ] },
    { state: petState.walking, chance: 1, directions: [ direction.left, direction.right ] }
]

class Need {
    // private

    // private properties
    #min = 0;
    #max = 5;
    #explosionChance = 0;
    #baseExplosionChance = 0;
    #explosionStep = 0;
    #implosionChance = 0;
    #baseImplosionChance = 0;
    #implosionStep = 0;

    // public
    emptyOnExplosion = false;
    fillOnImplosion = false;

    // public events
    onChangeEvent = null;
    onFullEvent = null;
    onExplosionEvent = null;
    onEmptyEvent = null;
    onImplosionEvent = null;

    // public properties
    value = 0;

    constructor(value, min, max, explosionChance, explosionStep, implosionChance, implosionStep) {
        this.value = isUndefined(value) ? this.value : value;

        // Protect against a max being less than the min
        this.#min = isUndefined(min) || (min >= max) ? this.#min : min;
        this.#max = isUndefined(max) || (max <= min) ? this.#max : max;

        this.#explosionChance = isUndefined(explosionChance) ? this.#explosionChance : explosionChance;
        this.#baseExplosionChance = this.#explosionChance;

        this.#implosionChance = isUndefined(implosionChance) ? this.#implosionChance : implosionChance;
        this.#baseImplosionChance = this.#implosionChance;

        this.#explosionStep = isUndefined(explosionStep) ? this.#explosionStep : explosionStep;
        this.#implosionStep = isUndefined(implosionStep) ? this.#implosionStep : implosionStep;
    }

    // Reset back to the minimum.
    empty() {
        this.value = this.#min;

        this.#__onChange();
    }

    // Add the given value to our current value
    fill (value) {
        this.setValue(value + this.value);
    }

    // Call fill to add 1 to the value.
    inc() {
        this.fill(1); 
    }

    // Call fill to subtract one from the value.
    dec() {
        this.fill(-1);
    }

    isFull() {
        // If max is 0, then let us not assume we are full.
        return (this.value == this.#max) && (this.#max > 0);
    }

    isEmpty() {
        return this.value == this.#min;
    }

    setValue (val) {
        // Save the previous value for calling any events.
        let previousValue = this.value;

        // if it is less than min or greather than max then use min or max respectively.
        let newValue = Math.min(Math.max(val, this.#min), this.#max);

        // No need to do anything if the value hasn't actually changed.
        if (previousValue !== newValue) {
            this.value = newValue;
           
            // Handle any value changing events.
            this.#__onChange({
                previousValue: previousValue,
                currentValue: this.value,
                maxValue: this.#max,
                minValue: this.#min
            });
        }
    }

    // We can create a common function that both #__onFull and #__onEmpty can call.
    #__onThresholdReached(e, chance, baseEventChance, eventStep, thresholdReachedEvent, specialEvent, empty, fill) {
        if (thresholdReachedEvent) {
            // Call the event to let the implementor handle it
            thresholdReachedEvent(e);
        }

        if (specialEvent) { 
            // Check to see if we should do something.
            if (percentile(chance)) {
                // It looks like the threshold event was fired.
                // Call the event to let the implementor handle it.
                specialEvent(e);

                if (empty) {
                    this.currentValue = this.#min;
                }

                if (fill) {
                    this.currentValue = this.#max;
                }

                // Reset it now that we have performed the event
                return baseEventChance;
            }
            else {
                // We didn't perform the event, so let's increase the chance for next time.
                return chance + eventStep;
            }
        }

        return chance;
    }

    #__onFull (e) {
        this.#explosionChance = this.#__onThresholdReached(e,
            this.#explosionChance,
            this.#baseExplosionChance,
            this.#explosionStep,
            this.onFullEvent,
            this.onExplosionEvent,
            this.emptyOnExplosion,
            false);
    }

    #__onEmpty (e) {
        this.#implosionChance = this.#__onThresholdReached(e,
            this.#implosionChance,
            this.#baseImplosionChance,
            this.#implosionStep,
            this.onEmptyEvent,
            this.onImplosionEvent,
            false,
            this.fillOnImplosion);
    }

    #__onChange(e) {
        if (this.onChangeEvent) {
            this.onChangeEvent(e);
        }

        if (this.isFull()) {
            this.#__onFull(e);
        }

        if (this.isEmpty()) {
            this.#__onEmpty(e);
        }
    }

    toString() {
        return `${this.value}/${this.#max}`;
    }
}

class Pet {
    type;
    name;
    age = 0;
    nickName;
    health = null;
    hunger = null;
    happiness = null;
    bowels = null;
    outputLocation = null;
    sprite = null;
    state = petState.walking;

    #location = { x: 0, y: 0 };
    #totalTicks = 0;
    #currentDirection = direction.right;

    constructor(outputLocation, animalType, healthThreashold, hungerThreashold, happinessThreashold, bowelsThreashold) {
        // This is a bit of a hack to work around the fact that "this" clashes when calling events.
        // I don't like it, but it's a simple solution.
        // Perhaps I can implement a better one in the future.
        let pet = this;

        this.health = new Need(10, 0, valueIsUndefined(healthThreashold) ? 10 : healthThreashold, 0, 0, 100);
        this.health.onEmptyEvent = function (e) { pet.onPetEmptyHealth(e); };
        this.health.onFullEvent = function (e) { pet.onPetFullHealth(e); };

        this.hunger = new Need(0, 0, valueIsUndefined(hungerThreashold) ? 5 : hungerThreashold, 20, 10);
        this.hunger.onEmptyEvent = function (e) { pet.onPetEmptyHunger(e); };
        this.hunger.onFullEvent = function (e) { pet.onPetFullHunger(e); };
        this.hunger.onChangeEvent = function (e) { pet.onPetChangeHunger(e); };
        this.hunger.onExplosionEvent = function (e) { pet.onHaveToPuke(e); };

        this.happiness = new Need(5, 0, valueIsUndefined(happinessThreashold) ? 10 : happinessThreashold, 30, 10, 30, 10);
        this.happiness.onEmptyEvent = function (e) { pet.onPetEmptyHappiness(e); };
        this.happiness.onFullEvent = function (e) { pet.onPetFullHappiness(e); };

        this.bowels = new Need(0, 0, valueIsUndefined(bowelsThreashold) ? 5 : bowelsThreashold, 100, 0);
        this.bowels.onEmptyEvent = function (e) { pet.onPetEmptyBowels(e); };
        this.bowels.onFullEvent = function (e) { pet.onPetFullBowels(e); };

        this.outputLocation = outputLocation;

        this.type = animalType;
        if (this.type === petType.cat) {
            this.sprite = sprite.cat();
        }
    }

    feed() {
        this.hunger.dec();
    }

    // Event implimentations
    // Health
    onPetEmptyHealth(e) {
        this.die();
    }

    onPetFullHealth(e) {
        this.do(`${this.name} is in perfect health.`);
        this.dance();
    }

    // Hunger
    onPetEmptyHunger(e) {
        this.do(`${this.name} couldn't possibly eat another bite.`);
    }

    onPetFullHunger(e) {
        this.do(`${this.name} is starving.`);
        this.cry()
    }

    // Not sure I like the name of this, but I really do like consistency
    onPetChangeHunger(e) {
        // Special things happen when we are full or empty so we'll handle it there.
        let fullOrEmpty = (e.currentValue <= e.minValue) || (e.currentValue >=e.maxValue);
        // If the hunger increased.
        if (!fullOrEmpty) {
            let happinessChance = Math.floor((e.currentValue/e.maxValue) * 100);
            if (e.previousValue < e.currentValue) {
                // Give it a chance to decrease happiness.
                if (percentile(happinessChance)) {
                    this.happiness.dec();
                }
            }
            // If hunger decrease.
            else if (e.previousValue > e.currentValue) {
                // Give it a chance to increase happiness.
                if (percentile(happinessChance)) {
                    this.happiness.inc();
                }

                // give it a chance to increase your bowels
                let poopChance = 10;
                if (percentile(poopChance)) {
                    this.bowels.inc();
                }
            }
        }
    }

    onHaveToPuke(e) {
        this.do(`${this.name} puked. Gross`);
    }

    // Happiness
    onPetEmptyHappiness(e) {
        this.do(`${this.name} is very upset.`);
        this.cry();
    }

    onPetFullHappiness(e) {
        this.do(`${this.name} is bursting with happines!`);
        this.dance();
    }

    // Bowels
    onPetEmptyBowels(e) {
        this.do(`${this.name} Feels much better.`);
        this.cheer();
    }

    onPetFullBowels(e) {
        this.do(`${this.name} pooped. Yuck!`);
        this.bowels.empty();
    }

    draw(context) {
        // TODO: calculate what to draw here based on pet's logic
        this.drawState(context);
    }

    // pet actions
    cheer() {
        this.do(`${this.name} cheers! Hurray!`);
    }

    dance() {
        this.do(`${this.name} dances a happy little dance`);
    }

    die() {
        this.do(`${this.name} died! RIP`);
    }

    cry() {
        this.do(`${this.name} cries! Boohoo.`);
    }

    idle(context) {
        let pos = this.#getCurrentPosition();
        
        this.sprite.idle(context, pos.x, pos.y);
    }

    eyeShift(context) {
        let pos = this.#getCurrentPosition();
        
        this.sprite.eyeShift(context, pos.x, pos.y);
    }

    move(context, where) {
        let pos = this.#getCurrentPosition();
        let walkResults = this.sprite.walk(where, context, pos.x, pos.y);

        this.#setCurrentPosition(walkResults);

        // If we hit the side of the screen, switch to idling.
        if (walkResults.switchState) {
            this.state = petState.idling;
        }
    }

    drawState(context) {
        this.#checkForStateChange();
        switch (this.state) {
            case petState.idling:
                this.idle(context);
                break;
            case petState.walking:
                this.move(context, this.#currentDirection);
                break;
            case petState.eyeShift:
                this.eyeShift(context, this.#currentDirection);
                break;
        }
    }

    getStatsAsHtml() {
        let table = $("<table>");

        table.append("<tr><th>Name</th><th>Health</th><th>Hunger</th><th>Happiness</th><th>Bowels</th></tr>");
        
        let row = $("<tr></tr>");
        // name
        row.append(`<td>${this.name}</td>`);
        // health
        row.append(`<td>${this.health}</td>`);
        // hunger
        row.append(`<td>${this.hunger}</td>`);
        // happiness
        row.append(`<td>${this.happiness}</td>`);
        // bowels
        row.append(`<td>${this.bowels}</td>`);

        table.append(row);

        return table[0].outerHTML;
    }

    do(what) {
        // TODO: Eventually we will have fun visual stuff going on here.
        if (!isUndefined(this.outputLocation)) {
            this.outputLocation.log(what);
        }
        else {
            console.log(what);
        }
    }

    // Some helper methods and overrides
    getStatsAsString() {
        return `${this.name}\r\n\tHealth: ${this.health}\r\n\tHunger: ${this.hunger}\r\n\tHappiness ${this.happiness}\r\n\tBowels: ${this.bowels}`;
    }

    toString() {
        return this.getStatsAsString();
    }

    toHtml() {
        return this.getStatsAsHtml();
    }

    // Some global stuff to be called by the game state
    #tick = 0;
    timerTicked() {
        // Set a change for the hunger to go up.
        this.#tick++
        this.do(`tick ${this.#tick}`);

        const hungerChance = 10;
        const poopChance = 10;
        
        // 10% chance to get hungry
        if (percentile(hungerChance)) {
            this.hunger.inc();
        }
        
        if (percentile(poopChance)) {
            this.bowels.inc();
        }
    }

    setLocation(loc) {
        this.#location.x = loc.x;
        this.#location.y = loc.y;
    }

    // Private methods.
    #getCurrentPosition() {
        return this.#location;
    }

    #setCurrentPosition(pos) {
        if (!(valueIsUndefined(pos) || valueIsUndefined(pos.x) || valueIsUndefined(pos.y))) {
            this.#location.x = pos.x;
            this.#location.y = pos.y;
        }
    }
    
    #checkForStateChange() {
        // Let's test for a state change only 1 once every 100 ticks.
        const stateChangeTick = 60;
        if ((this.#totalTicks % stateChangeTick) == 0) {
            let stateChange = null;
            for(let i = 0; i < stateChangeTable.length; i++) {
                stateChange = stateChangeTable[i];
                // If hit the chance.
                if (percentile(stateChange.chance)) {
                    // Then change the state.
                    this.state = stateChange.state;
                    this.#currentDirection = stateChange.directions.length > 0 
                        ? stateChange.directions[getRandomRange(0, stateChange.directions.length-1)]
                        : this.#currentDirection;

                    return;
                }
            }
        }
        this.#totalTicks++;
        if (this.#totalTicks >= Number.MAX_SAFE_INTEGER) {
            this.#totalTicks = 0;
        }
    }
}
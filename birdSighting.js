'use strict';

const uuid = require('uuid');

// class that saves bird sighting containg, datetime, species, rarity, number, location, url
module.exports = class BirdSighting {
    constructor(datetime, species, rarity, number, location, url) {
        // this.id = uuid.v4();
        this.datetime = datetime;
        this.species = species;
        this.rarity = rarity;
        this.number = number;
        this.location = location;
        this.url = url;
    }
}

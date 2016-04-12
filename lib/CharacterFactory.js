var Ability = require('./Ability');
var Being = require('./Being');

var fs = require('fs');
var path = require('path');


// CharacterFactory Class
// ===

function CharacterFactory() {
    this.characterList = {};
    this.dbAbilityList = {};
    this.fsAbilityList = {};

    // Prepare to load file system based abilities
    var normalizedPath = path.join(__dirname, "abilities");
    var fsList = fs.readdirSync(normalizedPath);
    for (var file in fsList) {
        var filename = fsList[file];
        var Skill = require("./abilities/" + filename);
        this.fsAbilityList[filename] = new Skill();
    }
}

CharacterFactory.prototype = Object.create(Being.prototype);
CharacterFactory.prototype.constructor = CharacterFactory;


// Class Method: init()
// ---
//
// This method is responsible for initializing the list of Beings. It takes a
// Spreadsheet worksheet filled with Being data and parses it into a list of
// Being objects.
//
// @param {Object} Expects a Google Spreadsheet worksheet of characters
// @param {Object} Expects a Google Spreadsheet worksheet of abilities
// @return {Object}

CharacterFactory.prototype.init = function(characterRows, abilityRows) {

    // Filling out the Ability List comes first! This MUST happen before the
    // Character List is started.
    this._forRows(abilityRows, function(currentRow) {
        // Build a class for the new Ability in a closure to ensure the new
        // class variable is created fresh after each iteration.
        var map = this.mapAbilityFromSheetRows(abilityRows[currentRow]);

        // build out the Ability class from the `map` and add it to
        // the dbAbilityList
        this.dbAbilityList[map.slug] = this.buildAbility(map);
    }.bind(this));

    // Now, we fill out the Character List! This must come after the Ability
    // List has finished filling out.
    this._forRows(characterRows, function(currentRow) {
        // Build a class for the new Being in a closure to ensure the new
        // class variable is created fresh after each iteration.
        var map = this.mapCharacterFromSheetRows(characterRows[currentRow]);

        // build out the Being class from the `map` and add it to
        // the characterList
        this.characterList[map.slug] = this.buildIndividual(map);
    }.bind(this));

    return this;
};


// Class Method: mapCharacterFromSheetRows()
// ---
//
// This method is responsible for mapping out a single character or bestiary row
// from Google Spreadsheets into an easy to understand mapping for
// easy consumption.
//
// @param {Object} Expects a Google Spreadsheet row object
// @return {Object}

CharacterFactory.prototype.mapCharacterFromSheetRows = function(characterRow) {
    return {
        // Basics
        name:         characterRow[1],
        slug:         characterRow[2],
        region:       characterRow[3],
        description:  characterRow[4],
        level:        characterRow[5],

        // Dmg stats
        strength:     characterRow[7],
        intelligence: characterRow[8],

        // Pool stats
        vitality:     characterRow[9],
        arcana:       characterRow[10],

        // Defensive stats
        defense:      characterRow[11],
        mystica:      characterRow[12],

        // Hit stats
        accuracy:     characterRow[13],
        agility:      characterRow[14],

        // Experience
        experience:   characterRow[22],

        // Abilities
        offensive:    characterRow[23],
        defensive:    characterRow[24],
        secondary:    characterRow[25],
    }
};


// Class Method: mapAbilityFromSheetRows()
// ---
//
// This method is responsible for mapping out a single ability row from Google
// Spreadsheets into an easy to understand mapping for easy consumption.
//
// @param {Object} Expects a Google Spreadsheet row object
// @return {Object}

CharacterFactory.prototype.mapAbilityFromSheetRows = function(abilityRow) {
    return {
        name:         abilityRow[1],
        slug:         abilityRow[2],
        type:         abilityRow[3],
        description:  abilityRow[4],

        mpCost:       abilityRow[5],
        area:         abilityRow[6],
        baseAccuracy: abilityRow[7],
        baseSpeed:    abilityRow[8],
        modifier:     abilityRow[9],
        effect:       abilityRow[10],
        baseEffect:   abilityRow[11]
    }
};


// Class Method: buildIndividual()
// ---
//
// This method is responsible for creating a unique Class based on the provided
// spreadsheet map. This way, any number of characters can be created based on
// that class. For example, any number of monsters of a single type.
//
// @param {Object} expects the mapped out character data
// @return {Object}

CharacterFactory.prototype.buildIndividual = function(map) {
    var self = this;

    var Individual = function Individual(options) {
        var dbAbilityList = self.dbAbilityList;

        Being.call(this, {
            name:         options.name         || map.name,
            slug:         options.slug         || map.slug,
            region:       options.region       || map.region,
            description:  options.description  || map.description,
            level:        options.level        || map.level,

            strength:     options.strength     || map.strength,
            intelligence: options.intelligence || map.intelligence,
            vitality:     options.vitality     || map.vitality,
            arcana:       options.arcana       || map.arcana,
            defense:      options.defense      || map.defense,
            mystica:      options.mystica      || map.mystica,
            accuracy:     options.accuracy     || map.accuracy,
            agility:      options.agility      || map.agility,

            offensive: dbAbilityList[options.offensive || map.offensive],
            defensive: dbAbilityList[options.defensive || map.defensive],
            secondary: dbAbilityList[options.secondary || map.secondary],
        });
    };

    // Fix the prototype and constructors for all the types of Being classes.
    // Although I bet this is problematic, as this is done for every instance of
    // any of these enemy classes... something's probably going to go wrong.
    Individual.prototype = Object.create(Being).prototype;
    Individual.prototype.constructor = Individual;

    return Individual;
}


// Class Method: buildAbility()
// ---
//
// This method is responsible for creating new Abilities based on the provided
// spreadsheet map.
//
// @param {Object} expects the mapped out ability data
// @return {Object}

CharacterFactory.prototype.buildAbility = function(map) {

    // Factory out the new ability!
    var currentAbility = function currentAbility(options) {

        Ability.call(this, {
            name:         map.name,
            slug:         map.slug,
            type:         map.type,
            description:  map.description,

            mpCost:       map.mpCost,
            area:         map.area,
            baseAccuracy: map.baseAccuracy,
            baseSpeed:    map.baseSpeed,
            modifier:     map.modifier,
            effect:       map.effect,
            baseEffect:   map.baseEffect
        });
    };

    currentAbility.prototype = Object.create(Ability).prototype;
    currentAbility.prototype.constructor = Ability;

    // Extend the current ability with the class methods defined for this
    // ability in their ability files, as seen in the `/abilities` directory
    var fsAbility = this.fsAbilityList[map.slug + '.js'];

    if (!!fsAbility) {
        console.log(fsAbility);

        // Okay, we have both the ability class coming from the file system, and
        // the currentAbility class that's being factoried now.
        //
        // What now?
        //
        // Now, we want to override the current factoried ability's default .do()
        // method with the one coming from the fsAbility...
        //
        // But right now that's now working
        //
        // @TODO
        // - [ ] Fix this shit

        for(method in fsAbility.prototype) {
            console.log('method name: ' + method.name);
            currentAbility.prototype[method.name] = method;
        }
    }

    var newAbility = new currentAbility();

    // console.log('test start');
    // newAbility.do(); // currently stuck using default do(), not the newly defined new()
    // console.log('test end');

    return newAbility;
}


// Class Method: factory()
// ---

CharacterFactory.prototype.manufacture = function(options) {
    var Class = this.characterList[options.type];

    if (Class == null) {
        return false;
    }

    return new Class(options);
};


// Class Method: _forRows()
// ---
//
// This is a helper for() loop helper to make the parsing of Google Spreadsheets
// a bit easier.
//
// @param {Object} Expects a Google Spreadsheet Worksheet object
// @param {Function} Expects a function to callback in each iteration of the
//        for() loop

CharacterFactory.prototype._forRows = function(rows, callback) {
    for (var currentRow in rows) {
        if (currentRow == 1) {
            // Skip the first row, it's just a set of labels
        } else {
            callback(currentRow);
        }
    }
};


// Export
// ---

module.exports = CharacterFactory;

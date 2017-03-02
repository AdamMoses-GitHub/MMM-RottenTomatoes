/* global Module */

/* node_helper.js
 * 
 * Magic Mirror
 * Module: MMM-RottenTomatoes
 * 
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 * Module MMM-RottenTomatoes By Adam Moses http://adammoses.com
 * MIT Licensed.
 */

// call in the required classes
var RTS = require("rt-scraper");

// the main module helper create
module.exports = NodeHelper.create({
    // subclass start method, clears the initial config array
    start: function() {
        this.moduleConfigs = [];
        this.timers = [];
        this.errorCount = 0;
        // this value controls number of calls fails before giving up
        this.errorFailLimit = 10;
    },
    // subclass socketNotificationReceived, received notification from module
    socketNotificationReceived: function(notification, payload) {
        if (notification === "ROTTEN_TOMATOES_REGISTER_CONFIG") {              
            // add the current config to an array of all configs used by the helper
            this.moduleConfigs[this.moduleConfigs.length] = payload;
            // this to self
            var self = this;     
            // call the initial update now
            this.updateRTData(payload);
            // schedule the updates
            this.timers[this.timers.length] = setInterval(
                function() { self.updateTweets(payload); }, payload.refreshRate);
        }
    },
    // increment error count, if passed limit send notice to module and stop updates
    processError: function() {
        this.errorCount += 1;
        if (this.errorCount >= this.errorFailLimit)
        {
            this.sendSocketNotification('ROTTEN_TOMATOES_TOO_MANY_ERRORS', {} );
            for (var cIndex = 0; cIndex < this.timers.length; cIndex++)
                clearTimeout(this.timers[cIndex]);
            this.timers = [];
        }
    },    
    // main helper function to get the rotten tomatoes information
    updateRTData: function(theConfig) { 
        // this to self
        var self = this;
        // otherwise get a named list
        RTS.getRottenTomatoesScraperData( function(error, data) {
            if (!error) {
                var returnPayload = {identifier: theConfig.identifier
                						, rtData: data};
                self.sendSocketNotification('ROTTEN_TOMATOES_UPDATE', returnPayload );
            }
            else {
                this.processError();
            }
        });
    },      
});

//------------ end -------------

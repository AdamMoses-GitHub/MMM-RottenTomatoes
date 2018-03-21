/* global Module */

/* MMM-RottenTomatoes.js
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

Module.register("MMM-RottenTomatoes", {
	// setup the default config options
	defaults: {		
		// optional
		showHeader: true,
		showOpeningThisWeek: true,
		showBoxOffice: true,
		showComingSoon: true,
		limitOpeningThisWeek: 3,
		limitBoxOffice: 3,
		limitComingSoon: 3,
		boxOfficeAfter: true,
		mergeOpeningAndComingSoon: true,
		showTomatoImages: true,
	},
	// the start function
	start: function() {
		// log starting
		Log.info("Starting module: " + this.name);
		// set refresh rate to 6 hours
		this.config.refreshRate = 6 * 60 * 60 * 1000;
        // set an identier config tag
		this.config.identifier = this.identifier;
		// set loaded, error, and the update to init values
		this.loaded = false;
		this.errorMessage = null;
		// set the header to this place
        if (this.config.showHeader) {    
            this.data.header = 'Rotten Tomatoes';
        }
		if (this.config.limitOpeningThisWeek == 0)
			this.config.limitOpeningThisWeek = 100;
		if (this.config.limitBoxOffice == 0)
			this.config.limitBoxOffice = 100;
		if (this.config.limitComingSoon == 0)
			this.config.limitComingSoon = 100;
        // add this config to the helper functions
		this.sendSocketNotification('ROTTEN_TOMATOES_REGISTER_CONFIG', this.config);
	},
	// the socket handler
	socketNotificationReceived: function(notification, payload) {
		// if an update was received
		if (notification === "ROTTEN_TOMATOES_UPDATE") {
			// check this is for this module based on the woeid
			if (payload.identifier === this.identifier)
			{
				// set loaded flag, set the update, and call update dom                
				this.rtData = payload.rtData;
                this.loaded = true;
                this.updateDom();
			}
		}
        // if sent error notice
        if (notification === "ROTTEN_TOMATOES_TOO_MANY_ERRORS") {
            this.errorMessage("There was an error.");
            if (this.updateTimer !== null)
                clearTimeout(this.updateTimer);
            this.updateTimer = null;
            this.updateDom();
        }
	},
	//
	cleanScore: function(theScore) {
		if (theScore.indexOf('%') == -1)
			return '--';
		else
			return theScore;
	},
	//
	cleanTitle: function(theTitle) {
		if (theTitle.length > 28)
			return theTitle.slice(0, 28) + '...';
		else
			return theTitle;
	},
	// the get dom handler
	getDom: function() {
        // if an error, say so
        if (this.errorMessage !== null) {
            var wrapper = document.createElement("div");
			wrapper.className = "small";
			wrapper.innerHTML = this.errorMessage;
			return wrapper;	
        }
		// if nothing loaded yet, put in placeholder text
		if (!this.loaded) {
			var wrapper = document.createElement("div");
			wrapper.className = "small";
			wrapper.innerHTML = "Awaiting Update...";
			return wrapper;			
		}
		var titleSize = 'xsmall';
		var movieSize = 'small';
		var wrapper = document.createElement("table");
		// do opening this week
		var allOTWandCSRows = [ ];
		if (this.config.showOpeningThisWeek) {
			var otwData = this.rtData.openingThisWeek;
			var otwTitleTR = document.createElement("tr");
			otwTitleTR.className = titleSize;
			var otwTitleTD = document.createElement("td");
			otwTitleTD.innerHTML = "Opening This Week";
			if (this.config.mergeOpeningAndComingSoon)
				otwTitleTD.innerHTML = "Opening / Coming Soon";
			otwTitleTD.colSpan = "3";
			otwTitleTR.appendChild(otwTitleTD);
			allOTWandCSRows.push(otwTitleTR);
			for (var cIndex = 0; 
					(cIndex < otwData.length) && (cIndex < this.config.limitOpeningThisWeek); 
					cIndex++) {
				var cOTW = otwData[cIndex];
				var otwRowTR = document.createElement("tr");

				// This section shows the either rotten or fresh rating based on percentage
				otwRowTR.className = movieSize;
				if (this.config.showTomatoImages == true) {
					var otwRowTomato = document.createElement("td");
					var otwmoviepercent = parseFloat(this.cleanScore(cOTW.meter)) / 100.0;
                                	if(otwmoviepercent < .75)
                                	{
                                        	otwRowTomato.innerHTML = '<img src="modules/MMM-RottenTomatoes/icons/splat-16.png">' + "&nbsp;&nbsp;";
                                	}else if (otwmoviepercent >= .75) {
	                                      	otwRowTomato.innerHTML = '<img src="modules/MMM-RottenTomatoes/icons/fresh-16.png">' + "&nbsp;&nbsp;";
                                	}
                                	otwRowTR.appendChild(otwRowTomato);
				}

				var otwRowMeter = document.createElement("td");
				otwRowMeter.innerHTML = this.cleanScore(cOTW.meter) + "&nbsp;&nbsp;";
				otwRowTR.appendChild(otwRowMeter);
				var otwRowTitle = document.createElement("td");
				otwRowTitle.innerHTML = this.cleanTitle(cOTW.title) + "&nbsp;&nbsp;";
				otwRowTitle.align = 'left';
				otwRowTR.appendChild(otwRowTitle);
				var otwRowDate = document.createElement("td");
				otwRowDate.innerHTML = "&nbsp;&nbsp;" + cOTW.date;
				otwRowTR.appendChild(otwRowDate);
				allOTWandCSRows.push(otwRowTR);
			}
		}
		// do opening this week
		if (this.config.showOpeningThisWeek) {
			var csData = this.rtData.comingSoon;
			var csTitleTR = document.createElement("tr");
			csTitleTR.className = titleSize;
			var csTitleTD = document.createElement("td");
			csTitleTD.innerHTML = "Coming Soon";
			csTitleTD.colSpan = "3";
			csTitleTR.appendChild(csTitleTD);
			if (!this.config.mergeOpeningAndComingSoon)
				allOTWandCSRows.push(csTitleTR);
			for (var cIndex = 0; 
					(cIndex < csData.length) && (cIndex < this.config.limitComingSoon); 
					cIndex++) {
				var ccs = csData[cIndex];
				var csRowTR = document.createElement("tr");	
				csRowTR.className = movieSize;

				// This section shows the either rotten or fresh rating based on percentage
				if (this.config.showTomatoImages == true) {
					var csRowTomato = document.createElement("td");
					var moviepercent = parseFloat(this.cleanScore(ccs.meter)) / 100.0;
					if(moviepercent < .75)
					{
						csRowTomato.innerHTML = '<img src="modules/MMM-RottenTomatoes/icons/splat-16.png">' + "&nbsp;&nbsp;";
					}else if (moviepercent >= .75) {
						csRowTomato.innerHTML = '<img src="modules/MMM-RottenTomatoes/icons/fresh-16.png">' + "&nbsp;&nbsp;";
					}
					csRowTR.appendChild(csRowTomato);
				}

				var csRowMeter = document.createElement("td");
				csRowMeter.innerHTML = this.cleanScore(ccs.meter) + "&nbsp;&nbsp;";
				csRowTR.appendChild(csRowMeter);
				var csRowTitle = document.createElement("td");
				csRowTitle.innerHTML = this.cleanTitle(ccs.title) + "&nbsp;&nbsp;";
				csRowTitle.align = 'left';
				csRowTR.appendChild(csRowTitle);
				var csRowDate = document.createElement("td");
				csRowDate.innerHTML = "&nbsp;&nbsp;" + ccs.date;
				csRowTR.appendChild(csRowDate);
				allOTWandCSRows.push(csRowTR);
			}	
		}		
		// do box office
		var boRows = [ ];
		if (this.config.showBoxOffice) {
			var boData = this.rtData.boxOffice;
			var boTitleTR = document.createElement("tr");
			boTitleTR.className = titleSize;
			var boTitleTD = document.createElement("td");
			boTitleTD.innerHTML = "Box Office";
			boTitleTD.width = "250px";
			boTitleTD.colSpan = "3";
			boTitleTR.appendChild(boTitleTD);
			boRows.push(boTitleTR);
			for (var cIndex = 0; 
					(cIndex < boData.length) && (cIndex < this.config.limitBoxOffice); 
					cIndex++) {
				var cbo = boData[cIndex];
				var boRowTR = document.createElement("tr");	
				boRowTR.className = movieSize;
				var boRowMeter = document.createElement("td");
				boRowMeter.innerHTML = this.cleanScore(cbo.meter) + "&nbsp;&nbsp;";
				boRowTR.appendChild(boRowMeter);
				var boRowTitle = document.createElement("td");
				boRowTitle.innerHTML = this.cleanTitle(cbo.title) + "&nbsp;&nbsp;";
				boRowTitle.align = 'left';
				boRowTR.appendChild(boRowTitle);
				var boRowGross = document.createElement("td");
				boRowGross.innerHTML = "&nbsp;&nbsp;" + cbo.gross;
				boRowTR.appendChild(boRowGross);
				boRows.push(boRowTR);
			}
		}
		// build the table
        var allRows = [ ];
        // if set to show box office first, do that
		if (!this.config.boxOfficeAfter)
			allRows = allRows.concat(boRows);
        // add opening this week and coming soon rows
		allRows = allRows.concat(allOTWandCSRows);
        // if set to show box office after, do that
		if (this.config.boxOfficeAfter)
			allRows = allRows.concat(boRows);
        // add all rows to the return table wrapper
		for (var cIndex = 0; cIndex < allRows.length; cIndex++) {
			wrapper.appendChild(allRows[cIndex]);
		}
        // return table wrapper
		return wrapper;	
	}
});

// ------------ end -------------

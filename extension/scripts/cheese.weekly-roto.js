$(document).ready(function() {
	var cacheAvoider = (new Date()).getTime();
	var leagueInfo = new YahooBaseballLeagueInfo();
	var weeklyRotoContent = "<p id=\"cheese-weekly-loading-message\">Loading...</p>";
	var scoringContent = "";
	var loadingError = "<p id=\"cheese-weekly-loading-message\">An error occurred while loading the weekly rotisserie standings.</p>";
	var rootWeeklyRotoTemplate = new DustTemplate("cheese.weekly-roto.main");
	var rotoScoresTemplate = new DustTemplate("cheese.weekly-roto.overall-scores");
	var pastRotoScores = new YahooBaseballPastScores("https://s3-us-west-2.amazonaws.com/fe-share/ctml/past+scores.json?cacheAvoider=" + cacheAvoider);

	$(document).on("click", ".roto-controls", function () { summaryExpandClicked($(this)) });
	$(document).on("change", "#weekly-roto-score-type-selector", function () { updateScoringUI(leagueInfo, rotoScoresTemplate); });
	$(document).on("change", "#weekly-roto-week-selector", function() { updateScoringUI(leagueInfo, rotoScoresTemplate); });
	
	leagueInfo
		.whenReady(function() {
			console.log("League Info Ready");

			var scoring = new YahooBaseballWeeklyRotoScores(leagueInfo);
			console.log("Calculated weekly scoring. Seralized scoring data follows.");
			console.log(JSON.stringify(leagueInfo));
			
			if(scoring.errorMessage) { console.error(scoring.errorMessage); weeklyRotoContent = scoring.errorMessage; }
			else {
				var topContentContainer = $("#leaguestandingstabs");
				if(topContentContainer.length == 0) { console.error("Could not locate content area to display draft analysis."); return; }
				
				var lastNavItem = topContentContainer.find(".Navitem").last();
				if(lastNavItem.length == 0) { console.error("Could not locate item needed to insert keeper analysis tab."); return; }
				
				var tabContentContainer = topContentContainer; // .children("div");
				if(tabContentContainer.length == 0) { console.error("Could not locate content area to which roto score is to be added."); return; }
				
				// Inserts and attaches events to weekly roto tab
				var rotoNavItem = lastNavItem.clone().attr("id", "weekly-roto-tab");
				var rotoLink = rotoNavItem.find("a");
				rotoLink.attr("href", "").attr("id", "weekly-roto-link");
				rotoLink.text("Weekly Roto");
				lastNavItem.after(rotoNavItem);


				var standingsContent = $("#lhststandtab");

				rotoNavItem.click(function(clickEvent) {
					clickEvent.preventDefault();
					clickEvent.stopPropagation();

					// Changes which tab is shown as selected
					rotoNavItem.siblings(".Selected").removeClass("Selected");
					rotoNavItem.addClass("Selected");

					var existingRotoArea = standingsContent.siblings(".ctml-roto-standings");

					// Adds CTML roto content if it doesn't already exist.
					if(existingRotoArea.length == 0) {
						var standingsClone = standingsContent.clone().attr("id", "ctml-roto-standings");
						standingsClone.html(weeklyRotoContent);
						standingsClone.find("ul.team-scores").html(scoringContent);
						standingsContent.after(standingsClone);

						existingRotoArea = standingsClone;
					}

					existingRotoArea.siblings(".Selected").removeClass("Selected");
					existingRotoArea.addClass("Selected");

					// Adds analysis content to content area
					// tabContentContainer.html(weeklyRotoContent);	
					// $("ul.team-scores").html(scoringContent);
					
					// Hides weekly naviation element
					// $("#matchup_week_nav").hide();
				});
				
				pastRotoScores
					.whenReady(function() {						
						leagueInfo.pastScores = pastRotoScores.scores;

						rootWeeklyRotoTemplate.render(leagueInfo, function(error, rotoWrapperContent) {
							if(error) {
								console.error("Unable to render weekly root roto content. Error was: " + error);
								weeklyRotoContent = loadingError;
							}
							else {
								rotoScoresTemplate.render(scoring, function(error, overallScoringContent) {									
									weeklyRotoContent = rotoWrapperContent;
									scoringContent = overallScoringContent;
									
									// If weekly tab is selected, puts the newly-loaded content in place.
									if(rotoNavItem.hasClass("Selected")) {									
										tabContentContainer.html(content);
									}
								});
							}
						});
					})
					.onError(function(error) { console.error(error); weeklyRotoContent = loadingError; });
			}
		})
		.onError(function(error) { console.error(error); weeklyRotoContent = loadingError; });
});

function summaryExpandClicked(button) {
	if(button && button.length) {
		var teamClicked = button.parent();
		
		if(teamClicked.length) {
			var detailsList = teamClicked.find("ul.scoring-details");
			button.toggleClass("expanded");
			detailsList.toggleClass("expanded");
		}
	}
}

function scoringCategoryChanged(scoringCategoriesControl, leagueInfo, scoresTemplate) {
    if (scoringCategoriesControl && scoringCategoriesControl.length && leagueInfo && leagueInfo.isLoaded && scoresTemplate) {
        var selectedCategoryOption =
            scoringCategoriesControl.find("option:selected");
        if (selectedCategoryOption.length) {
            var selectedCategory = selectedCategoryOption.attr("data-scoring-category");
			var scoring = new YahooBaseballWeeklyRotoScores(leagueInfo);
			var selectedCategoryScoring = scoring.statScores[selectedCategory];

            scoresTemplate.render(selectedCategoryScoring ? {teamScores: selectedCategoryScoring} : scoring, function(error, scoringContent) {
           		$("ul.team-scores").html(scoringContent);
            });
        }
    }
}

function updateScoringUI(leagueInfo, scoresTemplate) {
	var selectedCategoryOption = $("select#weekly-roto-score-type-selector > option:selected");
	var selectedWeekOption = $("select#weekly-roto-week-selector > option:selected");

	if(!selectedCategoryOption.length) {
		console.error("Unable to locate selected category to update weekly scoring UI.");
		return;
	}
	if(!selectedWeekOption.length) {
		console.error("Unable to locate selected week to update weekly scoring UI.");
		return;
	}

	var selectedCategory = selectedCategoryOption.attr("data-scoring-category");
	var selectedWeekNumber = parseInt(selectedWeekOption.attr("data-week-index"));
	if(isNaN(selectedWeekNumber)) selectedWeekNumber = 0;

	var targetWeeklyData = selectedWeekNumber > 0 && selectedWeekNumber < leagueInfo.pastScores.length? leagueInfo.pastScores[selectedWeekNumber] : leagueInfo;
	var scoringData = new YahooBaseballWeeklyRotoScores(targetWeeklyData);
	var selectedCategoryScoring = scoringData.statScores[selectedCategory];

	scoresTemplate.render(selectedCategoryScoring? { teamScores: selectedCategoryScoring } : scoringData, function(error, scoringContent) {
		$("ul.team-scores").html(scoringContent);
	});
}


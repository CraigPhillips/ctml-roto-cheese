$(document).ready(function() {
	var draftInfo = new YahooBaseballDraft("chickentendermelt", 2013);
	
	draftInfo
		.whenReady(function() {
			console.log(draftInfo);
		})
		.onError(function(error) {
			console.error(error);
		});
});


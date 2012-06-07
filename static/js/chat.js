var PING_PERIOD=10;

function addAcronym(acronym,text) {
	if (acronym.length>0) {
		return acronym+": "+text;
	} else {
		return text;
	}
}

var postURL = "/post";
var pingURL = "/ping";
var messagesURL = "/messages";
var quitURL = "/bye";

/* Browser compatibility for visibilityChange */
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") {
	hidden = "hidden";
	visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
	hidden = "mozHidden";
	visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
	hidden = "msHidden";
	visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
	hidden = "webkitHidden";
	visibilityChange = "webkitvisibilitychange";
}

$(document).ready(function() {

	var ORIGINAL_TITLE = document.title;
	var unconfirmed = [], pingInterval;
	var conversation = $('#conversation');

	function addLine(color, text){
		$('<p />').css('color', color).text(text).appendTo('#conversation');
		conversation.scrollTop(conversation[0].scrollHeight);
	}

	function updateChatPreview(){
		var preview = $('#textInput').val();
		if (preview.substr(0,1)=='/') {
			preview = jQuery.trim(preview.substr(1));
		} else {
			preview = jQuery.trim(applyQuirks(preview));
		}
		if (preview.length>0) {
			$('#preview').text(preview);
		} else {
			$('#preview').html('&nbsp;');
		}
		$('#conversation').css('bottom',($('#controls').height()+10)+'px');
		return preview.length!=0;
	}
	
	$('#textInput').change(updateChatPreview).keyup(updateChatPreview).change();
	$('#preview').css('color', userColor);

	var previewHidden = false;
	$('#hidePreview').click(function() {
		if (previewHidden) {
			$('#preview').show();
			$(this).text("[hide]");
		} else {
			$('#preview').hide();
			$(this).text("[show]");
		}
		$('#conversation').css('bottom',($('#controls').height()+10)+'px');
		previewHidden = !previewHidden;
		return false;
	});

	$('#controls').submit(function() {
		if (updateChatPreview()) {
			text = $('#preview').text();
			if (pingInterval) {
				window.clearTimeout(pingInterval);
			}
			$.post(postURL,{'chat': chat, 'line': text}); // todo: check for for error
			pingInterval = window.setTimeout(pingServer, PING_PERIOD*1000);
			$('#textInput').val('');
		}
		return false;
	});

	function pingServer() {
		$.post(pingURL, {'chat': chat});
		pingInterval = window.setTimeout(pingServer, PING_PERIOD*1000);
	}

	function getMessages() {
		$.post(messagesURL, {'chat': chat, 'after': latestNum}, function(data) {
			var messages = data.messages;
			for (var i=0; i<messages.length; i++) {
				var msg = messages[i];
				addLine('#'+msg['color'], msg['line']);
				latestNum = Math.max(latestNum, msg['id']);
			}
			if (typeof hidden!=="undefined" && document[hidden]==true) {
				document.title = "New message - "+ORIGINAL_TITLE;
			}
		}, "json").complete(function() {
			window.setTimeout(getMessages, 50);
		});
	}

	if (typeof document.addEventListener!=="undefined" && typeof hidden!=="undefined") {
		document.addEventListener(visibilityChange, function() {
			if (document[hidden]==false) {
				// You can't change document.title here in Webkit. #googlehatesyou
				window.setTimeout(function() {
					document.title = ORIGINAL_TITLE;
				}, 50);
			}
		}, false);
	}

	window.setTimeout(getMessages, 500);
	pingInterval=window.setTimeout(pingServer, PING_PERIOD*1000);

	$(window).unload(function() {
		$.ajax(quitURL, {'type': 'POST', data: {'chat': chat}, 'async': false});
	});

});

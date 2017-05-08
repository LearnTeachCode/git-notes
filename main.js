// CURRENT SETUP FOR TESTING:
// GitHub OAuth app points to http://localhost:8080/
// Gatekeeper hosted at https://gatekeeper-git-notes.herokuapp.com/
// Use a local server to test the app, like https://www.npmjs.com/package/http-server
// NOTE: remember to do a HARD refresh to test new changes locally.


// Get the temporary GitHub code from URL params, as in ?code=gitHubTemporaryCodeHere
var gitHubTemporaryCodeArray = window.location.href.match(/\?code=(.*)/);

// If code exists (meaning the user clicked the login button, gave access in GitHub, and was redirected):
if (gitHubTemporaryCodeArray) {
  // Get the access token from Gatekeeper using the temporary code
  // (Gatekeeper exchanges this for an access token, using the stored client ID and client secret)
  getJSON('https://gatekeeper-git-notes.herokuapp.com/authenticate/' + gitHubTemporaryCodeArray[1])
    .then(logTokenToTestThis).catch(logError);	
}

function logTokenToTestThis (data) {
	console.log(data);
	console.log(data.token);
}


/* -------------------------------------------------
	HELPER FUNCTIONS
---------------------------------------------------- */

// Returns a promise, as a simple wrapper around XMLHTTPRequest
// via http://eloquentjavascript.net/17_http.html
function get(url) {
  return new Promise(function(succeed, fail) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.addEventListener("load", function() {
      if (req.status < 400)
        succeed(req.responseText);
      else
        fail(new Error("Request failed: " + req.statusText));
    });
    req.addEventListener("error", function() {
      fail(new Error("Network error"));
    });
    req.send(null);
  });
}

// Return object from parsed JSON data from a given URL
// via http://eloquentjavascript.net/17_http.html
function getJSON(url) {
  return get(url).then(JSON.parse, logError);
}

// Lazy error handling for now
function logError(error) {
  console.log("Error: " + error);
};
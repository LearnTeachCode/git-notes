// CURRENT SETUP FOR TESTING:
// GitHub OAuth app points to http://localhost:8080/
// Gatekeeper hosted at https://gatekeeper-git-notes.herokuapp.com/
// Use a local server to test the app, like https://www.npmjs.com/package/http-server
// NOTE: remember to do a HARD refresh to test new changes locally.

// For testing, we'll use this as the master repo:
var GITHUB_REPO = 'git-notes';
var GITHUB_OWNER = 'LearnTeachCode';

// VARIABLES FOR CURRENT USER:
var gitHubAccessToken;	
var userName;
var userForkedRepoName;

// VARIABLES FOR GIT COMMIT PROCESS
var newFileName = 'test.md';	// for testing!
var previousCommitSha;
var previousTreeSha;
var newBlobSha;
var newTreeSha;
var newCommitSha;

// Elements and user input:
var messageBox = document.getElementById("msg");
var userText = document.getElementById("usertext").value;

// Get the temporary GitHub code from URL params, as in ?code=gitHubTemporaryCodeHere
var gitHubTemporaryCodeArray = window.location.href.match(/\?code=(.*)/);

// If code exists (meaning the user clicked the login button, gave access in GitHub, and was redirected):
if (gitHubTemporaryCodeArray) {

  // First, get the access token from Gatekeeper using the temporary code
  // (Gatekeeper exchanges this for an access token, using the stored client ID and client secret)
  get('https://gatekeeper-git-notes.herokuapp.com/authenticate/' + gitHubTemporaryCodeArray[1])
  .then(JSON.parse).then(function (authResponse){
    console.log('Authentication response from Gatekeeper:\n');
    console.log(authResponse);

    // Save the access token for later API calls!
    gitHubAccessToken = authResponse.token;

    messageBox.textContent = "You're logged in! Type some notes and click Submit when you're done!";
  });

}

// When user clicks "submit" button, post to GitHub!
document.getElementById('submit').addEventListener('click', submitToGitHub);

function submitToGitHub() {
  // If user hasn't signed in first, notify user to do so before submitting notes!
  if (!gitHubAccessToken) {
  	messageBox.textContent = "<strong>Please log in with GitHub first! Then you can submit your notes.</strong>";
  	return;	// Exit from this function, skipping the code below
  }

  messageBox.innerHTML = "<em>...Loading...</em>";

  // First, fork the base repo onto the user's account
  postWithToken('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/forks', {}, gitHubAccessToken)
  .then(JSON.parse).then(function (forkResponse){
    console.log('GitHub response after forking the base repo:\n');
    console.log(forkResponse);

    // Save username and name of newly-forked repo
    userName = forkResponse.owner.login;
    userForkedRepoName = forkResponse.name;

    // Next: COMMITTING A NEW FILE! It's a six step process!
    // Step 1: Get the SHA of the previous commit
    return get('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/refs/heads/master');

  }).then(JSON.parse).then(function (step1Response){
    console.log('GitHub response after requesting SHA of previous commit:\n');
    console.log(step1Response);

    // Save SHA of the previous commit
    previousCommitSha = step1Response.object.sha;

    // Step 2: Get the tree of the previous commit
    return get('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/commits/' + previousCommitSha);

  }).then(JSON.parse).then(function (step2Response){
    console.log('GitHub response after requesting tree of previous commit:\n');
    console.log(step2Response);

    // Save SHA of the previous tree
    previousTreeSha = step2Response.tree.sha;

    // Step 3: Create a new blob (file)
    var newBlobData = {"content": "# 456This is a test!\n" + userText + "\n", "encoding": "utf-8"};
    return postWithToken('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/blobs', newBlobData, gitHubAccessToken);

  }).then(JSON.parse).then(function (step3Response){
    console.log('GitHub response after creating new blob:\n');
    console.log(step3Response);

    // Save SHA of the new blob
    newBlobSha = step3Response.sha;

    // Step 4: Create a new tree
    var newTreeData = {
    	"base_tree": previousTreeSha,
    	"tree": [
    		{"path": newFileName, "mode": "100644", "type": "blob", "sha": newBlobSha}
    	]
    };
    return postWithToken('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/trees', newTreeData, gitHubAccessToken);

  }).then(JSON.parse).then(function (step4Response){
    console.log('GitHub response after creating new tree:\n');
    console.log(step4Response);

    // Save SHA of the new tree
    newTreeSha = step4Response.sha;

    // Step 5: Create a new commit
    var newCommitData = {
    	"parents": [previousCommitSha],
    	"tree": newTreeSha,
    	"message": "Testing remote commit via GitHub API"
	};
	return postWithToken('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/commits', newCommitData, gitHubAccessToken);

  }).then(JSON.parse).then(function (step5Response){
    console.log('GitHub response after creating new commit:\n');
    console.log(step5Response);

    // Save SHA of the new commit
    newCommitSha = step5Response.sha;

    // Step 6: Move the commit to the branch
    var newBranchRefData = {"sha": newCommitSha};
	return postWithToken('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/git/refs/heads/master', newBranchRefData, gitHubAccessToken);

  }).then(function (step6response){
    console.log("GitHub response after moving commit onto the branch:\n");
    console.log(step6response);

    // Finally, make a pull request!
    var pullRequestData = {"title": "Test PR!", "body": "test 123!", "base": "master", "head": userName + ":master"};
    return postWithToken('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/pulls', pullRequestData, gitHubAccessToken);

  }).then(JSON.parse).then(function (pullResponse){
  	messageBox.innerHTML = '<strong>Notes test submitted successfully!</strong> <a href="' + pullResponse.html_url + '">View your newly-created pull request here!</a>';
  }).catch(logAndDisplayError); // Log error to console and display on the web page too

} // end of submitToGitHub function

function logAndDisplayError (errorMessage) {
	console.log(errorMessage);
	messageBox.textContent = errorMessage;
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

// Returns a promise for a POST request
function postWithToken(url, postDataObject, accessToken) {
  return new Promise(function(succeed, fail) {
    var req = new XMLHttpRequest();

    req.open("POST", url, true);
    
    // Set header for POST, like sending form data
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    // Set header for GitHub auth
    req.setRequestHeader('Authorization', 'token ' + accessToken);

    req.addEventListener("load", function() {
      if (req.status < 400)
        succeed(req.responseText);
      else
        fail(new Error("Request failed: " + req.statusText));
    });
    req.addEventListener("error", function() {
      fail(new Error("Network error"));
    });
    req.send(JSON.stringify(postDataObject));
  });
}
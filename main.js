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
var pullRequestLink;

// VARIABLES FOR GIT COMMIT PROCESS
var notesFileName = '2017-05-10-notes.md';	// for testing!
var pullRequestTitle = "Appended notes!"; // for testing!
var pullRequestBody = '';
var notesFileSha;
var newCommitSha;

// Elements and user input:
var messageSection = document.getElementById("messageSection");
var displaySection = document.getElementById("displaySection");
var loginSection = document.getElementById("loginSection");
var inputSection = document.getElementById("inputSection");
var userNameSpan = document.getElementById("userNameSpan");

// Before user login or anything else, display the existing notes!
getWithCustomHeader('https://api.github.com/repos/LearnTeachCode/git-notes/contents/' + notesFileName)
  .then(function (notesResponse){
    console.log('GitHub response after requesting notes:\n');
    console.log(notesResponse);
    
    // TODO: Better error handling!

    // Display the HTML of rendered notes
    displaySection.innerHTML = notesResponse;   
        
  }).catch(logAndDisplayError);

// Get the temporary GitHub code from URL params, as in ?code=gitHubTemporaryCodeHere
var gitHubTemporaryCodeArray = window.location.href.match(/\?code=(.*)/);

// If code exists (meaning the user clicked the login button, gave access in GitHub, and was redirected):
if (gitHubTemporaryCodeArray) {

  // Hide login section if user has started the login process
  loginSection.classList.add('hidden');
  inputSection.classList.remove('hidden');

  // Display loading message
  messageSection.classList.remove('hidden');
  messageSection.innerHTML = "<p><em>...Loading...</em></p>";

  // Step 1: Authenticate the user with GitHub
  // (Gatekeeper exchanges temporary code for an access token, using the stored client ID and client secret)
  get('https://gatekeeper-git-notes.herokuapp.com/authenticate/' + gitHubTemporaryCodeArray[1])
  .then(JSON.parse).then(function (authResponse){
    console.log('Authentication response from Gatekeeper:\n');
    console.log(authResponse);

    // TODO: Maybe fork the repo and fetch contents and user info here,
    // to give GitHub some more time to process the fork before making a commit to it?

    // TODO: update userNameSpan with authenticated user's info and photo

    // Save the access token for later API calls!
    gitHubAccessToken = authResponse.token;

    // Hide the "loading" message when done authenticating user
    messageSection.classList.add('hidden');    
        
  }).catch(logAndDisplayError);

}

// When user clicks "submit" button, post to GitHub!
document.getElementById('submit').addEventListener('click', submitToGitHub);

function submitToGitHub() {
  // If user hasn't signed in first, notify user to do so before submitting notes!
  if (!gitHubAccessToken) {    
  	messageSection.innerHTML = "<p><strong>Please log in with GitHub first! Then you can submit your notes.</strong></p>";
  	return;	// Exit from this function, skipping the code below
  }

  // Get user input
  var userText = document.getElementById("userText").value;

  // Display loading message
  messageSection.innerHTML = "<p><em>...Loading...</em></p>";
  messageSection.classList.remove('hidden');

  // Step 2: Fork the base repo containing the shared notes
  postWithToken('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/forks', {}, gitHubAccessToken)
  .then(JSON.parse).then(function (forkResponse){
    console.log('GitHub response after forking the base repo:\n');
    console.log(forkResponse);

    // Save username and name of newly-forked repo
    userName = forkResponse.owner.login;
    userForkedRepoName = forkResponse.name;

    // Step 3: Get contents of the existing notes file    
    return get('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/contents/' + notesFileName);

  }).then(JSON.parse).then(function (contentsResponse){
    console.log('GitHub response after getting the file contents:\n');
    console.log(contentsResponse);

    // Save the SHA of the file
    notesFileSha = contentsResponse.sha;

    // Decode, save, and display the contents (slicing off last character to prevent encoding issues)
    var fileContents = window.atob(contentsResponse.content.slice(0, -1));
    
    // Append user input to existing file contents
    fileContents += userText + '\n';
    
    // Encode into base64 again
    fileContents = window.btoa(fileContents);
    
    // Step 4: Commit to the repo, appending user input to shared notes
    var updateFileData = {"path": notesFileName, "message": "Test updating file via GitHub API", "content": fileContents, "sha": notesFileSha};      
    return postWithToken('https://api.github.com/repos/' + userName + '/' + userForkedRepoName + '/contents/' + notesFileName, updateFileData, gitHubAccessToken, "PUT");
    
  }).then(JSON.parse).then(function (updateResponse){
    console.log('GitHub response after updating the file:\n');
    console.log(updateResponse);
    
    // Step 5: Create a new pull request
    var pullRequestData = {"title": pullRequestTitle, "body": pullRequestBody, "base": "master", "head": userName + ":master"};
    return postWithToken('https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/pulls', pullRequestData, gitHubAccessToken);

  }).then(JSON.parse).then(function (pullResponse){
    console.log('GitHub response after creating the pull request:\n');
    console.log(pullResponse);
    
    // If a new pull request was successfully created, save its public link
    if (pullResponse.html_url) {
      pullRequestLink = pullResponse.html_url;
    }

    // Step 6: Display success message with link to pull request
    messageSection.classList.remove('hidden');
  	messageSection.innerHTML = '<h1>Your notes have been submitted!</h1><p><a href="' + pullRequestLink + '">View your newly-created pull request here!</a> Once approved, your notes will appear in the <a href="https://github.com/LearnTeachCode">Show Notes</a></p>';    

    // TODO: Prevent "pull request already exists" error somehow!
    // ...Maybe check first if user has already created a PR?

  }).catch(logAndDisplayError); // Log error to console and display on the web page too

} // end of submitToGitHub function

function logAndDisplayError (errorMessage) {
	console.log(errorMessage);
  messageSection.classList.remove('hidden');
	messageSection.innerHTML = '<p><strong>' + errorMessage + '</strong></p>';
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

function getWithCustomHeader(url, customHeader) {
  return new Promise(function(succeed, fail) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    
    req.setRequestHeader('Accept', 'application/vnd.github.v3.html');

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
function postWithToken(url, postDataObject, accessToken, method) {
  return new Promise(function(succeed, fail) {
    var req = new XMLHttpRequest();    

    req.open(method || "POST", url, true);
    
    // Set header for POST, like sending form data
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    // Set header for GitHub auth
    req.setRequestHeader('Authorization', 'token ' + accessToken);

    req.addEventListener("load", function() {
      // NOTE: Exception for "A pull request already exists" 422 error!
      if (req.status < 400 || ( req.status == 422 && JSON.parse(req.responseText).errors[0].message.includes("A pull request already exists") ) ) {
        succeed(req.responseText);
      } else {
        fail(new Error("Request failed: " + req.statusText));
      }
    });
    req.addEventListener("error", function() {
      fail(new Error("Network error"));
    });      

    req.send(JSON.stringify(postDataObject));
  });
}
# git-notes
A small web app to let anyone easily append notes into a GitHub repo without needing to use Git or GitHub.

**Ideas for later features/workflow:**
- Let admins easily create a new notes file for each topic/meeting within the app.
- Allow all users to append to notes and view changes *in real time* with Firebase or WebSocket via server?
   - Temporarily save changes on server and/or in localStorage?
   - Should we make the forks/commits/PRs/merges upon each user contribution, or just make *one* commit at the end via the admin's GitHub account?

## Front-end stuff:
- Bare minimum: static web page with a log in with GitHub button, a text box to type in some notes, and button to save it
- Ideally: a nice Markdown editor/previewer, and more features to come!

## Back-end stuff:

1. Authenticate the user with GiHub

   Using https://github.com/prose/gatekeeper hosted on Heroku!

2. Fork the base repo containing the shared notes

   See API docs: https://developer.github.com/v3/repos/forks/#create-a-fork.
   
   **Important note:** "Forking a Repository happens asynchronously. Therefore, you may have to wait a short period before accessing the git objects." Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/forks -d ''
   ```
3. Get contents of an existing file

   See API docs: https://developer.github.com/v3/repos/contents/#get-contents
   
   Here's an example of requesting the raw contents of this file, testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' -H https://api.github.com/repos/LearnTeachCode/git-notes/contents/README.md
   ```
   
   Be sure to save the SHA of the file to use it in Step 4 below. **Note:** The file contents are encoded in Base64, so we can use the [`window.atob()` method](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob) in decode it (only available in IE 10+).

4. Commit to the repo to append user input to shared notes

   See API docs: https://developer.github.com/v3/repos/contents/#update-a-file
   
   After appending the user's input to the existing file contents and then encoding the final string in Base64 with the [`window.btoa()` method](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa), here's an example of updating a file: 
   
      ```
   curl -i -X PUT -H 'Authorization: token TOKEN-GOES-HERE' -H https://api.github.com/repos/LearnTeachCode/git-notes/contents/test.md -d '{"path": "test.md", "message": "Test updating file via GitHub API", "content": "IyBUaGlzIGlzIGEgdGVzdCEKCkFuZCBoZXJlIGlzIHNvbWUgdXNlciBpbnB1dCBhcHBlbmRlZCB0byB0aGUgcHJldmlvdXMgZmlsZSBjb250ZW50cy4K", "sha": "SHA-FROM-STEP-3-GOES-HERE"}'
   ```
   
   Be sure to save the SHA from GitHub's response after updating the file, because the new SHA is required to make any future updates to the file.
   
   **For reference:** here's an outline of how to make a Git commit *the hard way* with the low-level Git Data API: https://github.com/LearnTeachCode/git-notes/blob/master/git-commit-test-steps.md

5. Create the pull request

   See API docs: https://developer.github.com/v3/pulls/#create-a-pull-request.
   
   **Important note:** Pull requests also seem to happen asynchornously! Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/pulls -d '{"title": "Test PR!", "body": "test", "base": "master", "head": "LearningNerd:master"}'
   ```

6. Display success message with the link to the newly-created pull request!

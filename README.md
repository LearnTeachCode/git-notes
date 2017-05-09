# git-notes
A small web app to let anyone easily append notes into a GitHub repo without needing to use Git or GitHub.

**Next test (in progress):** Test using GitHub API to get contents of an existing file and *append* notes to it.

**Ideas for later features/workflow:***
- Let admins easily create a new notes file for each topic/meeting within the app.
- Allow all users to append to notes and view changes *in real time* with Firebase or WebSocket via server?
   - Temporarily save changed on server and/or in localStorage?
   - Should we make the forks/commits/PRs/merges upon each user contribution, or just make *one* commit at the end via the admin's GitHub account?

## Front-end stuff:
- Bare minimum: static web page with a log in with GitHub button, a text box to type in some notes, and button to save it
- Ideally: a nice Markdown editor/previewer, and more features to come!

## Back-end stuff:

1. Authenticate the user with GiHub

   Using https://github.com/prose/gatekeeper hosted on Heroku!

2. Fork the base repo containing the shared notes

   See API docs: https://developer.github.com/v3/repos/forks/#create-a-fork. **Important note:** "Forking a Repository happens asynchronously. Therefore, you may have to wait a short period before accessing the git objects." Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/forks -d ''
   ```
3. Get contents of an existing file

   See API docs: https://developer.github.com/v3/repos/contents/ Here's an example of requesting the raw contents of this file, testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' -H 'Accept: application/vnd.github.v3.raw' https://api.github.com/repos/LearnTeachCode/git-notes/contents/README.md
   ```

4. Commit to the repo using user input!

   See outline of steps to test in command line here: https://github.com/LearnTeachCode/git-notes/blob/master/git-commit-test-steps.md

5. Create the pull request

   See API docs: https://developer.github.com/v3/pulls/#create-a-pull-request. **Important note:** Pull requests also seem to happen asynchornously! Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/pulls -d '{"title": "Test PR!", "body": "test", "base": "master", "head": "LearningNerd:master"}'
   ```

6. Display success message with the link to the newly-created pull request!

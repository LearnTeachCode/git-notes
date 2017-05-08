# git-notes
A small web app to let anyone easily append notes into a GitHub repo without needing to use Git or GitHub

## Front-end stuff:
- Bare minimum: static web page with a log in with GitHub button, a text box to type in some notes, and button to save it
- Ideally: a nice Markdown editor/previewer, and more features to come!

## Back-end stuff:

1. Authenticate the user with GiHub

2. Fork the base repo containing the shared notes

   See API docs: https://developer.github.com/v3/repos/forks/#create-a-fork. **Important note:** "Forking a Repository happens asynchronously. Therefore, you may have to wait a short period before accessing the git objects." Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/forks -d ''
   ```

3. Commit to the repo using user input!

   See outline of steps to test in command line here: https://github.com/LearnTeachCode/git-notes/blob/master/git-commit-test-steps.md

   1. Get the SHA of the previous commit
   2. Get the tree of the previous commit   
   3. Create a new blob (file)
   4. Create new tree
   5. Make the commit
   6. Move the commit to the branch

4. Create the pull request

   See API docs: https://developer.github.com/v3/pulls/#create-a-pull-request. **Important note:** Pull requests also seem to happen asynchornously! Here's an example of testing this in cURL via command line:
   
   ```
   curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/pulls -d '{"title": "Test PR!", "body": "test", "base": "master", "head": "LearningNerd:master"}'
   ```

5. Display success message with the link to the newly-created pull request!

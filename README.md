# git-notes
A small web app to let anyone easily append notes into a GitHub repo without needing to use Git or GitHub

## Front-end stuff:
- Bare minimum: static web page with a log in with GitHub button, a text box to type in some notes, and button to save it
- Ideally: a nice Markdown editor/previewer, and more features to come!

## Back-end stuff:

1. Authenticate the user with GiHub

2. Fork the base repo containing the shared notes

3. Commit to the repo using user input!
   1. Get the SHA of the previous commit
   2. Get the tree of the previous commit
   3. Get the blob of the previous commit
   4. Create blob, appending user input to the previous content
   5. Create new tree
   6. Make the commit
   7. Move the commit to the branch (in this case just master)

4. Create the pull request
   * Title and body of the PR
   * Head branch in the form `username:branch`
   * Base branch
   * Set `mainter_can_modify` to true?

5. Display success message with the link to the newly-created pull request!

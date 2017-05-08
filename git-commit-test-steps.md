# Steps to Create a Git Commit with GitHub API

This is a walkthrough for how to make a Git commit using the GitHub API, testing the steps with cURL via the command line.

**Prerequisites:**
- A good tutorial to go through first is the official [GitHub API Getting Started Guide](https://developer.github.com/guides/getting-started/).
- For a better understanding of how Git works, read https://git-scm.com/book/en/v2/Git-Internals-Git-Objects

**Setup:**
- Make sure you have [cURL](https://curl.haxx.se/) installed; we'll be using it to make GET and POST requests to GitHub's API via the command line.
- [Create a GitHub personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) and choose the `repo` scope to make sure you have the permissions required to access your GitHub repositories through the API. Save the generated access token somewhere safe, and treat it like a password! Don't share it with anyone or publish it anywhere!
- When running the code snippets below, replace `TOKEN-GOES-HERE` with your new personal access token.

**Sources:**
- https://developer.github.com/v3/git/
- https://developer.github.com/v3/repos/
- http://www.nolim1t.co/2017/03/08/uploading-to-github-through-the-API.html
- https://mdswanson.com/blog/2011/07/23/digging-around-the-github-api-take-2.html

## 1. Get the SHA of the previous commit

**API Docs: https://developer.github.com/v3/git/refs/#get-a-reference**

To access the latest commit, get a reference to the HEAD of the desired branch by making a GET request to `/repos/:user/:repo/git/refs/heads/:branch`. For example:

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/refs/heads/master
```

GitHub will send a response containing some JSON data for the requested commit. Here's the important bit:

```
"object": {
    "sha": "d176c1442aa83adfbcf9746464fd4733bf1106d6",
    "type": "commit",
    "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/commits/d176c1442aa83adfbcf9746464fd4733bf1106d6"
  }
```

Save the SHA, because we'll need it later when we create our new commit in Step 5!

## 2. Get the tree of the previous commit

**API Docs: https://developer.github.com/v3/git/trees/#get-a-tree**

Using the SHA saved from Step 1, make a GET request to `/repos/:owner/:repo/git/trees/:sha`. For example:

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/commits/d176c1442aa83adfbcf9746464fd4733bf1106d6
```

GitHub will send a response with the data for the requested tree. (In Git, trees represent the hierarchy of files and folders. A tree contains references to files, called blobs, or sub-folders, called trees.) Looking at the response, here's the important part:

```
"tree": {
    "sha": "60eeced8d029c08d6ef8c3ac5ee806ac048b2aba",
    "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/trees/60eeced8d029c08d6ef8c3ac5ee806ac048b2aba"
  }
```

Save the SHA of this tree, because we'll need it for the next steps!

## 3. Create a new blob (file)

**API Docs: https://developer.github.com/v3/git/blobs/#create-a-blob**

In Git, files are stored in objects called blobs. Create a new blob by making a POST request to `/repos/:user/:repo/git/blobs` with a payload like this: `{"content": "# This is a test!", "encoding": "utf-8"}`.

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/blobs -d '{"content": "# This is a test!", "encoding": "utf-8"}'
```

After creating the new blob, GitHub's response will look like this:

```
{
  "sha": "6d24476b2db867038f550c22b68c664cd34d89b1",
  "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/blobs/6d24476b2db867038f550c22b68c664cd34d89b1"
}
```

Save the SHA of the new blob, because we'll need it for the next steps!

## 4. Create new tree

**API Docs: https://developer.github.com/v3/git/trees/#create-a-tree**

When creating a new tree, we need to specify the base tree to link it to and the contents of the new tree -- in this case, just a single file (the blob we created in Step 3), which we'll name `test.md`. Create a new tree by creating a POST request to `/repos/:user/:repo/git/trees/` with the following payload: `{"base_tree": "[SHA of the base tree saved from Step 2]", "tree": [{"path": "test.md", "mode": "100644", "type": "blob", "sha": "[SHA saved from Step 3]"}]"}`.

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/trees -d '{"base_tree": "60eeced8d029c08d6ef8c3ac5ee806ac048b2aba", "tree": [{"path": "test.md", "mode": "100644", "type": "blob", "sha": "6d24476b2db867038f550c22b68c664cd34d89b1"}]"}'
```

After creating the new tree, GitHub's response will show the contents of the new tree, along with the SHA and URL for our newly-created tree:

```
{
  "sha": "13f7216098033199493d9bc08b141922d3d46985",
  "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/trees216098033199493d9bc08b141922d3d46985",
  "tree": [
    {
      "path": "README.md",
      "mode": "100644",
      "type": "blob",
      "sha": "685fb0bc26ba6f39bfb67e4e46726678f2108954",
      "size": 1016,
      "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/b685fb0bc26ba6f39bfb67e4e46726678f2108954"
    },
    {
      "path": "test.md",
      "mode": "100644",
      "type": "blob",
      "sha": "6d24476b2db867038f550c22b68c664cd34d89b1",
      "size": 17,
      "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/b6d24476b2db867038f550c22b68c664cd34d89b1"
    }
  ],
  "truncated": false
}
```
Save the SHA of the new tree, because -- you guessed it! -- we'll need this for the next step! 

## 5. Make the commit

**API Docs: https://developer.github.com/v3/git/commits/#create-a-commit**

Now we can finally make a commit! To create the new commit, make a POST request to `/repos/:user/:repo/git/commits` with the payload `{"parents": ["[SHA of the previous commit saved from Step 1]"], "tree": "[SHA of the new tree saved from Step 4]", "message": "Testing remote commit via GitHub API"}`.

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/commits -d '{"parents": ["d176c1442aa83adfbcf9746464fd4733bf1106d6"], "tree": "13f7216098033199493d9bc08b141922d3d46985", "message": "Testing remote commit via GitHub API"}'
```

 After creating the new commit, GitHub's response will show data about the commit and its author (you!), but the only piece we need is the SHA: 
 
 ```
 {
  "sha": "59fd06d961f2d65423aaab59139babcb4413486f",
  "url": "https://api.github.com/repos/LearnTeachCode/git-notes/git/commits/59fd06d961f2d65423aaab59139babcb4413486f",
  "html_url": "https://github.com/LearnTeachCode/git-notes/commit/59fd06d961f2d65423aaab59139babcb4413486f",  
  // ...OTHER DATA HERE...
}

 ```
 
 So once again, save the SHA of the newly-created commit, because we'll need it for our last step!

## 6. Move the commit to the branch

**API Docs: https://developer.github.com/v3/git/refs/#update-a-reference**

For our last step, we'll update the HEAD reference, pointing it to the new commit by making a PATCH or POST request to `/repos/:user/:repo/git/refs/heads/:branch` with the payload `{"sha": "[SHA of the new commit saved from Step 5]"}`. It might be neccessary to set `force` to `true`, as in `{"sha": "[SHA of the new commit saved from Step 5]", "force": true}`. In this case, we're updating the `master` branch:

```
curl -i -H 'Authorization: token TOKEN-GOES-HERE' https://api.github.com/repos/LearnTeachCode/git-notes/git/refs/heads/master -d '{"sha": "59fd06d961f2d65423aaab59139babcb4413486f"}'
```

Congrats! To check that it worked as expected, take a look at the GitHub homepage for the project and check the updates for the latest commit. 

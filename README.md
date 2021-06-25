### Simple bump version action 
This is very simple action that lets you bump version based on commit history. It'll go through commits and find the one, where version was altered in package.json last time, and then parse each subsequent commit message and bump version accordingly. The new version will be written to package.json, and a new commit will be pushed.  
Note that for the action to work a provided github token should have writing permissions.

To bump minor or major version - specify major and minor tokes in workflow file. Patch version is bumped automatically, if no minor or major version is changed. Words a case-insentitive, might be a single one or a list (e.g. 'add, minor, thirdword'). 

For tagging a tagging policy is required. It can be 'major', 'minor' or 'all', based on how much the aversion should be changed to trigger tagging. Note that major version change is included in 'minor'. Tagging happens once, for the bump commit.  

There is also an option to squash new version commit with a previous one, but that's a bit tricky, since a resulting commit will be authored byt the action. One can always pull and squash manually, if desired. 
### Example usage
See .github/workflows/test.yml for example

### Some issues to solve
1. With more that 10 commits in history only older commits are shown sometimes. I didn't find a solution yet, nor know the cause of it.



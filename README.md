### Simple bump version action 
Very simple action that lets you bump version based on commit history. It'll go through commits and find the one, where version was altered in package.json, and then parse each subsequent commit message and bump version accordingly. Then neew version will be written to package.json, and a new commit will be pushed.  
Note that for action to work a provided github token whould have writing permissions.   

To bump minor or major version - specify major and minor tokes in workflow file. Patch version is bumped automatically, if no minor or major version is changed. 
### Example usage
See .github/workflows/test.yml for example

### Some issues to solve
With more that 10 commits in history only older commits are shown sometimes. I didn't find a solution yet. 


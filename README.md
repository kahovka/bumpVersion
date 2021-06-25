### Simple bump version action 
Very simple action that lets you bump version based on commit history. It'll go through commits and find the one, where version was altered in package.json, and then parse each subsequent commit message and bump version accordingly. The new version will be written to package.json, and a new commit will be pushed.  
Note that for action to work a provided github token whould have writing permissions.

To bump minor or major version - specify major and minor tokes in workflow file. Patch version is bumped automatically, if no minor or major version is changed. 

For tagging a tagging policy is required. It can be upon major, minor or all, based on how much of a version is changed. Note, that major version change is included in minor. Tagging happens once, for the bump commit.   
  
This action came to serve my team's workflow, when main branch is protected, and each feature is developed in several commits and rebased before mering, and default merge strategy is 'squash and merge'. 
### Example usage
See .github/workflows/test.yml for example

### Some issues to solve
1. With more that 10 commits in history only older commits are shown sometimes. I didn't find a solution yet, nor know the cause of it.



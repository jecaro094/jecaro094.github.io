---
name: deploy
description: Propose a tag version, create it on main, and push it to the remote repository.
---

# deploy

Automates the tagging and push workflow for releases.

## When to use it

- The user wants to create a new release tag.
- The user says "deploy", "tag release", "create version tag", or "push a new version".

## Workflow

1. **Detect current version**: Run `git tag --sort=-v:refname | head -1` to get the latest tag.
2. **Propose next version**: Increment the patch number by default (e.g., `v1.0.0` → `v1.0.1`). Ask the user if this version is fine.
3. **User confirmation**:
   - If the user says **yes**, proceed with the proposed version.
   - If the user says **no**, ask them to enter the desired tag name.
4. **Create the tag**: Run `git tag <version>` on the current branch (assumed to be main).
5. **Push the tag**: Run `git push origin <version>`.
6. **Confirm**: Report that the tag has been pushed successfully.

## Rules

- Never force-create a tag that already exists.
- Always confirm with the user before creating the tag.
- The branch must be clean (no uncommitted changes) before tagging; warn the user if there are pending changes.

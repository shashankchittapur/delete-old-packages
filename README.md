# Group integration tests action

This action will parse the integration test suites and group them based on @GroupInCI annotation.
Each group of suites are run in a separate runner concurrently using matrix strategy.

## Inputs

### `org-name`

**Required** Organization name.

### `token`

**Required** Github personal access token.

### `repo-name`

**Required** Repository name.

### `package-type`

**Required** Package type - maven | npm | docker | container.

## Example usage

```yaml
uses: shashank/delete-old-packages@v1.0
with:
  org-name: 'Solibri'
  token: ${GITHUB.token}
  reprepo-name: 'dektop-main'
  package-type: 'maven'
```
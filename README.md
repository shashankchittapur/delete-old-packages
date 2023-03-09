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

### `dry-run`

**Required** Dry run to check what packages are getting deleted ( true|false)

## Outputs

### `packages-deleted`

Package names and version ids deleted in the run. This is set only when dry run is false

### `packages-not-deleted`

Package names and version ids not deleted in the run due to some exception. This is set only when dry run is false

### `packages-to-delete`
Package names and version ids that will be deleted in dry run. This is set only when dry run is true

## Example usage

```yaml
uses: shashankchittapur/delete-old-packages@v1.0
with:
  org-name: 'Solibri'
  token: ${GITHUB.token}
  reprepo-name: 'dektop-main'
  package-type: 'maven'
  dry-run: 'true'
```
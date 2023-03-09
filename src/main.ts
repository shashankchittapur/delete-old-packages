/* eslint-disable prettier/prettier */
import * as core from '@actions/core'
import { listPackageNamesForRepo } from './listpackages'

export interface Inputs {
  orgName: string
  token: string
  repoName: string
  packageType: string
}

async function run(): Promise<void> {
  try {
    const inputs: Inputs = {
      orgName: core.getInput("org-name"),
      token: core.getInput("token"),
      repoName: core.getInput("repo-name"),
      packageType: core.getInput("package-type")
    }
    core.debug(`Input:${inputs}`)
    const packagesAndVersions = await listPackageNamesForRepo(inputs)


    for (const packageName of packagesAndVersions.keys()) {
      const versionCommaSeparated = packagesAndVersions.get(packageName)
      core.debug(`Package Name: ${packageName} With Versions: ${versionCommaSeparated}`)
    }

  } catch (error) {
    if (error instanceof Error) {
      core.debug(error.message)
      core.setFailed(error.message)
    }
  }
}

run()

/* eslint-disable sort-imports */
/* eslint-disable prettier/prettier */
import * as core from '@actions/core'
import { listPackageNamesForRepo, deletePackages, PackageInfo } from './listpackages'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'


export type PackageType =
  RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['package_type']
export interface Inputs {
  orgName: string
  token: string
  repoName: string
  packageType: PackageType
  dryrun: string
  days: Number
}

async function run(): Promise<void> {
  try {
    const inputs: Inputs = {
      orgName: core.getInput("org-name"),
      token: core.getInput("token"),
      repoName: core.getInput("repo-name"),
      packageType: core.getInput("package-type") as PackageType,
      dryrun: core.getInput("dry-run"),
      days: Number(core.getInput("days-old"))
    }
    core.debug(`Input:${inputs}`)
    const packagesAndVersions = await listPackageNamesForRepo(inputs)
    if (inputs.dryrun === "true") {
      core.setOutput("packages-to-delete", packagesAndVersions)
    } else {
      if (packagesAndVersions.size > 0) {
        const packageInfo: PackageInfo = await deletePackages(packagesAndVersions, inputs)
        core.info(`Total number of packages deleted ${packageInfo.packagesDeleted.size}`)
        core.info(`Total number of packages not deleted ${packageInfo.packagesNotDeleted.size}`)
        core.setOutput("packages-deleted", packageInfo.packagesDeleted)
        core.setOutput("packages-not-deleted", packageInfo.packagesNotDeleted)
      } else {
        core.info(`There are no packages to delete`)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.debug(error.message)
      core.setFailed(error.message)
    }
  }
}

run()

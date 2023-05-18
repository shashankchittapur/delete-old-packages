/* eslint-disable prettier/prettier */
import * as github from '@actions/github'
import { Inputs } from './main'
// eslint-disable-next-line sort-imports
import * as core from '@actions/core'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'

export interface PackageInfo {
    packagesDeleted: Map<string, number[]>
    packagesNotDeleted: Map<string, number[]>
}
export async function listPackageNamesForRepo(inputs: Inputs): Promise<Map<string, number[]>> {
    core.debug('Listing packages started')
    const packageAndVersions: Map<string, number[]> = new Map<string, number[]>()
    const octakit = github.getOctokit(inputs.token)

    type Visibility =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['visibility']

    const package_type = inputs.packageType

    const visibility: Visibility = "private" as Visibility

    const parameters = {
        org: inputs.orgName,
        package_type,
        visibility
    }

    const packages = await octakit.paginate(
        octakit.rest.packages.listPackagesForOrganization, parameters
    )
    core.debug(`Number of packages:${packages.length}`)
    const packageNames = packages.map(pkg => pkg.name)

    for (const pkg of packageNames) {
        core.debug(`Listing versions for Package:${pkg}`)
        const params = {
            org: inputs.orgName,
            package_type,
            package_name: pkg

        }
        const versions = await octakit.paginate(
            octakit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
            params
        )
        core.debug(`Versions count for package ${pkg} is ${versions.length}`)
        const snapShortVersions = versions
            .filter(version => version.name.includes("SNAPSHOT") && version.name.includes("PR"))
            .filter(version => {
                const diff = Math.abs(new Date(version.created_at).getTime() - new Date().getTime())
                const diffInDays = Math.ceil(diff / (1000 * 3600 * 24))
                return diffInDays > inputs.days
            })
            .map(version => version.id)

        core.debug(`Package Name: ${pkg} Versions:${snapShortVersions}`)
        packageAndVersions.set(pkg, snapShortVersions)
    }
    core.debug(`Package And version Map ${packageAndVersions} With keys length ${packageAndVersions.size}`)
    return packageAndVersions
}

export async function deletePackages(packageNameAndVersionsMap: Map<string, number[]>, inputs: Inputs): Promise<PackageInfo> {


    const octakit = github.getOctokit(inputs.token)
    const packagesDeleted: Map<string, number[]> = new Map<string, number[]>()
    const packagesNotDeleted: Map<string, number[]> = new Map<string, number[]>()
    for (const packageName of packageNameAndVersionsMap.keys()) {
        const versions = packageNameAndVersionsMap.get(packageName)
        const deletedVersions: number[] = []
        const nonDeletedVersions: number[] = []
        core.info(`Package ${packageName} Versions ${versions} are ready to delete`)
        if (versions) {
            if (Array.isArray(versions) && versions.length > 1) {
                for (const version of versions) {
                    const params = {
                        package_name: packageName,
                        org: inputs.orgName,
                        package_version_id: version,
                        package_type: inputs.packageType
                    }
                    core.info(`Deleting package ${packageName} with version ${version}`)
                    const response = await octakit.rest.packages.deletePackageVersionForOrg(params)
                    if (response && response.status === 204) {
                        core.debug(`Package ${packageName} with version ${version} deleted`)
                        deletedVersions.push(version)
                    } else {
                        core.debug(`Package ${packageName} with version ${version} not deleted`)
                        nonDeletedVersions.push(version)
                    }
                }
            }
        }
        if (deletedVersions.length > 0) packagesDeleted.set(packageName, deletedVersions)
        if (nonDeletedVersions.length > 0) packagesNotDeleted.set(packageName, nonDeletedVersions)
    }
    const packagesInfo: PackageInfo = {
        packagesDeleted,
        packagesNotDeleted
    }

    return packagesInfo
}
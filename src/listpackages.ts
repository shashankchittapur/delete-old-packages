/* eslint-disable prettier/prettier */
/* eslint-disable sort-imports */
import github from '@actions/github'
import { Inputs } from './main'
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'


export async function listPackageNamesForRepo(inputs: Inputs): Promise<Map<string, string>> {

    const octakit = github.getOctokit(inputs.token)
    type PackageType =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['package_type']

    type Visibility =
        RestEndpointMethodTypes['packages']['listPackagesForOrganization']['parameters']['visibility']

    const package_type: PackageType = inputs.packageType as PackageType

    const visibility: Visibility = "private" as Visibility

    const parameters = {
        org: inputs.orgName,
        package_type,
        visibility
    }

    const packages = await octakit.paginate(
        octakit.rest.packages.listPackagesForOrganization, parameters
    )


    const packageAndVersions: Map<string, string> = new Map<string, string>()

    const packageNames = packages.filter(pkg => pkg.repository?.name === inputs.repoName)
        .map(pkg => pkg.name)

    for (const pkg of packageNames) {
        const params = {
            org: inputs.orgName,
            package_type,
            package_name: pkg

        }
        const versions = await octakit.paginate(
            octakit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg,
            params
        )

        const snapShortVersions = versions
            .filter(version => version.name.includes("PR") && version.name.includes("SNAPSHOT"))
            .map(version => version.id)
            .join(",")

        packageAndVersions.set(pkg, snapShortVersions)
    }

    return packageAndVersions
}
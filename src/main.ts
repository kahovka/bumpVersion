import * as core from '@actions/core'
import { exec } from '@actions/exec'
import * as fs from 'fs'
import path from 'path'
import { getLineNo, readVersion } from './utils'
import * as semver from 'semver'

async function run(): Promise<void> {
  try {
    const packagePath: string = core.getInput('packagepath', { required: true })

    const majorTokens: string[] = core
      .getInput('majortokens', {
        required: false
      })
      .split(',')
      .filter(token => token)
      .map(token => token.trim().toLowerCase())
    const minorTokens: string[] = core
      .getInput('minortokens', {
        required: false
      })
      .split(',')
      .filter(token => token)
      .map(token => token.trim().toLowerCase())

    const tagPolicy: string = core
      .getInput('tagpolicy', { required: false })
      .toLowerCase()

    const squash = Boolean(
      JSON.parse(core.getInput('squash', { required: false }))
    )

    const packageContent = fs.readFileSync(
      path.resolve(__dirname, '../', packagePath),
      'utf-8'
    )
    const version = readVersion(packageContent)
    const lineNo = getLineNo(packageContent)

    let myOutput = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          myOutput = data.toString()
        }
      },
      silent: true
    }
    await exec(
      'git',
      [
        'log',
        `-L${lineNo},${lineNo}:${path.resolve(__dirname, '../', packagePath)}`
      ],
      options
    )
    const lastChangeHash = myOutput.split(/[\r?\n\s]/)[1]
    console.log(
      `Last change commit hash: ${lastChangeHash}, version: ${version}`
    )
    // needs to reset output every time
    myOutput = ''
    await exec(
      'git',
      ['log', `${lastChangeHash}..HEAD`, `--format=oneline`],
      options
    )
    let newVersion = version
    if (myOutput) {
      console.log('Will bump version')
      const commitsToParse = myOutput.split(/\r?\n/)
      for (const commit of Object.values(commitsToParse).reverse()) {
        // there are sometimes empty lines
        if (commit) {
          const message = commit.split(/\s(.*)/)[1].toLowerCase()
          if (
            majorTokens.length > 0 &&
            majorTokens.some(token => message.includes(token))
          ) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            newVersion = semver.inc(newVersion, 'major')!
          } else if (
            minorTokens.length > 0 &&
            minorTokens.some(token => message.includes(token))
          ) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            newVersion = semver.inc(newVersion, 'minor')!
          } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            newVersion = semver.inc(newVersion, 'patch')!
          }
          console.log(`Commit: ${commit} new Version: ${newVersion}`)
        }
      }
      const newPackageContent = packageContent.replace(
        `"version": "${version}"`,
        `"version": "${newVersion}"`
      )

      fs.writeFileSync(
        path.resolve(__dirname, '../', packagePath),
        newPackageContent
      )
      await exec('git', [
        'config',
        'user.name',
        `"${process.env.GITHUB_USER || 'Automated Version Bump'}"`
      ])
      await exec('git', [
        'config',
        'user.email',
        `"${
          process.env.GITHUB_EMAIL || 'bump-version@users.noreply.github.com'
        }"`
      ])
      await exec('git', ['commit', '-am', 'Bump version'])
      await exec('git', ['push'])

      console.log('Pushed new version file')

      // squash
      if (squash) {
        await exec('git', ['reset', '--soft', 'HEAD~2'])
        myOutput = ''
        await exec('git', ['log', '--format=%B', '--reverse, HEAD..HEAD@{2}'])
        await exec('git', ['commit', `-m "${myOutput}"`])
        await exec('git', ['push', '-f'])

        console.log('Squashed last two commits')
      }
    } else {
      console.log('No changes applied')
    }

    // tagging
    if (tagPolicy) {
      console.log('Tag policy found, will check for tagging')
      const versionDiff = semver.diff(version, newVersion)
      if (
        (tagPolicy === 'major' && versionDiff === 'major') ||
        (tagPolicy === 'minor' &&
          (versionDiff === 'minor' || versionDiff === 'major')) ||
        tagPolicy === 'all'
      ) {
        await exec('git', ['tag', `${newVersion}`])
        await exec('git', ['push', 'origin', '--tags'])
        console.log('Added new tag')
      } else {
        console.log('Skipping tagging')
      }
    }
  } catch (error) {
    console.log(error)
  }
}

run()

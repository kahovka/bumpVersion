import * as core from '@actions/core'
import { exec } from '@actions/exec'
import * as fs from 'fs'
import path from 'path'
import { getLineNo, readVersion } from './utils'
import * as semver from 'semver'

async function run(): Promise<void> {
  const githubToken: string = core.getInput('githubtoken', { required: true })
  const packagePath: string = core.getInput('packagepath', { required: true })

  const majorTokens: string[] = core
    .getInput('majortokens', {
      required: false
    })
    .split(',')
    .map(token => token.trim().toLowerCase())
  const minorTokens: string[] = core
    .getInput('minortokens', {
      required: false
    })
    .split(',')
    .map(token => token.trim().toLowerCase())

  core.debug(`Major: ${majorTokens}`)
  core.debug(`Minor: ${minorTokens}`)
  const packageContent = fs.readFileSync(
    path.resolve(__dirname, '../', packagePath),
    'utf-8'
  )
  const version = readVersion(packageContent)
  const lineNo = getLineNo(packageContent)
  core.debug(`Token starts with: ${githubToken.slice(0, 2)}`)
  core.debug(` Version: ${version}, line number ${lineNo}`)
  let myOutput = ''
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        myOutput = data.toString()
      }
    }
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
  core.debug(lastChangeHash)

  // needs to reset output every time
  myOutput = ''
  await exec(
    'git',
    ['log', `${lastChangeHash}..HEAD`, `--format=oneline`],
    options
  )

  let newVersion = version
  if (myOutput) {
    core.debug('Will bump version')
    const commitsToParse = myOutput.split(/\r?\n/)
    for (const commit of Object.values(commitsToParse).reverse()) {
      // there are sometimes empty lines
      if (commit) {
        const message = commit.split(/\s(.*)/)[1].toLowerCase()
        core.debug(`Message: ${message}`)
        if (majorTokens && majorTokens.some(token => message.includes(token))) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newVersion = semver.inc(newVersion, 'major')!
        } else if (
          minorTokens &&
          minorTokens.some(token => message.includes(token))
        ) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newVersion = semver.inc(newVersion, 'minor')!
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          newVersion = semver.inc(newVersion, 'patch')!
        }
      }
    }
    core.debug(newVersion)
    const newPackageContent = packageContent.replace(
      `"version": "${version}"`,
      `"version": "${newVersion}"`
    )

    fs.writeFileSync(
      path.resolve(__dirname, '../', packagePath),
      newPackageContent
    )
    core.debug('Updated package.json')
    await exec('git', [
      'config',
      'user.name',
      `"${process.env.GITHUB_USER || 'Automated Version Bump'}"`
    ])
    await exec('git', [
      'config',
      'user.email',
      `"${process.env.GITHUB_EMAIL || 'bump-version@users.noreply.github.com'}"`
    ])
    await exec('git', ['commit', '-am', 'Bump version'])
    await exec('git', ['push'])
    core.debug('Pushed new version file')
  } else {
    core.debug('No changes applied')
  }
}

run()

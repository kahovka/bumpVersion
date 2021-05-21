import * as core from '@actions/core'
import { exec } from '@actions/exec'
import * as fs from 'fs'
import path from 'path'
import { getLineNo, readVersion } from './utils'
import * as semver from 'semver'

async function run(): Promise<void> {
  const githubToken: string = core.getInput('githubtoken', { required: true })
  const packagePath: string = core.getInput('packagepath', { required: true })
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
  await exec(
    'git',
    ['log', `${lastChangeHash}..HEAD`, `--format=oneline`],
    options
  )
  const commitsToParse = myOutput.split(/\r?\n/)

  let newVersion = version
  for (const commit of commitsToParse.reverse()) {
    const message = commit.split(/\s(.*)/)[1]
    // there are sometimes empty lines
    if (message) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      newVersion = semver.inc(newVersion, 'patch')!
      core.debug(message)
      core.debug(newVersion)
    }
  }
}

run()

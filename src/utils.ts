import * as semver from 'semver'

export function readVersion(fileContent: string): string {
  const version = JSON.parse(fileContent).version
  if (semver.valid(semver.coerce(version))) {
    return version
  } else {
    throw new Error(`Could not find a valid version`)
  }
}

export function getLineNo(fileContent: string): number {
  const lineNo = fileContent
    .split(/\r?\n/)
    .findIndex(line => line.includes('"version":'))
  return lineNo + 1
}

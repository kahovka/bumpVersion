import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { getLineNo, readVersion } from '../src/utils'


test('reads version from file', () => {
  // use project package.json copy
  const sampleContent = fs.readFileSync(path.resolve(__dirname, 'test-package.json'), 'utf-8')
  const version = readVersion(sampleContent)
  expect(version).toEqual('1.2.3')
})

test('throws an error if no version in file', () => {
  const sampleContent = fs.readFileSync(path.resolve(__dirname, 'test-package-nover.json'), 'utf-8')
  expect( function(){ readVersion(sampleContent); } ).toThrow(new Error(`Could not find a valid version`));
})

test('gets a line number', () => {
  const sampleContent = fs.readFileSync(path.resolve(__dirname, 'test-package.json'), 'utf-8')
  const lineNo = getLineNo(sampleContent)
  expect(lineNo).toEqual(3)
})
// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_GITHUBTOKEN'] = '123'
  process.env['INPUT_PACKAGEPATH'] = 'package.json'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  try {
    console.log(cp.execFileSync(np, [ip], options).toString())
 } catch (error) {
    console.log(`Status Code: ${error.status} with '${error.stdout}'`)
    expect(true).toBeFalsy()
 }
})

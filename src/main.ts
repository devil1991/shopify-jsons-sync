import * as core from '@actions/core'
import {
  EXEC_OPTIONS,
  cleanRemoteFiles,
  getNewTemplatesToRemote,
  sendFilesWithPathToShopify,
  syncLocaleAndSettingsJSON
} from './utils'
import {exec} from '@actions/exec'
import {debug} from '@actions/core'

async function run(): Promise<void> {
  try {
    const targetThemeId: string = core.getInput('theme')
    const store: string = core.getInput('store')
    const workingDirectory: string = core.getInput('working-directory', {
      trimWhitespace: true
    })

    if (!!workingDirectory && workingDirectory !== '') {
      debug(`Changing working directory to ${workingDirectory}`)
      process.chdir(workingDirectory)
    }

    await cleanRemoteFiles()
    await exec(
      `shopify theme pull --only config/*_data.json --only templates/**/*.json --only locales/*.json --live --path remote --store ${store} --verbose`,
      [],
      EXEC_OPTIONS
    )

    const localeFilesToPush = await syncLocaleAndSettingsJSON()
    const newTemplatesToPush = await getNewTemplatesToRemote()
    await sendFilesWithPathToShopify(
      [...localeFilesToPush, ...newTemplatesToPush],
      {
        targetThemeId,
        store
      }
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    await cleanRemoteFiles()
  }
}

run()

import * as core from '@actions/core'
import {
  EXEC_OPTIONS,
  cleanRemoteFiles,
  getNewTemplatesToRemote,
  sendFilesWithPathToShopify,
  syncLocaleAndSettingsJSON
} from './utils'
import {exec} from '@actions/exec'

async function run(): Promise<void> {
  try {
    const targetThemeId: string = core.getInput('theme_id')
    const store: string = core.getInput('store')
    const password: string = core.getInput('theme_cli_token')

    await cleanRemoteFiles()
    await exec(
      `shopify theme pull --only config/*_data.json --only templates/*.json --only locales/*.json --live --path remote --store ${store} --password ${password} --verbose`,
      [],
      EXEC_OPTIONS
    )

    const localeFilesToPush = await syncLocaleAndSettingsJSON()
    const newTemplatesToPush = await getNewTemplatesToRemote()
    await sendFilesWithPathToShopify(
      [...localeFilesToPush, ...newTemplatesToPush],
      {
        targetThemeId,
        store,
        password
      }
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  } finally {
    await cleanRemoteFiles()
  }
}

run()

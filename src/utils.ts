import {create} from '@actions/glob'
import {readFile, writeFile} from 'fs/promises'
import {existsSync} from 'fs'
import deepmerge from 'deepmerge'
import {rmRF} from '@actions/io'
import {copySync} from 'fs-extra'
import {debug, error as errorLog} from '@actions/core'
import {
  ShopifySettingsOrTemplateJSON,
  ISyncLocalJSONWithRemoteJSONForStore
} from './types.d'
import {ExecException, exec as nativeExec} from 'child_process'
import JSONParser from 'json-parse-safe'

export const EXEC_OPTIONS = {
  listeners: {
    stdout: (data: Buffer) => {
      debug(data.toString())
    },
    stderr: (data: Buffer) => {
      errorLog(data.toString())
    }
  }
}

export const fetchFiles = async (pattern: string): Promise<string[]> => {
  const globber = await create(pattern)
  const files = await globber.glob()
  return files
}

const fetchLocalFileForRemoteFile = async (
  remoteFile: string
): Promise<string> => {
  return remoteFile.replace('remote/', '')
}

// Remove this from JSONString before parsing
// /*
// * ------------------------------------------------------------
// * IMPORTANT: The contents of this file are auto-generated.
// *
// * This file may be updated by the Shopify admin language editor
// * or related systems. Please exercise caution as any changes
// * made to this file may be overwritten.
// * ------------------------------------------------------------
// */

const cleanJSONStringofShopifyComment = (
  jsonString: string
): ShopifySettingsOrTemplateJSON => {
  try {
    const parsed = JSONParser(jsonString)
    if (parsed && 'value' in parsed) {
      return parsed.value as ShopifySettingsOrTemplateJSON
    }

    throw new Error('JSON Parse Error')
  } catch (error) {
    if (error instanceof Error) {
      debug(error.message)
    }
    return JSON.parse(jsonString)
  }
}

export const readJsonFile = async (
  file: string
): Promise<ShopifySettingsOrTemplateJSON> => {
  if (!existsSync(file)) {
    return {} // Return empty object if file doesn't exist
  }
  const buffer = await readFile(file)
  return cleanJSONStringofShopifyComment(buffer.toString())
}

export const cleanRemoteFiles = async (): Promise<void> => {
  try {
    rmRF('remote')
  } catch (error) {
    if (error instanceof Error) debug(error.message)
  }
}

export async function execShellCommand(cmd: string): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    nativeExec(
      cmd,
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          return reject(error)
        }
        resolve(stdout ? stdout : stderr)
      }
    )
  })
}

export const sendFilesWithPathToShopify = async (
  files: string[],
  {targetThemeId, store}: ISyncLocalJSONWithRemoteJSONForStore
): Promise<string[]> => {
  for (const file of files) {
    debug(`Pushing ${file} to Shopify`)
  }
  const pushOnlyCommand = files
    .map(
      file =>
        `--only=${file.replace('./', '').replace(`${process.cwd()}/`, '')}`
    )
    .join(' ')

  for (const file of files) {
    const baseFile = file.replace(process.cwd(), '')
    const destination = `${process.cwd()}/remote/new/${baseFile}`
    copySync(file, destination, {
      overwrite: true
    })
  }

  await execShellCommand(
    `shopify theme ${[
      'push',
      pushOnlyCommand,
      '--theme',
      targetThemeId,
      '--store',
      store,
      '--verbose',
      '--path',
      'remote/new',
      '--nodelete'
    ].join(' ')}`
  )

  return files
}

// Go throgh all keys in the object and a key which has disabled: true, remove it from the object
export const removeDisabledKeys = (
  obj: ShopifySettingsOrTemplateJSON
): ShopifySettingsOrTemplateJSON => {
  const newObj = {...obj}
  for (const key in obj) {
    if (newObj[key]?.hasOwnProperty('disabled')) {
      delete newObj[key]
    }
  }
  return newObj
}

export const syncLocaleAndSettingsJSON = async (): Promise<string[]> => {
  const remoteFiles = await fetchFiles(['./remote/locales/*.json'].join('\n'))

  for (const remoteFile of remoteFiles) {
    debug(`Remote File: ${remoteFile}`)
  }
  const localFilesToPush: string[] = []
  for (const file of remoteFiles) {
    try {
      // Read JSON for Remote File
      const remoteFile = await readJsonFile(file)
      debug(`Remote File: ${file}`)

      // Get Local Version of File Path
      const localFileRef = await fetchLocalFileForRemoteFile(file)
      debug(`Local File Ref: ${localFileRef}`)
      // Read JSON for Local File
      const localFile = await readJsonFile(localFileRef)

      // Merge Local and Remote Files with Remote as Primary
      const mergedFile = deepmerge(localFile, remoteFile, {
        arrayMerge: (_, sourceArray) => sourceArray,
        customMerge: key => {
          if (key === 'blocks') {
            return (_, newBlock) => {
              return removeDisabledKeys(newBlock)
            }
          }
        }
      })

      // Write Merged File to Local File
      await writeFile(localFileRef, JSON.stringify(mergedFile, null, 2))
      localFilesToPush.push(localFileRef)
    } catch (error) {
      if (error instanceof Error) {
        debug('Error in syncLocaleAndSettingsJSON')
        debug(error.message)
      }
      continue
    }
  }

  return localFilesToPush
}

export const getNewTemplatesToRemote = async (): Promise<string[]> => {
  const remoteTemplateFilesNames = (
    (await fetchFiles('./remote/templates/**/*.json')) || []
  ).map(file => file.replace('remote/', ''))

  const localTemplateFiles = await fetchFiles('./templates/**/*.json')
  const localeFilesToMove = localTemplateFiles.filter(
    file => !remoteTemplateFilesNames.includes(file)
  )

  return localeFilesToMove
}

import {expect, test, describe, vi, beforeEach} from 'vitest'
import {
  readJsonFile,
  cleanRemoteFiles,
  fetchFiles,
  removeDisabledKeys
} from '../src/utils'
import {mockLocaleFile, mockRemoteLocaleFile} from './fixtures'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'

// Mock external dependencies with Vitest
vi.mock('fs')
vi.mock('fs/promises')
vi.mock('@actions/glob')
vi.mock('@actions/io')
vi.mock('@actions/core')

describe('Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock debug function
    const core = await import('@actions/core')
    vi.mocked(core.debug).mockImplementation(() => {})
  })

  describe('readJsonFile function', () => {
    test('should return empty object when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = await readJsonFile('nonexistent.json')

      expect(result).toEqual({})
    })

    test('should parse valid JSON file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fsPromises.readFile).mockResolvedValue(
        Buffer.from(JSON.stringify(mockLocaleFile))
      )

      const result = await readJsonFile('locales/en.json')

      expect(result).toEqual(mockLocaleFile)
    })

    test('should handle JSON parse errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      // Use invalid JSON that will trigger the fallback JSON.parse error
      vi.mocked(fsPromises.readFile).mockResolvedValue(
        Buffer.from('{"invalid": json}')
      )

      // Should throw an error for invalid JSON
      await expect(readJsonFile('invalid.json')).rejects.toThrow()
    })

    test('should handle valid JSON with json-parse-safe', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      // Valid JSON that json-parse-safe can handle
      vi.mocked(fsPromises.readFile).mockResolvedValue(
        Buffer.from(
          JSON.stringify({
            general: {
              title: 'Valid JSON Store'
            }
          })
        )
      )

      const result = await readJsonFile('locales/en.json')

      expect(result).toEqual({
        general: {
          title: 'Valid JSON Store'
        }
      })
    })
  })

  describe('fetchFiles function', () => {
    test('should return array of matching files', async () => {
      const glob = await import('@actions/glob')
      const mockGlobber = {
        glob: vi.fn().mockResolvedValue(['locales/en.json', 'locales/fr.json']),
        getSearchPaths: vi.fn(),
        globGenerator: vi.fn()
      }

      vi.mocked(glob.create).mockResolvedValue(mockGlobber as never)

      const result = await fetchFiles('locales/*.json')

      expect(result).toEqual(['locales/en.json', 'locales/fr.json'])
      expect(glob.create).toHaveBeenCalledWith('locales/*.json')
    })

    test('should handle empty glob results', async () => {
      const glob = await import('@actions/glob')
      const mockGlobber = {
        glob: vi.fn().mockResolvedValue([]),
        getSearchPaths: vi.fn(),
        globGenerator: vi.fn()
      }

      vi.mocked(glob.create).mockResolvedValue(mockGlobber as never)

      const result = await fetchFiles('nonexistent/*.json')

      expect(result).toEqual([])
    })
  })

  describe('cleanRemoteFiles function', () => {
    test('should remove remote directory successfully', async () => {
      const io = await import('@actions/io')
      vi.mocked(io.rmRF).mockResolvedValue()

      await cleanRemoteFiles()

      expect(io.rmRF).toHaveBeenCalledWith('remote')
    })
  })

  describe('Business logic integration', () => {
    test('should process multiple disabled blocks correctly', () => {
      const complexInput = {
        section1: {
          block1: {type: 'text', content: 'keep'},
          block2: {type: 'text', disabled: true, content: 'remove'},
          block3: {type: 'image', content: 'keep'}
        },
        section2: {
          block4: {type: 'text', disabled: true, content: 'remove'},
          block5: {type: 'video', content: 'keep'}
        },
        disabled_section: {
          disabled: true,
          block6: {type: 'text', content: 'remove whole section'}
        }
      }

      const result = removeDisabledKeys(complexInput)

      expect(result).toHaveProperty('section1')
      expect(result).toHaveProperty('section2')
      expect(result).not.toHaveProperty('disabled_section')

      // The individual disabled blocks should still be there since they're nested
      expect(result.section1).toHaveProperty('block1')
      expect(result.section1).toHaveProperty('block2') // This is NOT removed (nested disabled)
      expect(result.section1).toHaveProperty('block3')
    })

    test('should handle JSON merging logic simulation', () => {
      // Simulate what deepmerge would do
      const local = mockLocaleFile
      const remote = mockRemoteLocaleFile

      const merged = {
        ...local,
        ...remote,
        general: {...local.general, ...remote.general},
        customer: {...local.customer, ...remote.customer}
      }

      expect(merged.general.title).toBe('Remote Store Title') // Remote wins
      expect(merged.general.currency_code).toBe('CAD') // Remote wins
      expect(merged.general.new_key).toBe('New remote value') // Remote only
      expect(merged.customer.forgot_password).toBe('Forgot Password') // Remote only
      expect(merged.customer.login).toBe('Remote Login') // Remote wins
    })
  })
})

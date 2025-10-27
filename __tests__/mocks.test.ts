import {expect, test, describe} from 'vitest'
import {removeDisabledKeys} from '../src/utils'
import {mockTemplateFile} from './fixtures'

describe('Business Logic Tests', () => {
  describe('removeDisabledKeys', () => {
    test('should remove objects with disabled: true property', () => {
      const input = {
        enabled_block: {
          type: 'text',
          settings: {
            content: 'This should be kept'
          }
        },
        disabled_block: {
          type: 'text',
          disabled: true,
          settings: {
            content: 'This should be removed'
          }
        },
        another_enabled: {
          type: 'image',
          settings: {
            src: 'image.jpg'
          }
        }
      }

      const result = removeDisabledKeys(input)

      expect(result).toEqual({
        enabled_block: {
          type: 'text',
          settings: {
            content: 'This should be kept'
          }
        },
        another_enabled: {
          type: 'image',
          settings: {
            src: 'image.jpg'
          }
        }
      })

      expect(result).not.toHaveProperty('disabled_block')
    })

    test('should handle empty object', () => {
      const result = removeDisabledKeys({})
      expect(result).toEqual({})
    })

    test('should handle object with no disabled properties', () => {
      const input = {
        block1: {type: 'text', value: 'test1'},
        block2: {type: 'image', value: 'test2'}
      }

      const result = removeDisabledKeys(input)
      expect(result).toEqual(input)
    })

    test('should handle nested objects properly', () => {
      const input = {
        normal_block: {
          type: 'text',
          nested: {
            disabled: false, // This is NOT a disabled block
            value: 'keep this'
          }
        },
        disabled_block: {
          disabled: true, // This IS a disabled block
          type: 'text',
          value: 'remove this'
        }
      }

      const result = removeDisabledKeys(input)

      expect(result).toHaveProperty('normal_block')
      expect(result).not.toHaveProperty('disabled_block')

      // Type assertion to access nested properties safely
      const normalBlock = result.normal_block as {
        type: string
        nested: {disabled: boolean; value: string}
      }
      expect(normalBlock.nested.disabled).toBe(false)
    })

    test('should work with fixture data', () => {
      const result = removeDisabledKeys(mockTemplateFile.blocks)

      expect(result).toHaveProperty('enabled_block')
      expect(result).toHaveProperty('another_enabled')
      expect(result).not.toHaveProperty('disabled_block')

      expect(Object.keys(result)).toHaveLength(2)
    })
  })

  describe('Path manipulation tests', () => {
    test('should transform remote paths correctly', () => {
      const remotePath = 'remote/locales/en.json'
      const expectedLocalPath = 'locales/en.json'
      const actualLocalPath = remotePath.replace('remote/', '')

      expect(actualLocalPath).toBe(expectedLocalPath)
    })

    test('should handle multiple remote path transformations', () => {
      const remotePaths = [
        'remote/locales/en.json',
        'remote/locales/fr.json',
        'remote/templates/index.json'
      ]

      const localPaths = remotePaths.map(path => path.replace('remote/', ''))

      expect(localPaths).toEqual([
        'locales/en.json',
        'locales/fr.json',
        'templates/index.json'
      ])
    })
  })

  describe('Array filtering logic', () => {
    test('should identify new files correctly', () => {
      const remoteFiles = ['index.json', 'product.json']
      const localFiles = [
        'index.json',
        'product.json',
        'collection.json',
        'cart.json'
      ]

      const newFiles = localFiles.filter(file => !remoteFiles.includes(file))

      expect(newFiles).toEqual(['collection.json', 'cart.json'])
    })

    test('should handle empty arrays', () => {
      const remoteFiles: string[] = []
      const localFiles = ['index.json', 'product.json']

      const newFiles = localFiles.filter(file => !remoteFiles.includes(file))

      expect(newFiles).toEqual(['index.json', 'product.json'])
    })

    test('should handle identical arrays', () => {
      const remoteFiles = ['index.json', 'product.json']
      const localFiles = ['index.json', 'product.json']

      const newFiles = localFiles.filter(file => !remoteFiles.includes(file))

      expect(newFiles).toEqual([])
    })
  })
})

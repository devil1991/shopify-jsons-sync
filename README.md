# Shopify Theme JSON Sync Action

A GitHub Action to sync JSON content (locale strings & JSON templates) between themes in a Shopify store.

## Features

- Syncs locale files (`locales/*.json`)
- Syncs configuration data files (`config/*_data.json`) 
- Syncs template files (`templates/**/*.json`)
- Supports syncing from live theme or specific unpublished themes
- Merges local changes with remote content
- Only pushes new content, doesn't edit existing content on the target theme
- **Safety First**: Never pushes to live themes - only pulls from live (or specific source theme) and pushes to unpublished themes

## Usage

### Basic Usage (Sync from Live Theme)

```yaml
- uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    theme: '${{ env.TARGET_THEME_ID }}'
```

### Advanced Usage

#### Sync from Specific Source Theme

```yaml
- uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    theme: '${{ env.TARGET_THEME_ID }}'              # Where to push
    source-theme: '${{ env.SOURCE_THEME_ID }}'       # Where to pull from
```

#### Allow Published Theme Pushes
```yaml
- uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    allow-published: 'true'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `store` | Yes | - | The Shopify store URL or identifier |
| `theme` | Yes | - | Target theme ID where files will be pushed to |
| `source-theme` | No | - | Source theme ID to pull JSON files from (if not provided, pulls from live theme) |
| `working-directory` | No | - | Working directory path if the action should run in a subdirectory |
| `allow-published` | No | 'false' | If true, allows pushing to published themes (use with caution) |

## How It Works

1. **Pull Phase**: Downloads JSON files from the source theme:
   - Live theme (when `source-theme` is not provided, default behavior)
   - Specific source theme (when `source-theme` is provided)

2. **Sync Phase**: 
   - Merges local JSON files with remote versions
   - Remote content takes priority in conflicts
   - Removes disabled blocks from merged content

3. **Push Phase**: 
   - Pushes merged locale files to the target theme (specified by `theme` parameter)
   - Pushes any new template files that don't exist remotely
   - Always uses the `theme` parameter as the destination
   - Does not push to live themes unless `allow-published` is set to true

## Use Cases

### Scenario 1: Standard Deployment (Default)
- Pull latest content from **source theme** (defaults to live theme)
- Push updates to **target theme** (staging, preview, etc.)
- Useful for most deployment workflows

### Scenario 2: Theme-to-Theme Sync
- Pull content from **specific source theme** (unpublished/development theme)
- Push updates to **target theme**
- Useful when working with multiple development themes or when the "source of truth" is not the live theme

## Example Workflows

### Standard Source-to-Target Sync
```yaml
- name: Sync JSON from Source Theme
  uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    theme: '${{ env.QA_THEME_ID }}'
    # No source-theme means it pulls from live theme (default source)
```

### Development Theme-to-Theme Sync
```yaml
- name: Sync JSON between Development Themes
  uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    theme: '${{ env.TARGET_THEME_ID }}'           # Where to push
    source-theme: '${{ env.DEV_THEME_ID }}'   # Where to pull from
```

### Conditional Sync Based on Environment
```yaml
- name: Sync JSON Files
  uses: devil1991/shopify-jsons-sync@v1.4.2
  with:
    store: '${{ env.SHOPIFY_FLAG_STORE }}'
    theme: '${{ env.TARGET_THEME_ID }}'
    source-theme: ${{ env.ENVIRONMENT != 'production' && env.DEV_THEME_ID || '' }}
```

## Development

### Build
```bash
npm install
npm run build && npm run package
```

### Test
```bash
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

export const mockLocaleFile = {
  general: {
    title: 'Test Store',
    meta_description: 'Test description',
    currency_code: 'USD'
  },
  customer: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout'
  }
}

export const mockTemplateFile = {
  sections: {
    header: {
      type: 'header',
      settings: {
        logo: 'logo.png'
      }
    },
    footer: {
      type: 'footer'
    }
  },
  blocks: {
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
  },
  order: ['enabled_block', 'disabled_block', 'another_enabled']
}

export const mockRemoteLocaleFile = {
  general: {
    title: 'Remote Store Title', // This should override local
    meta_description: 'Test description',
    currency_code: 'CAD', // This should override local
    new_key: 'New remote value' // This should be added
  },
  customer: {
    login: 'Remote Login', // This should override local
    register: 'Register',
    logout: 'Logout',
    forgot_password: 'Forgot Password' // This should be added
  }
}

export const mockShopifyCommentedJSON = `/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin language editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
{
  "general": {
    "title": "Commented JSON Store"
  }
}`

export const mockMalformedJSON = `{
  "general": {
    "title": "Malformed JSON Store",
    "missing_quote: "value"
  }
}`

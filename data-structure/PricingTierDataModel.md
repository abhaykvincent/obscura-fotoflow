# Advanced Pricing Tier Data Structure

This document outlines the proposed data structure for an advanced Pricing Tier model. This model is designed to support flexible billing cycles, granular feature controls, usage limits, and UI customization.

## 1. Core Identity & Status

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (e.g., `plan_freelancer_v2`). |
| `name` | `string` | Display name of the plan (e.g., "Pro Studio"). |
| `slug` | `string` | URL-friendly identifier (e.g., `pro-studio`). |
| `description` | `string` | Short description for the pricing card. |
| `type` | `enum` | `public` (visible to all), `custom` (sales only), `legacy` (grandfathered). |
| `status` | `enum` | `active` (purchasable), `draft` (hidden), `archived` (no new subs). |
| `sortOrder` | `number` | Order of appearance in the UI. |

## 2. Pricing & Billing

Supports multiple billing frequencies and currencies.

```json
"pricing": {
  "currency": "USD",
  "tiers": [
    {
      "interval": "month",
      "price": 2900, // stored in cents
      "stripePriceId": "price_123_mo"
    },
    {
      "interval": "year",
      "price": 29000, // stored in cents (approx 2 months free)
      "stripePriceId": "price_123_yr",
      "discountLabel": "Save 17%"
    }
  ],
  "trialPeriodDays": 14,
  "setupFee": 0
}
```

## 3. Usage Limits (Quotas)

Defines hard limits for system resources. `-1` denotes "Unlimited".

```json
"limits": {
  "storageGb": 100,             // Disk space
  "maxProjects": 50,            // Number of active projects
  "maxGalleries": -1,           // Unlimited galleries
  "maxTeamMembers": 3,          // Seats included
  "fileUploadSizeMb": 5000,     // Max size per file
  "bandwidthGb": 500            // Monthly bandwidth
}
```

## 4. Feature Flags & Access Control

Granular boolean flags for code-level checks and display lists for marketing.

```json
"features": {
  // Logic-based flags (used in code to check permissions)
  "permissions": {
    "canRemoveBranding": true,
    "canUseCustomDomain": true,
    "hasApiAccess": false,
    "hasPrioritySupport": true,
    "allowVideoUploads": true,
    "allowRawFiles": false
  },
  
  // Marketing lists (used for UI display)
  "displayList": [
    { "text": "100GB Storage", "tooltip": "High-speed SSD storage" },
    { "text": "Remove Watermark", "highlight": true },
    { "text": "Priority Support" }
  ]
}
```

## 5. UI & Presentation

Configuration for how the plan looks in the pricing table.

```json
"ui": {
  "colorTheme": "#4f46e5",    // Primary color for buttons/borders
  "badgeText": "Most Popular", // Optional ribbon text
  "highlight": true,           // Whether to scale up/highlight this card
  "ctaText": "Start Free Trial" // Custom call-to-action button text
}
```

## 6. Integrations & Metadata

```json
"metadata": {
  "stripeProductId": "prod_Kj9...",
  "internalNote": "Targeted at freelance wedding photographers",
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

## Full JSON Example

```json
{
  "id": "plan_pro_2024",
  "name": "Pro Studio",
  "slug": "pro-studio",
  "description": "Perfect for growing photography businesses.",
  "type": "public",
  "status": "active",
  "sortOrder": 2,
  "pricing": {
    "currency": "USD",
    "tiers": [
      {
        "interval": "month",
        "price": 29,
        "stripePriceId": "price_mo_123"
      },
      {
        "interval": "year",
        "price": 290,
        "stripePriceId": "price_yr_123",
        "discountLabel": "2 Months Free"
      }
    ],
    "trialPeriodDays": 14
  },
  "limits": {
    "storageGb": 1000,
    "maxProjects": -1,
    "maxTeamMembers": 5
  },
  "features": {
    "permissions": {
      "canRemoveBranding": true,
      "canUseCustomDomain": true
    },
    "displayList": [
      { "text": "1TB Storage" },
      { "text": "Unlimited Projects" },
      { "text": "White Labeling" }
    ]
  },
  "ui": {
    "colorTheme": "#00C853",
    "badgeText": "Recommended",
    "highlight": true
  }
}
```

export type ProviderGuideFeature = {
  slug: string
  title: string
  shortDescription: string
  whyUse: string
  steps: string[]
  tips: string[]
}

export const providerGuideFeatures: ProviderGuideFeature[] = [
  {
    slug: 'dashboard-overview-analytics',
    title: 'Dashboard Overview & Analytics',
    shortDescription: 'Check business KPIs, monthly sales trend, and provider notifications.',
    whyUse: 'Use this page for a quick health check of your provider operations.',
    steps: [
      'Open Dashboard Overview & Analytics from Provider Dashboard.',
      'Review summary cards like total medicines, total orders, pending approvals, and earnings.',
      'Check Monthly Sales Trend graph to understand recent performance.',
      'Read notifications panel for platform and order updates.',
    ],
    tips: [
      'Start your day from overview to identify urgent pending approvals.',
      'Track trend changes weekly to plan stock and pricing decisions.',
    ],
  },
  {
    slug: 'medicine-management',
    title: 'Medicine Management',
    shortDescription: 'Add, edit, search, filter, and delete medicines with stock and pricing details.',
    whyUse: 'Use this to keep medicine catalog accurate and available for patient orders.',
    steps: [
      'Open Medicine Management from Provider Dashboard.',
      'Use Search and Category filters, then click Apply to find specific medicines.',
      'Click Add Medicine to create a new record with stock, pricing, expiry, and details.',
      'Use Edit to update existing records or Delete to remove outdated listings.',
    ],
    tips: [
      'Update quantity and selling price regularly to avoid order issues.',
      'Add clear medicine names and categories for better discoverability.',
    ],
  },
  {
    slug: 'order-management-approvals',
    title: 'Order Management & Approvals',
    shortDescription: 'Review incoming orders and take action: approve, reject, or complete.',
    whyUse: 'Use this to process patient orders quickly and keep fulfillment workflow smooth.',
    steps: [
      'Open Order Management & Approvals.',
      'Review each order row with patient info, medicines, payment status, and current order status.',
      'Click Approve for valid orders, Reject for unavailable or invalid orders.',
      'Click Complete when an approved order is fulfilled and delivered.',
    ],
    tips: [
      'Verify stock before approving to reduce cancellations.',
      'Complete orders promptly so payment and reporting stay accurate.',
    ],
  },
  {
    slug: 'payment-management-revenue-split',
    title: 'Payment Management & Revenue Split',
    shortDescription: 'View revenue split (75/25), transaction history, and update payout account details.',
    whyUse: 'Use this to track earnings and ensure payout details are always correct.',
    steps: [
      'Open Payment Management & Revenue Split.',
      'Review summary cards for Gross Revenue, Provider Share, Admin Share, and transaction count.',
      'Check Transaction History table for payment records and statuses.',
      'Update payout account fields (bank/wallet), then click Save Payout Details.',
    ],
    tips: [
      'Double-check account numbers and IBAN before saving.',
      'Review transactions frequently to catch discrepancies early.',
    ],
  },
]

export const providerGuideFeatureMap = Object.fromEntries(
  providerGuideFeatures.map((feature) => [feature.slug, feature]),
) as Record<string, ProviderGuideFeature>

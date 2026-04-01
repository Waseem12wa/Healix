export type DoctorGuideFeature = {
  slug: string
  title: string
  shortDescription: string
  whyUse: string
  steps: string[]
  tips: string[]
}

export const doctorGuideFeatures: DoctorGuideFeature[] = [
  {
    slug: 'set-reminder',
    title: 'Set Reminder',
    shortDescription: 'Create medicine schedules and recommendations for patients.',
    whyUse: 'Use this to improve patient adherence and reduce missed doses.',
    steps: [
      'Open Set Reminder from doctor dashboard.',
      'Select the patient and medicine details.',
      'Set timing and frequency based on prescription.',
      'Save reminder and confirm patient receives it.',
    ],
    tips: [
      'Use clear dosing notes for the patient.',
      'Update reminders when treatment changes.',
    ],
  },
  {
    slug: 'assigned-patient',
    title: 'Assigned Patient',
    shortDescription: 'View patients who selected you as their doctor.',
    whyUse: 'Use this to monitor and manage your active patient list.',
    steps: [
      'Open Assigned Patient section.',
      'Review patient profiles and current status.',
      'Select a patient to check latest updates.',
      'Follow up with recommendations when needed.',
    ],
    tips: [
      'Prioritize patients with recent risk signals.',
      'Keep communication and follow-up notes consistent.',
    ],
  },
  {
    slug: 'drug-interaction-checker',
    title: 'Drug Interaction Checker',
    shortDescription: 'Review patient requests related to medicine interaction checks.',
    whyUse: 'Use this to validate risky combinations before approval.',
    steps: [
      'Open Drug Interaction Checker requests.',
      'Review medicine combination submitted by patient.',
      'Approve, reject, or modify with comments.',
      'Save decision so patient receives guidance.',
    ],
    tips: [
      'Check severe interaction flags carefully.',
      'Provide short clinical reason in your response.',
    ],
  },
  {
    slug: 'drug-food-interaction',
    title: 'Drug-Food Interaction',
    shortDescription: 'Handle requests about food effects on medication.',
    whyUse: 'Use this to reduce diet-related treatment issues.',
    steps: [
      'Open Drug-Food Interaction review queue.',
      'Check medicine and related food conflict details.',
      'Approve or modify with practical meal advice.',
      'Submit final decision for patient visibility.',
    ],
    tips: [
      'Keep advice simple for daily use.',
      'Include critical avoid-food notes first.',
    ],
  },
  {
    slug: 'drug-alternatives',
    title: 'Drug Alternatives',
    shortDescription: 'Review and manage medicine alternative recommendations.',
    whyUse: 'Use this when original medicine is unavailable or unsuitable.',
    steps: [
      'Open Drug Alternatives requests.',
      'Check suggested substitutes and patient condition.',
      'Approve a safe option or suggest modification.',
      'Submit final recommendation with brief rationale.',
    ],
    tips: [
      'Consider allergies and history before approval.',
      'Prefer options with clear dosage match.',
    ],
  },
  {
    slug: 'side-effect-predictor',
    title: 'Side Effect Predictor',
    shortDescription: 'Evaluate side-effect prediction requests from patients.',
    whyUse: 'Use this to help patients identify warning signs early.',
    steps: [
      'Open Side Effect Predictor request list.',
      'Review medicine context and predicted outcomes.',
      'Confirm high-risk concerns and patient instructions.',
      'Submit response and suggest follow-up when required.',
    ],
    tips: [
      'Highlight emergency symptoms clearly.',
      'Recommend clinic visit for persistent adverse effects.',
    ],
  },
  {
    slug: 'medicine-manager',
    title: 'Medicine Manager',
    shortDescription: 'Manage medicine records and availability in system.',
    whyUse: 'Use this to keep medicine data accurate for patient safety.',
    steps: [
      'Open Medicine Manager.',
      'Search or filter medicine records.',
      'Add or update medicine information as needed.',
      'Save changes and verify details are correct.',
    ],
    tips: [
      'Use standard naming to avoid duplicates.',
      'Recheck strength and warnings before save.',
    ],
  },
  {
    slug: 'ai-health-assistant',
    title: 'AI Health Assistant',
    shortDescription: 'Review AI-related patient requests and guidance flow.',
    whyUse: 'Use this to ensure AI outputs align with clinical decisions.',
    steps: [
      'Open AI Health Assistant request section.',
      'Read patient context and AI-generated response.',
      'Approve or adjust guidance where needed.',
      'Publish final response for patient use.',
    ],
    tips: [
      'Validate critical recommendations manually.',
      'Use concise corrections for patient clarity.',
    ],
  },
  {
    slug: 'record-summarization',
    title: 'Record Summarization',
    shortDescription: 'Review summarized medical records for accuracy.',
    whyUse: 'Use this to speed up case review while preserving key details.',
    steps: [
      'Open Record Summarization requests.',
      'Check summary against important medical points.',
      'Approve or correct missing key information.',
      'Submit the reviewed summary for patient access.',
    ],
    tips: [
      'Check diagnosis and medication sections first.',
      'Keep corrected summary simple and structured.',
    ],
  },
  {
    slug: 'my-appointment',
    title: 'My Appointment',
    shortDescription: 'Manage your scheduled patient appointments.',
    whyUse: 'Use this to organize consultations and reduce scheduling conflicts.',
    steps: [
      'Open My Appointment.',
      'Review upcoming and pending appointment slots.',
      'Approve, reschedule, or reject based on availability.',
      'Confirm updates so patient receives status changes.',
    ],
    tips: [
      'Keep your schedule updated daily.',
      'Add clear notes when rescheduling appointments.',
    ],
  },
]

export const doctorGuideFeatureMap = Object.fromEntries(
  doctorGuideFeatures.map((feature) => [feature.slug, feature]),
) as Record<string, DoctorGuideFeature>

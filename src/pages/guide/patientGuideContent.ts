export type PatientGuideFeature = {
  slug: string
  title: string
  shortDescription: string
  whyUse: string
  steps: string[]
  tips: string[]
}

export const patientGuideFeatures: PatientGuideFeature[] = [
  {
    slug: 'drug-interaction-checker',
    title: 'Drug Interaction Checker',
    shortDescription: 'Check whether two or more medicines can react with each other.',
    whyUse: 'Use this before taking a new medicine with your current prescription.',
    steps: [
      'Open Drug Interaction Checker from your dashboard tools.',
      'Enter the medicine names exactly as written on your prescription.',
      'Start the check and review the interaction level shown in results.',
      'Read the recommendation and follow your doctor guidance for safety.',
    ],
    tips: [
      'Double-check medicine spelling for better accuracy.',
      'Do not stop medicine on your own without medical advice.',
    ],
  },
  {
    slug: 'drug-food-interaction',
    title: 'Drug-Food Interaction',
    shortDescription: 'See which foods may reduce effect of a medicine or cause side effects.',
    whyUse: 'Use this while planning meals during treatment.',
    steps: [
      'Open Drug-Food Interaction from your patient tools.',
      'Select or type your medicine name.',
      'Run the check to view foods to avoid or limit.',
      'Use the safe-food notes to adjust your meal routine.',
    ],
    tips: [
      'Check again if your medicine dose changes.',
      'Ask your doctor for long-term diet plans if needed.',
    ],
  },
  {
    slug: 'drug-alternatives',
    title: 'Drug Alternatives',
    shortDescription: 'Find possible alternatives when a medicine is unavailable or expensive.',
    whyUse: 'Use this to discuss replacement options with your doctor.',
    steps: [
      'Open Drug Alternatives.',
      'Search the current medicine you are using.',
      'Review available alternatives and compare basic details.',
      'Confirm any switch with your doctor before purchase.',
    ],
    tips: [
      'Do not replace medicine yourself without professional advice.',
      'Keep your medical condition and allergies in mind.',
    ],
  },
  {
    slug: 'side-effect-predictor',
    title: 'Side Effect Predictor',
    shortDescription: 'Understand possible side effects before or during treatment.',
    whyUse: 'Use this to stay aware and react early to warning signs.',
    steps: [
      'Open Side Effect Predictor from the dashboard.',
      'Enter the medicine details requested on screen.',
      'Check predicted common and important side effects.',
      'Monitor symptoms and contact your doctor if signs appear.',
    ],
    tips: [
      'Save important warnings for quick reference.',
      'Get urgent help for severe reactions.',
    ],
  },
  {
    slug: 'medicine-shop',
    title: 'Medicine Shop',
    shortDescription: 'Order prescribed medicines from trusted providers.',
    whyUse: 'Use this for convenient medicine ordering and tracking.',
    steps: [
      'Open Medicine Shop.',
      'Search your required medicine and verify the strength.',
      'Add correct quantity to cart and proceed to checkout.',
      'Track your order from order history after placing it.',
    ],
    tips: [
      'Always match dosage with your prescription.',
      'Use trusted payment and keep order confirmation.',
    ],
  },
  {
    slug: 'medication-reminder',
    title: 'Medication Reminder',
    shortDescription: 'Set your reminder email and view reminders created by your doctor.',
    whyUse: 'Use this to receive doctor-created medication reminders and track what is scheduled for you.',
    steps: [
      'Open Medication Reminder.',
      'Enter your email address and save it for reminder delivery.',
      'Wait for your doctor to create reminder schedules for your medicines.',
      'View your reminder list and check medicine, dose, and timing details.',
    ],
    tips: [
      'Keep your reminder email updated so notifications reach you.',
      'If timing looks wrong, contact your doctor to update the reminder set.',
    ],
  },
  {
    slug: 'ai-health-assistant',
    title: 'AI Health Assistant',
    shortDescription: 'Ask health-related questions and get simple guidance.',
    whyUse: 'Use this for quick understanding of reports and medicine basics.',
    steps: [
      'Open AI Health Assistant chat.',
      'Type your question in clear and simple words.',
      'Review the answer and follow suggested next checks.',
      'For serious concerns, consult a doctor directly.',
    ],
    tips: [
      'Share enough context for better answers.',
      'Treat AI response as guidance, not final diagnosis.',
    ],
  },
  {
    slug: 'record-summarization',
    title: 'Record Summarization',
    shortDescription: 'Convert long medical reports into short, easy summaries.',
    whyUse: 'Use this to quickly understand key points before appointments.',
    steps: [
      'Open Record Summarization.',
      'Upload or select your medical record file.',
      'Generate summary and read diagnosis, medicines, and advice section.',
      'Save the summary for future doctor visits.',
    ],
    tips: [
      'Upload clear records for better summary quality.',
      'Keep original report along with summary.',
    ],
  },
  {
    slug: 'doctor-appointments',
    title: 'Doctor Appointments',
    shortDescription: 'Book, review, and manage doctor appointments.',
    whyUse: 'Use this to stay organized with consultations and follow-ups.',
    steps: [
      'Open Doctor Appointments.',
      'Choose doctor, date, and available time slot.',
      'Confirm booking and check appointment status.',
      'Reschedule or cancel early if your plan changes.',
    ],
    tips: [
      'Book follow-ups before medicines run out.',
      'Join or arrive early to avoid delays.',
    ],
  },
]

export const patientGuideFeatureMap = Object.fromEntries(
  patientGuideFeatures.map((feature) => [feature.slug, feature]),
) as Record<string, PatientGuideFeature>

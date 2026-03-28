const DRUG_SPELL_CORRECTIONS: Record<string, string> = {
  asprin: 'aspirin',
  ibuprophen: 'ibuprofen',
  paracetmol: 'paracetamol',
  metphormin: 'metformin',
  amoxcillin: 'amoxicillin',
  warferin: 'warfarin',
  lisnopril: 'lisinopril',
  atorvastin: 'atorvastatin',
  omeprazol: 'omeprazole',
  simvastin: 'simvastatin',
}

const FOOD_SPELL_CORRECTIONS: Record<string, string> = {
  grapfruit: 'grapefruit',
  alchohol: 'alcohol',
  cheeze: 'cheese',
  brocolli: 'broccoli',
  spinich: 'spinach',
  caffiene: 'caffeine',
}

const KNOWN_DRUGS = [
  'aspirin', 'ibuprofen', 'paracetamol', 'acetaminophen', 'metformin', 'warfarin',
  'amoxicillin', 'lisinopril', 'atorvastatin', 'omeprazole', 'simvastatin',
  'naproxen', 'diclofenac', 'azithromycin', 'cetirizine', 'loratadine',
  'amlodipine', 'losartan', 'levothyroxine', 'pantoprazole', 'insulin'
]

const KNOWN_FOODS = [
  'grapefruit', 'grapefruit juice', 'alcohol', 'dairy', 'milk', 'cheese', 'yogurt',
  'salt', 'coffee', 'caffeine', 'broccoli', 'spinach', 'soy', 'cranberry juice',
  'banana', 'orange', 'apple', 'tea', 'chocolate'
]

const DRUG_NOISE_WORDS = [
  'tablet', 'tab', 'capsule', 'cap', 'syrup', 'injection', 'inj',
  'medicine', 'med', 'drug', 'dose', 'mg', 'ml'
]

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripNoiseWords(value: string, words: string[]): string {
  if (!value) return value

  const parts = value.split(' ').filter(Boolean)
  const filtered = parts.filter((part) => !words.includes(part))

  return filtered.join(' ').trim() || value
}

function getLevenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  return dp[a.length][b.length]
}

function findBestMatch(input: string, candidates: string[]): string {
  if (candidates.includes(input)) {
    return input
  }

  let best = input
  let bestDistance = Infinity

  for (const candidate of candidates) {
    const distance = getLevenshteinDistance(input, candidate)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  const maxDistance = Math.max(2, Math.floor(input.length * 0.3))
  return bestDistance <= maxDistance ? best : input
}

export function correctDrugTerm(rawValue: string): string {
  const normalized = normalizeText(rawValue)
  if (!normalized) return rawValue

  if (DRUG_SPELL_CORRECTIONS[normalized]) {
    return DRUG_SPELL_CORRECTIONS[normalized]
  }

  const cleaned = stripNoiseWords(normalized, DRUG_NOISE_WORDS)

  if (DRUG_SPELL_CORRECTIONS[cleaned]) {
    return DRUG_SPELL_CORRECTIONS[cleaned]
  }

  return findBestMatch(cleaned, KNOWN_DRUGS)
}

export function correctFoodTerm(rawValue: string): string {
  const normalized = normalizeText(rawValue)
  if (!normalized) return rawValue

  if (FOOD_SPELL_CORRECTIONS[normalized]) {
    return FOOD_SPELL_CORRECTIONS[normalized]
  }

  return findBestMatch(normalized, KNOWN_FOODS)
}

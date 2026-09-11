export type Severity = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export type DetectionResult = {
  isHateful: boolean;
  confidence: number;
  categories: string[];
  severity: Severity;
  explanation: string;
  flaggedTerms: string[];
};

type Category = {
  name: string;
  label: string;
  terms: string[];
  patterns: RegExp[];
};

const categories: Category[] = [
  {
    name: 'racial',
    label: 'Racial / Ethnic',
    terms: [
      'gook', 'kike', 'spic', 'chink', 'wetback', 'sand nigger', 'porch monkey',
      'jungle bunny', 'tar baby', 'coon', 'pickaninny', 'squaw', 'redskin',
      'injun', 'raghead', 'towelhead', 'camel jockey', 'beaner', 'negro',
      'coloreds', 'half-breed', 'mongrel', 'jigaboo', 'sambo', 'wop',
      'mick', 'kraut', 'frog', 'dago', 'hun', 'jap', 'gook',
    ],
    patterns: [
      /\bn\s*[\s._-]*[1i]gg\s*[e3]r\b/i,
      /\bn\s*[\s._-]*[1i]gg\s*[a4]\b/i,
      /\bn[-\s]*[1i]gg\b/i,
    ],
  },
  {
    name: 'gender',
    label: 'Gender / Sexist',
    terms: [
      'bitch', 'whore', 'slut', 'cunt', 'twat', 'skank', 'tramp', 'harlot',
      'bimbo', 'gold digger', 'feminazi', 'cum dumpster', 'fucktoy',
      'cock tease', 'dyke', 'mangina', 'pussy', 'clit', 'roastie',
    ],
    patterns: [
      /\bw\s*[\s._-]*[o0]m\s*[\s._-]*?e\s*n\b/i,
      /\bf\s*[\s._-]*e\s*m\s*[\s._-]*[1i]n\s*[a4]z\s*[1i]\b/i,
    ],
  },
  {
    name: 'lgbtq',
    label: 'LGBTQ+ / Homophobic',
    terms: [
      'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'queer-bashing',
      'carpet muncher', 'pillow biter', 'butt pirate', 'fudge packer',
      'homo', 'lesbo', 'he-she', 'she-male', 'chicks with dicks',
    ],
    patterns: [
      /\bf\s*[\s._-]*[a4]g\s*[\s._-]*g\s*[o0]t\b/i,
      /\bf\s*[\s._-]*[a4]g\b/i,
    ],
  },
  {
    name: 'religious',
    label: 'Religious / Faith-based',
    terms: [
      'kike', 'christ-killer', 'muzzie', 'raghead', 'towelhead',
      'infidel', 'heathen', 'heretic', 'blasphemer', 'goys',
      'zionist pig', 'dirty jew', 'dirty muslim', 'dirty christian',
    ],
    patterns: [],
  },
  {
    name: 'disability',
    label: 'Disability / Ableist',
    terms: [
      'retard', 'retarded', 'mongoloid', 'cripple', 'spastic', 'window licker',
      'short bus', 'midget', 'lame', 'lunatic', 'psycho', 'simpleton',
      'moron', 'imbecile', 'feebleminded', 'tard',
    ],
    patterns: [
      /\br\s*[\s._-]*e\s*t\s*[a4]r\s*d\b/i,
      /\br\s*[\s._-]*e\s*t\s*[a4]r\s*d\s*e\s*d\b/i,
    ],
  },
  {
    name: 'xenophobic',
    label: 'Xenophobic / Nationalist',
    terms: [
      'go back to your country', 'go back home', 'alien scum',
      'border hopper', 'illegal alien', 'anchor baby', 'shithole country',
      'send them back', 'build the wall', 'go back to africa',
      'go back to mexico', 'go back to china',
    ],
    patterns: [],
  },
];

const generalHatePatterns: RegExp[] = [
  /\bI\s+hope\s+you\s+(die|get\s+cancer|rot|burn)\b/i,
  /\bkill\s+(yourself|all\s+\w+s|yourselves)\b/i,
  /\bgo\s+(die|kill\s+yourself|hang\s+yourself)\b/i,
  /\byou\s+(deserve\s+to\s+die|should\s+die|will\s+burn\s+in\s+hell)\b/i,
  /\bdeath\s+to\s+/i,
  /\bexterminate\s+(all|the)\s+/i,
  /\bethnic\s+cleansing\b/i,
  /\bgenocide\s+is\s+good\b/i,
  /\bgas\s+the\s+/i,
  /\bput\s+them\s+in\s+ovens\b/i,
  /\bfinal\s+solution\b/i,
];

const intensityWords = [
  'all', 'every', 'always', 'must', 'should', 'deserve',
  'need to', 'have to', 'ought to', 'never',
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function checkCategory(text: string, category: Category): { matched: string[] } {
  const matched: string[] = [];
  const normalized = normalize(text);

  for (const term of category.terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalized)) {
      matched.push(term);
    }
  }

  for (const pattern of category.patterns) {
    if (pattern.test(normalized)) {
      matched.push(`[obfuscated pattern]`);
    }
  }

  return { matched: [...new Set(matched)] };
}

function checkGeneralHate(text: string): string[] {
  const matched: string[] = [];
  const normalized = normalize(text);

  for (const pattern of generalHatePatterns) {
    if (pattern.test(normalized)) {
      matched.push(normalized.match(pattern)?.[0] ?? '[pattern]');
    }
  }

  return matched;
}

function calculateConfidence(
  flaggedCount: number,
  categoryCount: number,
  generalCount: number,
  hasIntensity: boolean
): number {
  let base = 0;

  if (flaggedCount > 0) base += 40;
  if (categoryCount > 1) base += 15;
  if (categoryCount > 2) base += 10;
  if (generalCount > 0) base += 20;
  if (generalCount > 1) base += 10;
  if (hasIntensity) base += 5;

  return Math.min(base, 99);
}

function getSeverity(confidence: number, isHateful: boolean): Severity {
  if (!isHateful) return 'none';
  if (confidence >= 85) return 'severe';
  if (confidence >= 65) return 'high';
  if (confidence >= 45) return 'moderate';
  return 'low';
}

function buildExplanation(
  isHateful: boolean,
  categories: string[],
  flaggedTerms: string[],
  generalMatches: string[],
  confidence: number
): string {
  if (!isHateful) {
    if (flaggedTerms.length === 0 && generalMatches.length === 0) {
      return 'No hateful language was detected. The statement does not contain known slurs, dehumanizing language, or violent threats.';
    }
    return 'Some potentially sensitive terms were detected, but the overall context does not meet the threshold for classification as hateful speech.';
  }

  const parts: string[] = [];

  if (categories.length > 0) {
    const labels = categories.join(', ');
    parts.push(`Detected hateful language targeting: ${labels}.`);
  }

  if (flaggedTerms.length > 0) {
    const terms = flaggedTerms.slice(0, 5).join(', ');
    parts.push(`Flagged terms: ${terms}.`);
  }

  if (generalMatches.length > 0) {
    parts.push('Contains threatening or dehumanizing language.');
  }

  parts.push(`Confidence level: ${confidence}%.`);

  return parts.join(' ');
}

export function detectHateSpeech(text: string): DetectionResult {
  const normalized = normalize(text);
  const allFlagged: string[] = [];
  const matchedCategories: string[] = [];
  const matchedCategoryLabels: string[] = [];

  for (const category of categories) {
    const { matched } = checkCategory(text, category);
    if (matched.length > 0) {
      allFlagged.push(...matched);
      matchedCategories.push(category.name);
      matchedCategoryLabels.push(category.label);
    }
  }

  const generalMatches = checkGeneralHate(text);
  allFlagged.push(...generalMatches);

  const hasIntensity = intensityWords.some((word) =>
    normalized.includes(word)
  );

  const confidence = calculateConfidence(
    allFlagged.length,
    matchedCategories.length,
    generalMatches.length,
    hasIntensity
  );

  const isHateful = allFlagged.length > 0 && confidence >= 40;
  const finalConfidence = isHateful ? Math.max(confidence, 45) : confidence;
  const severity = getSeverity(finalConfidence, isHateful);

  const explanation = buildExplanation(
    isHateful,
    matchedCategoryLabels,
    allFlagged,
    generalMatches,
    finalConfidence
  );

  return {
    isHateful,
    confidence: Math.round(finalConfidence),
    categories: matchedCategoryLabels,
    severity,
    explanation,
    flaggedTerms: allFlagged,
  };
}

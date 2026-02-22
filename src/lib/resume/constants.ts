/**
 * Common English stopwords to filter out during keyword extraction.
 * These words carry little semantic value for JD matching.
 */
export const STOPWORDS: Set<string> = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an',
  'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'doing', 'down', 'during', 'each', 'etc', 'even', 'every', 'few', 'for', 'from',
  'further', 'get', 'got', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'however', 'i', 'if', 'in',
  'including', 'into', 'is', 'it', 'its', 'itself', 'just', 'know', 'let', 'like',
  'make', 'may', 'me', 'might', 'more', 'most', 'much', 'must', 'my', 'myself',
  'need', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'per', 'please',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'upon', 'us', 'use',
  'used', 'using', 'very', 'was', 'we', 'well', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'within', 'without',
  'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Additional common resume/JD filler words
  'able', 'across', 'along', 'already', 'among', 'another', 'around', 'away',
  'back', 'based', 'become', 'best', 'better', 'big', 'come', 'day', 'end',
  'ensure', 'experience', 'first', 'full', 'give', 'go', 'good', 'great',
  'help', 'high', 'key', 'large', 'last', 'lead', 'long', 'look', 'new',
  'next', 'number', 'offer', 'old', 'one', 'open', 'part', 'place', 'point',
  'provide', 'put', 'right', 'run', 'say', 'see', 'set', 'show', 'since',
  'small', 'start', 'state', 'still', 'take', 'tell', 'think', 'time', 'top',
  'try', 'turn', 'two', 'want', 'way', 'work', 'world', 'year', 'years',

  // JD-specific filler words (common in job postings but not meaningful for ATS matching)
  'ability', 'activities', 'apply', 'application', 'applications', 'approach',
  'appropriate', 'area', 'areas', 'available', 'benefit', 'benefits', 'business',
  'candidate', 'candidates', 'career', 'challenge', 'challenges', 'change',
  'client', 'clients', 'closely', 'company', 'compensation', 'complex',
  'consultants', 'create', 'current', 'currently', 'customer', 'customers',
  'deliver', 'department', 'description', 'desired', 'detail', 'details',
  'develop', 'development', 'different', 'directly', 'drive', 'driven',
  'duties', 'duty', 'dynamic', 'effectively', 'effort', 'efforts', 'employ',
  'employer', 'employment', 'environment', 'equal', 'essential', 'establish',
  'evaluate', 'excellent', 'exciting', 'execute', 'existing', 'expect',
  'expected', 'fast', 'focus', 'follow', 'following', 'function', 'functions',
  'grow', 'growing', 'growth', 'guide', 'handle', 'hire', 'hiring', 'ideal',
  'identify', 'impact', 'implement', 'implementation', 'important', 'improve',
  'improvement', 'include', 'individual', 'individuals', 'industry', 'information',
  'initiative', 'initiatives', 'innovative', 'interaction', 'interactions',
  'interest', 'internal', 'involved', 'issue', 'issues', 'job', 'join',
  'level', 'leverage', 'life', 'location', 'maintain', 'manage', 'management',
  'manager', 'meet', 'member', 'members', 'minimum', 'mission', 'multiple',
  'necessary', 'office', 'operate', 'operation', 'operations', 'opportunity',
  'opportunities', 'order', 'organization', 'organizational', 'other', 'outcome',
  'outcomes', 'overall', 'oversee', 'participate', 'partner', 'partners',
  'passion', 'pay', 'people', 'perform', 'performance', 'plan', 'plans',
  'play', 'plus', 'position', 'practice', 'practices', 'preferred', 'present',
  'primary', 'process', 'processes', 'product', 'products', 'professional',
  'professionals', 'program', 'programs', 'progress', 'project', 'projects',
  'proven', 'qualifications', 'qualified', 'range', 'receive', 'related',
  'relevant', 'report', 'reports', 'required', 'requirement', 'requirements',
  'requires', 'resource', 'resources', 'responsible', 'responsibilities',
  'responsibility', 'result', 'results', 'review', 'role', 'salary', 'scale',
  'seeking', 'senior', 'serve', 'service', 'services', 'share', 'skills',
  'solution', 'solutions', 'specific', 'staff', 'stakeholder', 'stakeholders',
  'standard', 'standards', 'status', 'strategy', 'strong', 'structure',
  'success', 'successful', 'successfully', 'support', 'system', 'systems',
  'task', 'tasks', 'team', 'teams', 'technical', 'technology', 'three',
  'together', 'tool', 'tools', 'track', 'understand', 'understanding',
  'unit', 'updates', 'value', 'various', 'well', 'working',

  // Geographic / demographic filler
  'america', 'americas', 'united', 'states', 'north', 'south', 'east', 'west',
  'remote', 'hybrid', 'onsite', 'office',
]);

/**
 * Domain-specific keyword weight multipliers for cybersecurity and tech terms.
 * Higher weights indicate stronger relevance signals when matched in JD text.
 */
export const KEYWORD_WEIGHTS: Record<string, number> = {
  // Threat Research & Intelligence
  'ransomware': 3.0,
  'malware': 2.8,
  'threat intelligence': 3.0,
  'threat hunting': 3.0,
  'apt': 2.5,
  'advanced persistent threat': 3.0,
  'mitre': 2.5,
  'mitre att&ck': 3.0,
  'att&ck': 2.8,
  'ioc': 2.5,
  'indicator of compromise': 2.8,
  'indicators of compromise': 2.8,
  'osint': 2.5,
  'threat actor': 2.5,
  'threat actors': 2.5,
  'campaign tracking': 2.5,
  'malware analysis': 3.0,
  'reverse engineering': 2.8,
  'kill chain': 2.5,
  'cyber kill chain': 2.5,
  'ttps': 2.5,
  'tactics techniques': 2.5,

  // Defense & Detection
  'edr': 2.5,
  'endpoint detection': 2.5,
  'defense evasion': 2.5,
  'byovd': 2.5,
  'detection engineering': 2.5,
  'incident response': 2.5,
  'siem': 2.2,
  'soar': 2.2,
  'yara': 2.2,
  'sigma': 2.2,
  'vulnerability': 2.0,
  'cve': 2.0,
  'exploit': 2.2,
  'zero day': 2.5,
  'phishing': 2.0,

  // Infrastructure & Platforms
  'esxi': 2.0,
  'linux': 1.8,
  'windows': 1.8,
  'cloud security': 2.2,
  'aws': 1.8,
  'azure': 1.8,
  'gcp': 1.5,
  'kubernetes': 1.8,
  'docker': 1.5,
  'active directory': 2.0,

  // Programming & Tools
  'python': 2.0,
  'typescript': 1.8,
  'javascript': 1.5,
  'node.js': 1.8,
  'nodejs': 1.8,
  'react': 1.5,
  'sql': 1.5,
  'api': 1.5,
  'rest': 1.3,
  'graphql': 1.3,
  'git': 1.3,
  'ci/cd': 1.5,
  'automation': 2.0,
  'scripting': 1.5,

  // AI & ML
  'machine learning': 2.0,
  'artificial intelligence': 2.0,
  'ai': 1.8,
  'llm': 2.0,
  'large language model': 2.0,
  'prompt engineering': 2.0,
  'nlp': 1.8,
  'natural language processing': 1.8,

  // Platforms & Frameworks
  'virustotal': 2.0,
  'opencti': 2.0,
  'confluence': 1.5,
  'jira': 1.5,
  'splunk': 2.0,
  'elastic': 1.8,
  'elasticsearch': 1.8,

  // Soft Skills & Processes
  'research': 1.8,
  'published': 1.5,
  'training': 1.5,
  'mentoring': 1.3,
  'presentation': 1.3,
  'report writing': 1.5,
  'technical writing': 1.5,
  'cross-functional': 1.3,
  'collaboration': 1.2,
  'leadership': 1.3,
  'communication': 1.2,

  // Forensics & IR
  'forensics': 2.2,
  'digital forensics': 2.5,
  'dfir': 2.5,
  'memory forensics': 2.5,
  'disk forensics': 2.2,
  'network forensics': 2.2,
  'triage': 2.0,

  // Extended Platforms
  'xdr': 2.2,
  'ndr': 2.0,
  'crowdstrike': 2.0,
  'carbon black': 2.0,
  'palo alto': 1.8,
  'sentinel': 2.0,
  'qradar': 2.0,
  'suricata': 2.0,
  'snort': 2.0,
  'wireshark': 1.8,
  'ida pro': 2.0,
  'ghidra': 2.0,

  // Methodologies & Frameworks
  'threat modeling': 2.2,
  'diamond model': 2.0,
  'stix': 2.0,
  'taxii': 2.0,
  'cyber threat intelligence': 3.0,
  'cti': 2.5,

  // Security Domains
  'cybersecurity': 2.0,
  'information security': 2.0,
  'infosec': 2.0,
  'network security': 1.8,
  'application security': 1.8,
  'devsecops': 1.8,
  'penetration testing': 2.0,
  'red team': 2.0,
  'blue team': 2.0,
  'purple team': 2.0,
  'soc': 2.0,
  'security operations': 2.0,
  'threat modeling': 2.2,
  'risk assessment': 1.8,
  'compliance': 1.5,
  'nist': 1.5,
  'iso 27001': 1.5,
};

/** Default words per minute for reading time estimates. */
export const DEFAULT_WPM = 200;

/** Maximum character length for a single resume bullet point. */
export const MAX_BULLET_LENGTH = 180;

/** Minimum character length for a single resume bullet point. */
export const MIN_BULLET_LENGTH = 20;

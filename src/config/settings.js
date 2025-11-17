import * as core from '@actions/core';

/**
 * Default configuration values
 * @private
 */
const DEFAULTS = {
  // Token limits (per PR)
  MAX_TOKENS_PER_REQUEST: 4000,
  MAX_TOTAL_TOKENS: 16000,
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 10,
  
  // Content limits
  MAX_DIFF_SIZE: 500 * 1024, // 500KB
  MAX_FILES_PER_PR: 20,
  
  // Timeouts
  REQUEST_TIMEOUT_MS: 30000,
  
  // Model settings
  DEFAULT_TEMPERATURE: 0.3,
  DEFAULT_MODEL: 'gpt-4-turbo-preview',
  
  // Feature flags
  ENABLE_LOCAL_MODELS: true,
  ENABLE_LATEX_DIFF: true
};

/**
 * Validates and loads action configuration
 * @returns {Object} Validated configuration
 */
export function loadConfig() {
  try {
    const config = {
      // Required inputs
      githubToken: core.getInput('github-token', { required: true }),
      
      // Optional inputs with defaults
      openaiKey: core.getInput('openai-api-key'),
      model: core.getInput('model') || DEFAULTS.DEFAULT_MODEL,
      maxDiffLines: parseInt(core.getInput('max-diff-lines')) || DEFAULTS.MAX_DIFF_SIZE,
      localModelEndpoint: core.getInput('local-model-endpoint'),
      generateLatexDiff: core.getInput('latex-diff') === 'true',
      showSources: core.getInput('show-sources') === 'true',
      
      // Internal settings
      limits: {
        maxTokensPerRequest: DEFAULTS.MAX_TOKENS_PER_REQUEST,
        maxTotalTokens: DEFAULTS.MAX_TOTAL_TOKENS,
        maxRequestsPerMinute: DEFAULTS.MAX_REQUESTS_PER_MINUTE,
        maxDiffSize: DEFAULTS.MAX_DIFF_SIZE,
        maxFilesPerPr: DEFAULTS.MAX_FILES_PER_PR,
        requestTimeoutMs: DEFAULTS.REQUEST_TIMEOUT_MS
      },
      
      modelSettings: {
        temperature: DEFAULTS.DEFAULT_TEMPERATURE
      },
      
      features: {
        enableLocalModels: DEFAULTS.ENABLE_LOCAL_MODELS,
        enableLatexDiff: DEFAULTS.ENABLE_LATEX_DIFF
      }
    };

    validateConfig(config);
    return config;
    
  } catch (error) {
    core.error('Configuration validation failed:', error);
    throw error;
  }
}

/**
 * Validates configuration values
 * @private
 */
function validateConfig(config) {
  // Validate tokens
  if (config.model !== 'local-model' && !config.openaiKey) {
    throw new Error('OpenAI API key required when not using local model');
  }
  
  if (config.model === 'local-model' && !config.localModelEndpoint) {
    throw new Error('Local model endpoint required when using local model');
  }
  
  // Validate numeric limits
  const numericLimits = [
    'maxTokensPerRequest',
    'maxTotalTokens',
    'maxRequestsPerMinute',
    'maxDiffSize',
    'maxFilesPerPr',
    'requestTimeoutMs'
  ];
  
  for (const limit of numericLimits) {
    if (typeof config.limits[limit] !== 'number' || config.limits[limit] <= 0) {
      throw new Error(`Invalid ${limit} value: must be a positive number`);
    }
  }
  
  // Validate model settings
  if (config.modelSettings.temperature < 0 || config.modelSettings.temperature > 1) {
    throw new Error('Temperature must be between 0 and 1');
  }
}

/**
 * Tracks token usage across requests
 */
export class TokenUsageTracker {
  constructor(maxTotal = DEFAULTS.MAX_TOTAL_TOKENS) {
    this.maxTotal = maxTotal;
    this.used = 0;
    this.requests = [];
  }
  
  /**
   * Records token usage from a request
   * @param {number} tokens - Number of tokens used
   * @throws {Error} If token limit exceeded
   */
  recordUsage(tokens) {
    this.used += tokens;
    this.requests.push({
      tokens,
      timestamp: Date.now()
    });
    
    if (this.used > this.maxTotal) {
      throw new Error(`Token limit exceeded: ${this.used} > ${this.maxTotal}`);
    }
    
    // Clean up old requests
    const oneMinuteAgo = Date.now() - 60000;
    this.requests = this.requests.filter(r => r.timestamp > oneMinuteAgo);
    
    // Check rate limit
    if (this.requests.length > DEFAULTS.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }
  }
  
  /**
   * Gets current token usage statistics
   */
  getStats() {
    return {
      used: this.used,
      remaining: this.maxTotal - this.used,
      requestsLastMinute: this.requests.length
    };
  }
}

/**
 * Sanitizes sensitive data from logs and outputs
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeOutput(text) {
  // List of patterns to redact
  const patterns = [
    // API Keys
    /sk-[a-zA-Z0-9]{32,}/g,
    /ghp_[a-zA-Z0-9]{36}/g,
    
    // URLs with credentials
    /(https?:\/\/)([^:]+):([^@]+)@/g,
    
    // Common environment variable names
    /(?:API_KEY|SECRET|TOKEN|PASSWORD)=\s*["']?[^\s"']+["']?/g
  ];
  
  let sanitized = text;
  
  // Handle URLs with credentials specially
  sanitized = sanitized.replace(/(https?:\/\/)([^:]+):([^@]+)@/g, '$1[REDACTED]@');
  
  // Apply other patterns
  for (const pattern of patterns) {
    if (pattern !== patterns[2]) { // Skip the URL pattern since we handled it
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }
  
  return sanitized;
}
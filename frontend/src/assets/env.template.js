(function(window) {
  window.__env = window.__env || {};

  // API Key from environment variable
  window.__env.apiKey = '${API_KEY}';
  window.__env.recaptchaSiteKey = '${RECAPTCHA_SITE_KEY}';
})(this);

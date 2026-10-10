module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['support/*.js', 'step-definitions/*.js'],
    format: ['progress-bar', 'html:reports/acceptance-report.html', 'json:reports/acceptance-report.json'],
    formatOptions: { snippetInterface: 'async-await' },
  },
};

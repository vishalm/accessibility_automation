/* eslint-disable */
module.exports = {
  clearMocks: true,
  'coverageThreshold': {
    'global': {
      'branches': 100,
      'functions': 100,
      'lines': 100,
      'statements': 100
    }
  },
  coverageDirectory: './reports/coverage/',
  testEnvironment: 'node',
  'reporters': [
    'default',
    ['jest-html-reporters', {
      'publicPath': './reports',
      'filename': 'accessibility-test-report.html',

    }]
  ],
  testRegex: '\.spec\.js$',
  testEnvironmentOptions: {
    "capabilities": {
      "browserName": "chrome"
    },
    "server": "http://localhost:4444/wd/hub",
    "proxyType": "manual",
    "proxyOptions": {
      "https": "http://127.0.0.1:3218"
    }
  }

};
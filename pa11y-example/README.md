<p>
  <a href="https://twitter.com/intent/follow?screen_name=vishalm84"><img align="left" src="https://img.shields.io/twitter/follow/vishalm84.svg?style=social&label=Follow%20@vishalm84" alt="Follow on Twitter"></a>
<br />
</p>

[![Azure Pipeline Build Status](https://dev.azure.com/vishalmishra84/Test%20Project/_apis/build/status/vishalm.accessibility_automation?branchName=master)](https://dev.azure.com/vishalmishra84/Test%20Project/_build/latest?definitionId=1&branchName=master)


[![Travis](https://travis-ci.org/vishalm/accessibility_automation.svg)](https://travis-ci.org/vishalm/accessibility_automation)


## Tech stack
* jest
* selenium-webdriver
* accessibility engine pa11y [Pa11y Github for more action](https://github.com/pa11y/pa11y)
* [Pa11y is your automated accessibility testing pal](http://pa11y.org/)

* Twitter homepage accessibility sample results using pa11y
```js
      { code:
       'WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchID',
      context:
       '<a href="#timeline" class="u-hiddenVisually focusable">Skip to content</a>',
      message:
       'This link points to a named anchor "timeline" within the document, but no anchor exists with that name.',
      type: 'error',
      typeCode: 1,
      selector: 'html > body > a' }
```

## Detail reports are in report folder
* test execution html : accessibility-test-report.html
* Accessibility voilation assessment : twitter-pa11y-report.csv


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
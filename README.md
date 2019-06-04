
<p>
  <a href="https://twitter.com/intent/follow?screen_name=vishalm84"><img align="left" src="https://img.shields.io/twitter/follow/vishalm84.svg?style=social&label=Follow%20@vishalm84" alt="Follow on Twitter"></a>
<br />
</p>

[![Travis](https://travis-ci.org/vishalm/accessibility_automation.svg)](https://travis-ci.org/vishalm/accessibility_automation)

# Accessibility Testing Automation
`Disclamer:
This my personal research I am not representing any organisation or my employer**`
Accessibility
These checks highlight opportunities to improve the accessibility of your web app. Only a subset of accessibility issues can be automatically detected so manual testing is also encouraged.

Helping communities by providing very simple example for accessibility test automation.

## Why

* The whole idea is to shift left accessibility testing.
* One can find examples, samples distributed but this repo will provide correct testing tooling and with: 
  * test framework setup
  * reporting the results
  * tips to add in jenkins pipeline
  * And many more.

## How
  
### Tech Stack
```js
* Intresting findings: Test sample Twitter homepage.
  * AXE can get the same number of violations in headless mode for example
    * Chrome headless : 2
    * Chrome without headless: 2
  * Continuum cannot find any accessibility issue in headless mode : 
    * Chrome headless : 0
    * Chrome without headless : 2
``` 
* node
* javascript stack
* Examples
  * a11y
  * pa11y
  * axe
  * lighthouse
  * continuum
* Test framework
* Jest
  * Browser controle
  * Selenium
  * Webdriverio
  * Puppeteer

* #### axe: Accessibility for Development Teams Start building accessibility into your dev process today
  
  * axe <https://www.deque.com/axe/>
  * The axe team maintains active channels on Gitter and the A11y workspace on Slack.
  * In folder `axe-example`
  
    To execute
    ```js
      cd axe-example
      npm install
      npm run test
    ```
  * Reports
    * in reports folder
    * jest test execution
    * Accessibility violation csv

* #### Continuum: Accessibility for Development Teams Start building accessibility into your dev process today
  
  * continuum accessibility engine continuum from AMP https://www.webaccessibility.com/ Web Accessibility by Level 
  * In folder `continuum-example`
  
    To execute
    ```js
      cd continuum-example
      npm install
      npm run test
    ```
  * Reports
    * in reports folder
    * jest test execution
    * Accessibility violation csv


## Reports

* Default test framework report for jest execution to support CI
* But the important part getting the report of accessibility concerns and all the examples have associated ways to create       CSV reports.

  ### Quick comparision of test sample the count of accessbility found
  |  Accessibility problems found 	| google  	|  twitter 	|   	|   	|
  |---	|---	|---	|---	|---	|
  |  axe 	|  2 	|   2	|   	|   	|
  |  continuum 	|  0 	|  2	|   	|   	|
  |   	|   	|   	|   	|   	|

## Which example to choose.

`This I will leave it to you.`

I have some prefferences but whichever suites you better go ahead and consume.

## Docker support

* Will add more in this section

## Resource

## References

## Usage

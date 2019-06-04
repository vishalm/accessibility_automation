
## Tech stack
* jest
* selenium-webdriver
* accessibility engine continuum from APM https://www.webaccessibility.com/ Web Accessibility by Level Access

* Twitter homepage accessibility result using axe
```js
[ { description:
         'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
        help: 'Elements must have sufficient color contrast',
        helpUrl:
         'https://dequeuniversity.com/rules/axe/2.6/color-contrast?application=axeAPI',
        id: 'color-contrast',
        impact: 'serious',
        nodes: [ [Object] ],
        tags: [ 'cat.color', 'wcag2aa', 'wcag143' ] },
      { description:
         'Ensures a navigation point to the primary content of the page. If the page contains iframes, each iframe should contain either no main landmarks or just one.',
        help: 'Page must contain one main landmark.',
        helpUrl:
         'https://dequeuniversity.com/rules/axe/2.6/landmark-one-main?application=axeAPI',
        id: 'landmark-one-main',
        impact: 'moderate',
        nodes: [ [Object] ],
        tags: [ 'best-practice' ] 
        } 
]
        
```

## Detail reports are in report folder
* test execution html :  continuum-test-report.html
* Accessibility voilation assessment : axe-test-report.html
# Exercise: Web Scraping with SeleniumJS

### [Installation](https://github.com/SeleniumHQ/selenium/tree/trunk/javascript/node/selenium-webdriver#installation)

1. In the web project run `npm install selenium-webdriver @types/selenium-webdriver`
2. Install driver
	1. Check the version of Chrome and [download the corresponding driver](https://github.com/SeleniumHQ/selenium/tree/trunk/javascript/node/selenium-webdriver#installation)
	2. Place in a directory of your choice and add to the path environment variable on Windows.

### Source Code

The [source](./src/index.ts) code demonstrates using SeleniumJS to automate the browser to collect [search results spanning many pages](https://www.financial-ombudsman.org.uk/decisions-case-studies/ombudsman-decisions).  The project used [`ts-node`](./src/package.json) to run the code without a separate transpilation step and [debugging is also supported](./src/.vscode/launch.json) with the correct configuration in [`launch.json`](./src/.vscode/launch.json).

### Resources

Perhaps the best documentation for using this API is [here](https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/).  You can drill into the various components such as the [`WebDriver`](https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html) to see code examples for various methods.  Other good resources include:

- [Tutorials Point](https://www.tutorialspoint.com/selenium_webdriver/selenium_webdriver_introduction.htm) (Python)

### Issues

- Favor sending [Enter key over using click](http://makeseleniumeasy.com/2020/05/25/elementclickinterceptedexception-element-click-intercepted-not-clickable-at-point-other-element-would-receive-the-click/)
- There was a warning saying "*Hotjar not launching due to suspicious userAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ...*" and [this post](https://stackoverflow.com/questions/62475252/hotjar-suspicious-useragent-error-nothing-on-google-trying-to-run-a-python-scr) helped solve it.
- This [post](https://www.guru99.com/checkbox-and-radio-button-webdriver.html) helped with selecting radio buttons and checkboxes as did [this one](https://stackoverflow.com/questions/67205547/selenium-unable-to-click-on-element-using-headless-browser-but-same-code-works).
- There was an issue with content security policy but never resolved it other than running the script repeatedly.  There seemed to be a timing issue.  [This StackOverflow post](https://stackoverflow.com/questions/54980323/refused-to-load-the-script-xyz-js-because-it-violates-the-following-content-se) seems to be one thing to try if a resolution is needed.

### Other Libraries

An interesting exercise would be to attempt to do this same thing using [Microsoft Playwright](https://github.com/microsoft/playwright).
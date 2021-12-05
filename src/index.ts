

// https://www.selenium.dev/selenium/docs/api/javascript/index.html
// https://app.pluralsight.com/library/courses/scraping-dynamic-web-pages-python-selenium/table-of-contents
import { Browser, Builder, By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import Xray from 'x-ray';
import fs from 'fs';

const x = Xray();

const tryGetElement = async (driver: WebDriver, by: By, timeout = 10000, action: (elem: WebElement) => Promise<void>): Promise<WebElement> => {
  try {
    const element = (await driver.wait(until.elementLocated(by), timeout));

    if ((element) && (action)) {
      await action(element);
    }

    return element;
  }
  catch {
    return null;
  }
}

const getDriver = async (): Promise<WebDriver> => {
  const url = 'https://www.financial-ombudsman.org.uk/decisions-case-studies/ombudsman-decisions';
  const options = new Options()
  options.headless();
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.56 Safari/537.36"
  options.addArguments(`user-agent=${userAgent}`)
  const driver = await (new Builder()).setChromeOptions(options).forBrowser(Browser.CHROME).build();
  await driver.get(url);
  return driver;
}

const processOutput = (resultJson: any, isUpheld: boolean) => {
  console.log(`writing results (count:=${resultJson.length})`);
  const upheldText = ((isUpheld) ? 'upheld' : 'notupheld');
  const dir = './results';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  
  const writeJson = () => {
    const filePathJson = `${dir}/results-${upheldText}.json`;

    if (fs.existsSync(filePathJson)) {
      fs.unlinkSync(filePathJson);
    }

    fs.writeFileSync(filePathJson, JSON.stringify(resultJson), 'utf8');
  }

  const writeCsv = () => {
    const filePathCsv = `${dir}/results-${upheldText}.csv`;

    if (fs.existsSync(filePathCsv)) {
      fs.unlinkSync(filePathCsv);
    }

    let csvOuput = '';

    resultJson.forEach((element: any, index: number) => {
      if (index === 0) {
        csvOuput += (Object.keys(element).join(',') + '\n');
      }

      csvOuput += (Object.values(element).map((elem) => `"${elem}"`).join(',') + '\n');
    });

    fs.writeFileSync(filePathCsv, csvOuput, 'utf8');
  }
  
  writeJson();
  writeCsv();
}

const scrapeData = async (): Promise<any> => {
  let resultJson: any[] = [];
  let driver: WebDriver;

  const collectData = async (driver: WebDriver, isUpheld: boolean): Promise<void> => {
    console.log(`collecting ${((isUpheld) ? 'upheld' : 'not upheld')} data ...`);
    let pageCount = 0;

    try {     
      // Submit
      await tryGetElement(driver, By.id('Form_SearchDecisions_action_doSearchDecisions'), 15000, (elem: WebElement): Promise<void> => {
        return elem.sendKeys(Key.RETURN);
      });

      await driver.wait(until.titleIs('Ombudsman decisions'), 15000); 
      
      const parseResult = async (): Promise<void> =>  {
        const tryGetHtml = async (): Promise<string> => {
          const getHtml = async (): Promise<string> => {
            await driver.sleep(1000);

            const by = By.className('search-results');
            
            //console.log('waiting on search results element ...');
            let resultsElement = await driver.wait(until.elementLocated(by), 15000, 'search results element not located');
                        
            //console.log('attempting to extract search results html ...');
            const html = (await resultsElement.getAttribute('innerHTML'));
            //console.log('search results html extracted!');        

            return html;
          }

          try {
            return getHtml();
          }
          catch (err) {
            return getHtml();
          }
        }

        let html = (await tryGetHtml());

        if (!html) {
          return;
        }

        //console.log('attemping to parse search results html ...');
        ++pageCount;

        const results = (await x(html, 'a.search-result', [{
          'decision-ref': 'h4',
          'as-of-date': 'em',
          'ref-url': '@href'
        }]));

        results.forEach((element: any, index: number) => {
          element['decision-ref'] = `${element['decision-ref']}`.replace('Decision Reference ', '').trim();
          element['count'] = (resultJson.length + index);
          element['page'] = pageCount;
          element['is-upheld'] = isUpheld;
        });

        resultJson = resultJson.concat(results);
        console.log(`search results html parsed successfully! (count:=${pageCount}, total=${resultJson.length})`);
      }

      await parseResult();

      const tryNextPage = async (): Promise<boolean> => {
        const getNextPageElement = async (): Promise<WebElement> => {
          //console.log('waiting on next page element ...');
          return (await driver.wait(until.elementLocated(By.className('pager-btn pager-next')), 25000, 'next page element not located'));
        }

        const tryNextPageElement = async (): Promise<WebElement> => {
          for(let x = 0; (x < 2); x++) {
            try {
              return (await getNextPageElement());
            }
            catch (err) {
              if (x > 0) {
                return null;
              }

              console.log(`failed to get next page element.  trying again .... ${err}`);
            }
          }
        }

        const navigateToNextPage = async (): Promise<boolean> => {
          const message = `attempting to navigate to next page ... (count:=${pageCount}) ...`
          const nextPage = (await tryNextPageElement());

          if (!nextPage) {
            console.log(`next page element not found (count:=${pageCount}) ... ending session.`);
            return false;
          }

          console.log(message);
          nextPage.sendKeys(Key.RETURN);
          return true;
        }
        
        return (await navigateToNextPage());
      }

      while(await tryNextPage()) {
        await parseResult();
      }
    } 
    catch (err) {
      console.log(err)
    }

    return Promise.resolve();
  }

  const toggleIsUpheld = async (driver: WebDriver, isUpheld: boolean): Promise<void> => {
    // Set upheld flags
    await tryGetElement(driver, By.id('Form_SearchDecisions_IsUpheld_1'), 15000, async (elem: WebElement): Promise<void> => {
      // https://www.guru99.com/checkbox-and-radio-button-webdriver.html
      let isSelected = (await elem.isSelected());
      console.log(`is-upheld checkbox selected value is '${isSelected}'`);

      const toggle = (((isUpheld) && (!isSelected)) || ((!isUpheld) && (isSelected)));
      
      if (!toggle) {
        console.log(`is-upheld selected checkbox does not need to be toggled`);
        return;
      }

      console.log(`toggling is-upheld (value:=${isSelected})`);
      await elem.click();

      console.log(`waiting on 'is-upheld checkbox' to be selected ...`);
      await driver.wait(until.elementIsSelected(elem), 15000, 'is-upheld checkbox failed to be selected');
      console.log(`'is-upheld checkbox' wait to be selected finished!`);
      
      console.log(`getting is-upheld on value ...`);
      const isSelectedAfter = (await elem.isSelected());
      console.log(`is-upheld checkbox selected value is '${isSelectedAfter}'`);
    });

    // Set upheld flags
    await tryGetElement(driver, By.id('Form_SearchDecisions_IsUpheld_0'), 15000, async (elem: WebElement): Promise<void> => {
      // https://www.guru99.com/checkbox-and-radio-button-webdriver.html
      let isSelected = (await elem.isSelected());
      console.log(`is-not-upheld selected checkbox value is ${isSelected}`);

      const toggle = (((!isUpheld) && (!isSelected)) || ((isUpheld) && (isSelected)));
      
      if (!toggle) {
        console.log(`is-not-upheld selected checkbox does not need to be toggled`);
        return;
      }

      console.log(`toggling is-not-upheld (value:=${isSelected})`);
      await elem.click();

      console.log(`waiting on 'is-not-upheld checkbox' to be selected ...`);
      await driver.wait(until.elementIsSelected(elem), 15000, 'is-not-upheld checkbox failed to be selected');
      console.log(`'is-upheld checkbox' wait to be selected finished!`);
          
      console.log(`getting is-not-upheld on value ...`);
      const isSelectedAfter = (await elem.isSelected());
      console.log(`is-not-upheld checkbox selected value is '${isSelectedAfter}'`);
    });
  }

  try {
    const driver = (await getDriver());

    await tryGetElement(driver, By.id('cookie-accept-button'), 15000, (elem: WebElement): Promise<void> => {
      console.log('dismissing cookie message ...');
      return elem.sendKeys(Key.RETURN);
    });

    // Set search criteria
    await tryGetElement(driver, By.id('Form_SearchDecisions_Keyword'), 15000, (elem: WebElement): Promise<void> => {
      console.log(`setting search term ...`);
      return elem.sendKeys('svr', Key.RETURN);
    });

    let isUpheld = true;
    // await toggleIsUpheld(driver, isUpheld);
    // await collectData(driver, isUpheld);

    isUpheld = false;
    await toggleIsUpheld(driver, isUpheld);
    await collectData(driver, isUpheld);

    processOutput(resultJson, isUpheld);
  }
  finally {
    if (driver) {
      await driver.quit();   
    }
  }

  return resultJson;
}
  
const run = async () => {
  (await scrapeData());
}

run();
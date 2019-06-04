const continuumParserHelper = require('./support/pages/continuum-parser-helper');
const setup = require('./support/pages/setup');
const chai = require('chai');
const expect = chai.expect;
const testParam = 'Accessibility validations using amp continuum for';
const testFor = 'twitter'
describe(`${testParam}`, function () {

  let driver;

  beforeEach(async () => { // eslint-disable-line no-console
    jest.setTimeout(30000);
    driver = await setup.getDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it(`${testFor} home page`, async function () {

    let continuumParser = new continuumParserHelper(driver);

    const pageUrl = await continuumParser.getUrl(testFor);

    await continuumParser.openPage(pageUrl);
    const pageTitle = await continuumParser.getBrowserTitle();

    expect(pageTitle.toLowerCase()).to.contain(testFor);

    let results = await continuumParser.getContinuumParserChecks('twitter');
    console.log(results);
    // Keeping violations count to 2 as twitter homepage have 2 violations
    expect(results.length).to.be.equal(2);

  });

});
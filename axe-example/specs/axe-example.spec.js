const axeParserHelper = require('./support/pages/axe-parser-helper');
const setup = require('./support/pages/setup');
const chai = require('chai');
const expect = chai.expect;
const testParam = 'Accessibility validations using axe for';
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
    let axeParser = new axeParserHelper(driver);

    const pageUrl = await axeParser.getUrl(testFor);

    await axeParser.openPage(pageUrl);
    const pageTitle = await axeParser.getBrowserTitle();

    expect(pageTitle.toLowerCase()).to.contain(testFor);

    let results = await axeParser.getAXEChecksAndReport(testFor);

    // Keeping violations count to 2 as google homepage have 2 violations
    console.log(results.violations.length);

    expect(results.violations.length).to.be.equal(2);

  });

});
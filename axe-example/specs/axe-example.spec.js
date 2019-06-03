const axeParserHelper = require('./support/pages/axe-parser-helper');
const setup = require('./support/pages/setup');
const chai = require('chai');
const expect = chai.expect;
const testParam = 'Accessibility validations for';
describe(`${testParam}`, function () {

    let driver;

    beforeEach(async() => { // eslint-disable-line no-console
        driver = await setup.getDriver();
      });

      afterEach(async () => {
        await driver.quit();
      });
      
    it(`google home page`, async function () {
        let axeParser = new axeParserHelper(driver);

        const pageUrl = await axeParser.getUrl();

        await axeParser.openPage(pageUrl);
        const pageTitle = await axeParser.getBrowserTitle();

        expect(pageTitle).to.contain('Google');

        let results = await axeParser.getAXEChecksAndReport(pageTitle);
        
        // Keeping violations count to 2 as google homepage have 2 violations
        expect(results.violations.length).to.be.eql(2);

    });

});
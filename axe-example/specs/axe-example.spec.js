const publicPage = require('./support/pages/public-pages');

describe("Accessibility validations for", function () {


    it(`google page`, async function () {
        await driver.get('https://en.wikipedia.org/wiki/Base64');
        console.log(browser)
        
        const pageUrl = publicPage.getUrl();
        await publicPage.openPage(pageUrl);
        const pageTitle = await publicPage.getBrowserTitle();
        expect(pageTitle).to.be.present;

        let testName = (this.test.parent.title + ' ' + this.test.title).toLowerCase();

        let results = PublicPage.getAXEChecksAndReport(testName);

        assert.equal(results.violations.length, 0, 'Expected no a11y violations');

    });

});
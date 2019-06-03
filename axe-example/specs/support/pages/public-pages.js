var AxeReports = require('axe-reports');
const axeSource = require('axe-core').source;
const publicUrl = require("../data/url.config")

class PublicPages {

    async openPage(pageUrl) {
        await browser.url(pageUrl);
    }

    getUrl() {
        return publicUrl['publicUrl']['google'];
    }

    async getBrowserTitle() {
        const pageTitle = await driver.title;
        return pageTitle;
    }

    //Need to create a util funtion
    getAXEChecksAndReport(testCaseName) {
        browser.execute(axeSource);
        let results = browser.executeAsync(function (done) {
            // run axe on our site
            axe.run({
                runOnly: {
                    type: 'tags',
                    values: ['wcag2aa', "wcag2a", "section508", "best-practice"]
                },
            }, function (err, results) {
                if (err) done(err)
                done(results);
            });
        });
        console.log("Analyzing AA Result for " + testCaseName.toLowerCase().replace(/ /g, "_"))
        AxeReports.processResults(results, 'csv', "aa-reports/" + testCaseName.toLowerCase().replace(/ /g, "_"), true);

        return results;
    }

}
export default new PublicPages;
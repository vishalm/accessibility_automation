'use strict';

var AxeReports = require('axe-reports');
const axeSource = require('axe-core').source;
const publicUrl = require("../data/url.config")


export default class AxeParserHelper {

    constructor(driver){
        this.driver = driver;
    }

    async openPage(pageUrl) {

        await this.driver.get(pageUrl);
    }

    async getUrl() {
        const url = await publicUrl['publicUrl']['google'];
        return url;
    }

    async getBrowserTitle() {
        const pageTitle = await this.driver.getTitle();
        return pageTitle;
    }

    //Need to create a util funtion
    async getAXEChecksAndReport(testCaseName) {
        await this.driver.executeScript(axeSource);
        let results = await this.driver.executeAsyncScript(function (done) {
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
        await AxeReports.processResults(results, 'csv', `reports/${testCaseName.toLowerCase().replace(/ /g, "_")}-axe-violations`, true);
        console.log(results.violations);
        
        return results;
    }

}
// export default new AxeParserHelper;
module.exports = AxeParserHelper;
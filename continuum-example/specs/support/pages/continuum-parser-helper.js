'use strict';


const publicUrl = require("../data/url.config")
let Continuum = require('../resources/Continuum').Continuum;
var fs = require('fs');

export default class ContinuumParserHelper {

    constructor(driver) {
        this.driver = driver;
    }

    async openPage(pageUrl) {

        await this.driver.get(pageUrl);
    }

    async getUrl(baseApp) {
        const url = await publicUrl['publicUrl'][baseApp];
        return url;
    }

    async getBrowserTitle() {
        const pageTitle = await this.driver.getTitle();
        return pageTitle;
    }

    //Need to create a util funtion
    async getContinuumParserChecks(pageTitle) {
        await Continuum.setUp(this.driver, "./AccessEngine.pro.js", null)
        await Continuum.runAllTests()
        let results = await Continuum.getAccessibilityConcerns();
        this.createReport(results, pageTitle)
        return results;
    }

    createReport(results, pageTitle) {
        var finalResultArray = [];
        if (results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var temp = [];
                //Depends upon the standards on can filter the reports.
                // Removing standard filters for correct comparison among the tools
                // if (JSON.stringify(results[i]._bestPracticeStandards).search('WCAG 2.1')) {
                //     if (!(JSON.stringify(results[i]._bestPracticeStandards).search('AAA') >= 0)) {
                        temp.push(results[i]._path.toString());
                        temp.push(results[i]._element.toString());
                        temp.push(results[i]._attribute.toString());
                        temp.push(results[i]._bestPracticeDescription.toString());
                        temp.push(JSON.stringify(results[i]._bestPracticeStandards));
                        temp.push('**  ');
                        finalResultArray.push(temp);
                    // }}
            }

            const {
                convertArrayToCSV
            } = require('convert-array-to-csv');
            const header = ['page', 'path', 'element', 'attribute', 'bestPracticeDescription', 'Standard', 'Notes-Comments'];

            const csvFromArrayOfObjects = convertArrayToCSV(finalResultArray, {
                header,
                separator: ','
            }); 
            fs.writeFile("reports/" + pageTitle + "-continuum-report.csv", csvFromArrayOfObjects, (err) => {
                if (err) console.log(err);
            });
        }
    }

}
module.exports = ContinuumParserHelper;
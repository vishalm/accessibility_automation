'use strict';

const pa11y = require('pa11y');
const publicUrl = require("../data/url.config")
var fs = require('fs');

export default class Pa11yParserHelper {

    async getUrl(baseApp) {
        const url = await publicUrl['publicUrl'][baseApp];
        return url;
    }

    async runPa11y(url, pageTitle) {
        try {
            const results = await pa11y(url, {
                // Add configs like standared filters etc

            });
            this.createReport(results, pageTitle);
            return results;
        } catch (error) {
            console.log(error)
        }
    }
    createReport(results, pageTitle) {
        var finalResultArray = [];
        if (results['issues'].length > 0) {
            for (var i = 0; i < results['issues'].length; i++) {
                var temp = [];
                // Pushing issues
                temp.push(results['issues'][i]['code']);
                temp.push(results['issues'][i]['context']);
                temp.push(results['issues'][i]['message']);
                temp.push(results['issues'][i]['type']);
                temp.push(results['issues'][i]['selector']);
                temp.push('**  ');
                finalResultArray.push(temp);
            }

            const {
                convertArrayToCSV
            } = require('convert-array-to-csv');
            const header = ['code', 'context', 'message', 'type', 'selector', 'Notes-Comments'];

            const csvFromArrayOfObjects = convertArrayToCSV(finalResultArray, {
                header,
                separator: ','
            });
            fs.writeFile("reports/" + pageTitle + "-pa11y-report.csv", csvFromArrayOfObjects, (err) => {
                if (err) console.log(err);
            });
        }
    }
}
module.exports = Pa11yParserHelper;
const pa11yParserHelper = require('./support/pages/pa11y-parser-helper');
const pa11y = require('pa11y');
const chai = require('chai');
const expect = chai.expect;
const testParam = 'Accessibility validations using pa11y for';
const testFor = 'twitter';
const testForGoogle = 'google';

describe(`${testParam}`, function () {

  beforeEach(async () => { // eslint-disable-line no-console
    jest.setTimeout(30000);
  });

  afterEach(async () => {

  });

  it(`${testFor} home page`, async function () {

    let pa11yParser = new pa11yParserHelper();

    const pageUrl = await pa11yParser.getUrl(testFor);

    let results = await pa11yParser.runPa11y(pageUrl,testFor);

    expect(results['documentTitle'].toLowerCase()).to.contain(testFor);

    expect(results['issues'].length).to.be.equal(52);

  });

  it(`${testForGoogle} home page`, async function () {

    let pa11yParser = new pa11yParserHelper();

    const pageUrl = await pa11yParser.getUrl(testForGoogle);

    let results = await pa11yParser.runPa11y(pageUrl,testForGoogle);
    
    expect(results['documentTitle'].toLowerCase()).to.contain(testForGoogle);

    // expect(results['issues'].length).to.be.equal(3);

  });

});
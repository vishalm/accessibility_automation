'use strict';

// For Chrome

let webdriver = require('selenium-webdriver');
let chrome    = require('selenium-webdriver/chrome');
let path      = require('chromedriver').path;
let service   = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

let buildChromeDriver = async function () { // eslint-disable-line
	return await new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome({})).build();
};

let driver = buildChromeDriver();

let getDriver = async function () {
	return await driver;
};

module.exports.getDriver = getDriver;
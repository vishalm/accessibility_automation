'use strict';

// For Chrome

let webdriver = require('selenium-webdriver');
let chrome    = require('selenium-webdriver/chrome');
let path      = require('chromedriver').path;
let service   = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

let buildChromeDriver = async function () { // eslint-disable-line
	var chromeCapabilities = webdriver.Capabilities.chrome();
	//setting chrome options to start the browser fully maximized
	var chromeOptions = {
		// 'args': ['--test-type', '--start-maximized','--headless','--disable-gpu']
		//in headless mode getting less accessibity issues
		'args': ['--test-type', '--start-maximized','--disable-gpu']
	};
	chromeCapabilities.set('chromeOptions', chromeOptions);
	return await new webdriver.Builder().withCapabilities(chromeCapabilities).build();
};

let driver = buildChromeDriver();

let getDriver = async function () {
	return await driver;
};

module.exports.getDriver = getDriver;
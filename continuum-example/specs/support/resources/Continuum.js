'use strict';

/**
 * The host of the AMP instance to fetch best practice data from.
 *
 * @private
 * @type {string}
 */
const AMP_HOST = "amp.levelaccess.net";

/**
 * The AMP API token of the user to use to authenticate any requests to AMP that require authentication, e.g. creating/editing reports in AMP from Continuum as part of submitting test results from Continuum to AMP.
 * Set to null if you don't have an AMP API token to use or otherwise don't want to use one.
 *
 * @private
 * @type {?string}
 */
const AMP_API_TOKEN = null;

/**
 * An array of IDs of the accessibility standards to test for by default (invoke {@link Continuum#getSupportedStandards} for a list of these).
 * Set to null to not filter by any accessibility standards by default.
 *
 * @private
 * @type {?number[]}
 */
const DEFAULT_ACCESSIBILITY_STANDARD_IDS = [
	1140, /* Section 508 and 255 (Revised 2017) */
	610, /* WCAG 2.0 Level A */
	1471, /* WCAG 2.0 Level A & AA Baseline */
	611, /* WCAG 2.0 Level AA */
	612, /* WCAG 2.0 Level AAA */
	1387, /* WCAG 2.1 Level A */
	1388, /* WCAG 2.1 Level AA */
	1389, /* WCAG 2.1 Level AAA */
];

/**
 * The IP address or hostname of the desired proxy to route all network traffic from Continuum through.
 * Set to null if you don't want to use a proxy, otherwise this property is required.
 * Note: proxying only works in a server-side JavaScript context, i.e. when initializing Continuum using a WebDriver and not a Window object, due to browser limitations.
 *
 * @private
 * @type {?string}
 */
const PROXY_HOST = null;

/**
 * The port of the desired proxy to route all network traffic from Continuum through.
 * Set to null if you don't want to use a proxy, otherwise this property is required.
 * Note: proxying only works in a server-side JavaScript context, i.e. when initializing Continuum using a WebDriver and not a Window object, due to browser limitations.
 *
 * @private
 * @type {?number}
 */
const PROXY_PORT = null;

/**
 * The username for the desired proxy to route all network traffic from Continuum through.
 * Set to null if your proxy does not require a username, or if you don't want to use a proxy.
 * Note: proxying only works in a server-side JavaScript context, i.e. when initializing Continuum using a WebDriver and not a Window object, due to browser limitations.
 *
 * @private
 * @type {?string}
 */
const PROXY_USERNAME = null;

/**
 * The password for the desired proxy to route all network traffic from Continuum through.
 * Set to null if your proxy does not require a password, or if you don't want to use a proxy.
 * Note: proxying only works in a server-side JavaScript context, i.e. when initializing Continuum using a WebDriver and not a Window object, due to browser limitations.
 *
 * @private
 * @type {?string}
 */
const PROXY_PASSWORD = null;

// media type IDs as defined in AMP
const WEB_MEDIA_TYPE_ID = 1;

/**
 * This class encapsulates all of the helper functionality Access Continuum offers for running Access Engine to test web projects.
 *
 * @hideconstructor
 */
class Continuum {

	/**
	 * @constructor
	 * @returns {Continuum}
	 */
	constructor() {
		if (!Continuum.instance) {
			this._accessEngineCode = null;
			this._accessibilityConcerns = null;
			this._includePotentialAccessibilityConcerns = false;

			this._driver = null;
			this._locationPath = null;
			this._windowUnderTest = null;

			this._bestPracticeDataById = {};

			this._webBestPracticeIds = [];
			this._webTestNameById = {};
			this._webBestPracticeNameById = {};
			this._webStandardNameById = {};

			this._AMPReportingService = new AMPReportingService(this._driver, this._windowUnderTest);
			Continuum.instance = this;
		}
	}

	/**
	 * @private
	 * @returns {string}
	 */
	get accessEngineCode() {
		return this._accessEngineCode;
	}

	set accessEngineCode(accessEngineCode) {
		this._accessEngineCode = accessEngineCode;
	}

	/**
	 * @private
	 * @returns {AccessibilityConcern[]}
	 */
	get accessibilityConcerns() {
		return this._accessibilityConcerns;
	}

	set accessibilityConcerns(accessibilityConcerns) {
		this._accessibilityConcerns = accessibilityConcerns;
	}

	/**
	 * Defines whether or not accessibility concerns that require manual review are included in any of Continuum's test results.
	 * This functionality is disabled by default, but it can be enabled via {@link Continuum#setIncludePotentialAccessibilityConcerns}.
	 * If enabled, any accessibility concerns that require manual review will have {@link AccessibilityConcern#needsReview} return true.
	 *
	 * @returns {boolean}
	 */
	get includePotentialAccessibilityConcerns() {
		return this._includePotentialAccessibilityConcerns;
	}

	/**
	 * Globally sets whether or not accessibility concerns that require manual review are included in any of Continuum's test results.
	 * If enabled, any accessibility concerns that require manual review will have {@link AccessibilityConcern#needsReview} return true.
	 *
	 * This method is only available in the Pro edition of Continuum, otherwise it will return a Promise that rejects immediately.
	 *
	 * @param {boolean} includePotentialAccessibilityConcerns - whether or not accessibility concerns that require manual review should be returned in any of Continuum's test results
	 * @returns {Promise}
	 */
	async setIncludePotentialAccessibilityConcerns(includePotentialAccessibilityConcerns) {
		if (!this.locationPath.endsWith("AccessEngine.js")) {
			console.log("setIncludePotentialAccessibilityConcerns() is not available in the Community edition of Continuum. Please upgrade to the Pro edition of Continuum for access to this method.");
			return new Promise((resolve, reject) => {
				reject();
			});
		}

		this._includePotentialAccessibilityConcerns = includePotentialAccessibilityConcerns;

		// Continuum needs to be reinitialized to properly propagate the changes above
		return this.setUp(this.driver, this.locationPath, this.windowUnderTest);
	}

	/**
	 * @private
	 * @returns {*}
	 */
	get driver() {
		return this._driver;
	}

	set driver(driver) {
		this._driver = driver;
		this.AMPReportingService.driver = driver;
	}

	/**
	 * @private
	 * @returns {string}
	 */
	get locationPath() {
		return this._locationPath;
	}

	set locationPath(locationPath) {
		this._locationPath = locationPath;
	}

	/**
	 * @private
	 * @returns {Window}
	 */
	get windowUnderTest() {
		return this._windowUnderTest;
	}

	set windowUnderTest(window) {
		this._windowUnderTest = window;
		this.AMPReportingService.windowUnderTest = window;
	}

	/**
	 * @private
	 * @returns {object}
	 */
	get bestPracticeDataById() {
		return this._bestPracticeDataById;
	}

	set bestPracticeDataById(bestPracticeDataById) {
		this._bestPracticeDataById = bestPracticeDataById;
	}

	/**
	 * @private
	 * @returns {number[]}
	 */
	get webBestPracticeIds() {
		return this._webBestPracticeIds;
	}

	set webBestPracticeIds(webBestPracticeIds) {
		this._webBestPracticeIds = webBestPracticeIds;
	}

	/**
	 * @private
	 * @returns {object}
	 */
	get webTestNameById() {
		return this._webTestNameById;
	}

	set webTestNameById(webTestNameById) {
		this._webTestNameById = webTestNameById;
	}

	/**
	 * @private
	 * @returns {object}
	 */
	get webBestPracticeNameById() {
		return this._webBestPracticeNameById;
	}

	set webBestPracticeNameById(webBestPracticeNameById) {
		this._webBestPracticeNameById = webBestPracticeNameById;
	}

	/**
	 * @private
	 * @returns {object}
	 */
	get webStandardNameById() {
		return this._webStandardNameById;
	}

	set webStandardNameById(webStandardNameById) {
		this._webStandardNameById = webStandardNameById;
	}

	/**
	 * Gets the instance of the AMP reporting service associated with this instance of Continuum.
	 * Please consult our support documentation for more information on how to report to AMP.
	 *
	 * @returns {AMPReportingService} the AMP reporting service associated with this instance of Continuum
	 */
	get AMPReportingService() {
		return this._AMPReportingService;
	}

	set AMPReportingService(AMPReportingService) {
		this._AMPReportingService = AMPReportingService;
	}

	/**
	 * Retrieves the Access Engine file contents from a local directory
	 *
	 * @private
	 */
	_retrieveAccessEngineCode() {
		if (typeof require === 'undefined') {
			// we assume Access Engine was already injected by something externally if we're not able to inject it from here
			return false;
		}

		const filePath = require('path').resolve(__dirname, this.locationPath);
		this.accessEngineCode = Continuum._createInjectableAccessEngineCode(require('fs').readFileSync(filePath, 'utf8'));
		return true;
	}

	/**
	 * Creates injectable Access Engine code from the specified Access Engine code to allow it to be injected into a page and used.
	 *
	 * @private
	 * @param {string} accessEngineCode - Access Engine JavaScript code
	 * @returns {string}
	 */
	static _createInjectableAccessEngineCode(accessEngineCode) {
		accessEngineCode += "window.LevelAccess_AccessEngine=LevelAccess_AccessEngine;";
		return accessEngineCode;
	}

	/**
	 * Injects Access Engine JavaScript code into the page currently under test, if necessary; if it's already injected, we do nothing.
	 * In a client-side JavaScript context, e.g. Karma, this function does nothing; it is assumed Access Engine has already been injected into the page through some other means.
	 *
	 * @private
	 */
	_injectAccessEngine() {
		return new Promise((resolve, reject) => {
			if (!this.accessEngineCode) {
				this._retrieveAccessEngineCode();
			}

			if (this.accessEngineCode) {
				if (this.driver) {
					this.driver.executeScript(this.accessEngineCode).then((outcome) => {
						resolve();
					});
				} else if (this.windowUnderTest) {
					const hasEngineAlreadyBeenInjected = !!this.windowUnderTest.LevelAccess_AccessEngine;
					if (!hasEngineAlreadyBeenInjected) {
						this.windowUnderTest.eval(this.accessEngineCode);
					}

					resolve();
				} else {
					reject();
				}
			} else {
				// assume that if invoking _retrieveAccessEngineCode failed, it's okay,
				// e.g. we could be in a client-side environment and thus injection from here is not possible,
				// thus we rely on something external to inject Access Engine for us prior to invoking Continuum
				resolve();
			}
		});
	}

	/**
	 * Gets test info from Access Engine as a JSON object whose keys are test IDs and values are metadata for the given test.
	 *
	 * @private
	 * @returns {object}
	 */
	async _getTestInfo() {
		await this._injectAccessEngine();

		let data;
		if (this.driver) {
			const testTypeJsonArrayString = this.includePotentialAccessibilityConcerns ? "[4,5]" : "[4]";
			data = await this.driver.executeScript(`return LevelAccess_AccessEngine.getTestInfo({testType:${testTypeJsonArrayString},columns:[\"description\",\"bestPractice\",\"mediaType\"]});`);
			return data;
		} else if (this.windowUnderTest) {
			const testTypeJsonArray = this.includePotentialAccessibilityConcerns ? [4,5] : [4];
			data = this.windowUnderTest.LevelAccess_AccessEngine.getTestInfo({
				testType: testTypeJsonArray,
				columns: ["description", "bestPractice", "mediaType"]
			});
			return data;
		}
	}

	/**
	 * Attempts to fetch best practice data from the AMP instance specified by AMP_HOST.
	 * If this data cannot be fetched from AMP within a timeout period of 10 seconds, this method fails gracefully, outputting any errors to the console.
	 *
	 * @private
	 * @returns {object}
	 */
	async _fetchBestPracticeData() {
		const bestPracticeData = await NetworkUtil.getFromAMP('/api/cont/bestpractices', null, false, this.driver, this.windowUnderTest);

		for (let i = 0; i < bestPracticeData.length; i++) {
			const data = bestPracticeData[i];

			const bestPracticeId = parseInt(data.bestPracticeID, 10);
			if (bestPracticeId == null) {
				continue;
			}

			const bestPracticeName = data.name;

			this.bestPracticeDataById[bestPracticeId] = data;

			if (this.webBestPracticeIds.includes(bestPracticeId)) {
				this.webBestPracticeNameById[bestPracticeId] = bestPracticeName;
			}

			if (data.standards) {
				const standards = [];
				Object.keys(data.standards).forEach((standardIdString) => {
					if (standardIdString && data.standards[standardIdString]) {
						const standardId = parseInt(standardIdString, 10);
						const standardName = data.standards[standardIdString].trim();

						if (!DEFAULT_ACCESSIBILITY_STANDARD_IDS || DEFAULT_ACCESSIBILITY_STANDARD_IDS.includes(standardId)) {
							standards.push({
								id: standardId,
								name: standardName
							});
						}

						if (this.webBestPracticeIds.includes(bestPracticeId)) {
							this.webStandardNameById[standardId] = standardName;
						}
					}
				});
				standards.sort((a, b) => a.name.localeCompare(b.name));
				data.standards = standards;
			}
		}
	}

	/**
	 * Converts a raw JSON string of test results from Access Engine to an array of accessibility concerns.
	 *
	 * @private
	 * @param {string} results - a raw JSON string of test results from Access Engine
	 * @returns {AccessibilityConcern[]}
	 */
	_convertAccessEngineResultsToAccessibilityConcerns(results) {
		if (!results) {
			return null;
		}
		const resultsJson = JSON.parse(results);

		const accessibilityConcerns = [];

		for (let i = 0; i < resultsJson.length; i++) {
			const result = resultsJson[i];
			const transformedResult = {};

			transformedResult.bestPracticeId = parseInt(result.bestPracticeId, 10) || null;
			transformedResult.engineTestId = parseInt(result.engineTestId, 10) || null;

			transformedResult.needsReview = (result.testResult === 3);

			const bestPracticeData = this.bestPracticeDataById[transformedResult.bestPracticeId];
			if (bestPracticeData) {
				transformedResult.bestPracticeDescription = bestPracticeData.name;
				transformedResult.severity = parseInt(bestPracticeData.severity, 10) || null;
				transformedResult.noticeability = parseInt(bestPracticeData.noticeability, 10) || null;
				transformedResult.tractability = parseInt(bestPracticeData.tractability, 10) || null;
				transformedResult.bestPracticeDetailsUrl = bestPracticeData.href;
				transformedResult.bestPracticeStandards = bestPracticeData.standards;
			}

			const accessibilityConcern = new AccessibilityConcern(
				result.path, transformedResult.engineTestId, result.attributeDetail,
				transformedResult.bestPracticeId, result.element, result.fixType,
				transformedResult.needsReview, result, transformedResult.bestPracticeDescription,
				transformedResult.severity, transformedResult.noticeability, transformedResult.tractability,
				transformedResult.bestPracticeDetailsUrl, transformedResult.bestPracticeStandards);
			accessibilityConcerns.push(accessibilityConcern);
		}
		return accessibilityConcerns;
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified accessibility standards against the current page for only the specified node and all its children.
	 * Note that the IDs of the specified accessibility standards must also be specified in {@link DEFAULT_ACCESSIBILITY_STANDARD_IDS}, otherwise no accessibility concerns will be returned.
	 *
	 * @private
	 * @param {number[]} standardIds - the IDs of the accessibility standards to test for (invoke {@link Continuum#getSupportedStandards} for a list of these)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_testForStandardsImpl(standardIds, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (standardIds != null && results != null) {
				results.forEach((result) => {
					const bestPracticeStandardIds = result.bestPracticeStandards ? result.bestPracticeStandards.map(x => x.id) : [];
					if (bestPracticeStandardIds.some(x => standardIds.includes(x))) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified best practices against the current page for only the specified node and all its children.
	 *
	 * @private
	 * @param {number[]} bestPracticeIds - the IDs of the best practices to test for (invoke {@link Continuum#getSupportedBestPractices} for a list of these, or consult AMP)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_testForBestPracticesImpl(bestPracticeIds, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (bestPracticeIds != null && results != null) {
				results.forEach((result) => {
					if (bestPracticeIds.includes(result.bestPracticeId)) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/**
	 * Runs only the specified Access Engine tests against the current page for only the specified node and all its children.
	 *
	 * @private
	 * @param {number[]} accessEngineTestIds - the IDs of the automatic Access Engine tests to test for (invoke {@link Continuum#getSupportedTests} for a list of these, or consult AMP)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_runTestsImpl(accessEngineTestIds, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (accessEngineTestIds != null && results != null) {
				results.forEach((result) => {
					if (accessEngineTestIds.includes(result.engineTestId)) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified severity against the current page for only the specified node and all its children.
	 *
	 * @private
	 * @param {number} minSeverity - the inclusive minimum severity of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_testForSeverityImpl(minSeverity, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (minSeverity != null && results != null) {
				results.forEach((result) => {
					if (result.severity && result.severity >= minSeverity) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified tractability against the current page for only the specified node and all its children.
	 *
	 * @private
	 * @param {number} minTractability - the inclusive minimum tractability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_testForTractabilityImpl(minTractability, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (minTractability != null && results != null) {
				results.forEach((result) => {
					if (result.tractability && result.tractability >= minTractability) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified noticeability against the current page for only the specified node and all its children.
	 *
	 * @private
	 * @param {number} minNoticeability - the inclusive minimum noticeability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	_testForNoticeabilityImpl(minNoticeability, targetNodeOrCssSelectorForTargetNode) {
		const filterResults = (results) => {
			const filteredAccessibilityConcerns = [];
			if (minNoticeability != null && results != null) {
				results.forEach((result) => {
					if (result.noticeability && result.noticeability >= minNoticeability) {
						filteredAccessibilityConcerns.push(result);
					}
				});
			}
			return filteredAccessibilityConcerns;
		};

		return new Promise((resolve, reject) => {
			if (targetNodeOrCssSelectorForTargetNode == null) {
				this.runAllTests().then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			} else {
				this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode).then((results) => {
					this.accessibilityConcerns = filterResults(results);
					resolve(this.accessibilityConcerns);
				});
			}
		});
	}

	/////
	// API Functions

	/**
	 * Sets up Continuum for web testing.
	 *
	 * @param {*} webDriver - a Selenium web driver to test with
	 * @param {string} locationPath - the relative path to an Access Engine JavaScript file, i.e. either AccessEngine.pro.js or AccessEngine.js for the Community or Pro editions of Continuum, respectively.
	 * @param {Window} window - the window whose content should be tested
	 */
	async setUp(webDriver, locationPath, window) {
		this.driver = webDriver;
		this.locationPath = locationPath;
		this.windowUnderTest = window;

		this._retrieveAccessEngineCode();

		let testDataFetched = false;
		try {
			// inject Engine and fetch info about its automatic tests
			const testInfo = await this._getTestInfo();

			// parse and bucket test info by platform
			if (testInfo != null) {
				Object.keys(testInfo).forEach((testIdString) => {
					const testId = parseInt(testIdString, 10);
					const testInfoData = testInfo[testId];

					if (testInfoData.mediaType === 1) {
						const bestPracticeId = parseInt(testInfoData.bestPractice, 10);
						this.webBestPracticeIds.push(bestPracticeId);
						this.webTestNameById[testId] = testInfoData.description;
					}
				});

				testDataFetched = true;
			}
		} catch (err) {
			console.log(err);
		} finally {
			if (!testDataFetched) {
				console.log("Failed to fetch info about tests supported by Access Engine! Continuum is now operating in a degraded state; getSupportedTests(), getSupportedBestPractices(), and getSupportedStandards() will not return any data.");
			}
		}

		try {
			// prefetch best practice data from AMP
			await this._fetchBestPracticeData();
		} catch (err) {
			console.log("Failed to fetch enriched best practice data from AMP! Continuum is now operating in a degraded state; both getSupportedBestPractices() and getSupportedStandards() will not return any data, and accessibility concerns returned by Continuum will not be enriched with corresponding best practice data from AMP.", err);
		}
	}

	/**
	 * Sets the window to test.
	 * This can be used to set the testing context to the contents of an iframe element on the page, rather than the page an iframe element appears on.
	 *
	 * @param {Window} targetWindow - the window to inject Access Engine into and prepare to test
	 * @returns {Promise}
	 */
	setWindowUnderTest(targetWindow) {
		return new Promise((resolve, reject) => {
			const injectAccessEngine = this._injectAccessEngine();

			const execApi = new Promise((resolve, reject) => {
				if (this.driver) {
					// not supported
					reject();
				} else if (this.windowUnderTest) {
					this.windowUnderTest.LevelAccess_AccessEngine.setWindowUnderTest(targetWindow);
					resolve();
				} else {
					reject();
				}
			});

			const arr = [injectAccessEngine, execApi];
			Promise.all(arr).then(() => {
				resolve();
			});
		});
	}

	/**
	 * Runs all automatic Access Engine tests against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @returns {Promise}
	 */
	runAllTests() {
		return new Promise((resolve, reject) => {
			const injectAccessEngine = this._injectAccessEngine();

			const execApi = new Promise((resolve, reject) => {
				if (this.driver) {
					const testTypeJsonArrayString = this.includePotentialAccessibilityConcerns ? "[4,5]" : "[4]";
					this.driver.executeScript(`return LevelAccess_AccessEngine.ast_runAllTests_returnInstances_JSON(${testTypeJsonArrayString});`).then((outcome) => {
						this.accessibilityConcerns = this._convertAccessEngineResultsToAccessibilityConcerns(outcome);
						resolve(this.accessibilityConcerns);
					});
				} else if (this.windowUnderTest) {
					const testTypeJsonArray = this.includePotentialAccessibilityConcerns ? [4,5] : [4];
					this.accessibilityConcerns = this._convertAccessEngineResultsToAccessibilityConcerns(this.windowUnderTest.LevelAccess_AccessEngine.ast_runAllTests_returnInstances_JSON(testTypeJsonArray));
					resolve(this.accessibilityConcerns);
				} else {
					reject();
				}
			});

			const arr = [injectAccessEngine, execApi];
			Promise.all(arr).then(() => {
				resolve(this.accessibilityConcerns);
			});
		});
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified accessibility standards against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Note that the IDs of the specified accessibility standards must also be specified in {@link DEFAULT_ACCESSIBILITY_STANDARD_IDS}, otherwise no accessibility concerns will be returned.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} standardIds - the IDs of the accessibility standards to test for (invoke {@link Continuum#getSupportedStandards} for a list of these, or consult AMP)
	 * @returns {Promise}
	 */
	testForStandards(standardIds) {
		return this._testForStandardsImpl(standardIds, null);
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified best practices against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} bestPracticeIds - the IDs of the best practices to test for (invoke {@link Continuum#getSupportedBestPractices} for a list of these, or consult AMP)
	 * @returns {Promise}
	 */
	testForBestPractices(bestPracticeIds) {
		return this._testForBestPracticesImpl(bestPracticeIds, null);
	}

	/**
	 * Runs only the specified automatic Access Engine tests against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} engineTestIds - the IDs of the automatic Access Engine tests to test for (invoke {@link Continuum#getSupportedTests} for a list of these, or consult AMP)
	 * @returns {Promise}
	 */
	runTests(engineTestIds) {
		return this._runTestsImpl(engineTestIds, null);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified severity against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minSeverity - the inclusive minimum severity of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @returns {Promise}
	 */
	testForSeverity(minSeverity) {
		return this._testForSeverityImpl(minSeverity, null);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified tractability against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minTractability - the inclusive minimum tractability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @returns {Promise}
	 */
	testForTractability(minTractability) {
		return this._testForTractabilityImpl(minTractability, null);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified noticeability against the current page, as defined by the web driver used previously to invoke {@link Continuum#setUp}.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minNoticeability - the inclusive minimum noticeability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @returns {Promise}
	 */
	testForNoticeability(minNoticeability) {
		return this._testForNoticeabilityImpl(minNoticeability, null);
	}

	/**
	 * Runs all automatic Access Engine tests against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode) {
		return new Promise((resolve, reject) => {
			const injectAccessEngine = this._injectAccessEngine();

			const execApi = new Promise((resolve, reject) => {
				if (this.driver) {
					if (typeof targetNodeOrCssSelectorForTargetNode === 'string' || targetNodeOrCssSelectorForTargetNode instanceof String) {
						const cssSelectorForTargetNode = targetNodeOrCssSelectorForTargetNode;
						const script = this.includePotentialAccessibilityConcerns ? `return LevelAccess_AccessEngine.ast_runAllTests_returnInstances_JSON_NodeCapture(document.querySelector("${cssSelectorForTargetNode}"),[4,5]);` : `return LevelAccess_AccessEngine.runAllTests_returnInstances_JSON_NodeCapture(document.querySelector("${cssSelectorForTargetNode}"));`;

						this.driver.executeScript(script).then((outcome) => {
							this.accessibilityConcerns = this._convertAccessEngineResultsToAccessibilityConcerns(outcome);
							resolve(this.accessibilityConcerns);
						});
					} else {
						// not supported
						reject();
					}
				} else if (this.windowUnderTest) {
					let targetNode;
					if (typeof targetNodeOrCssSelectorForTargetNode === 'string' || targetNodeOrCssSelectorForTargetNode instanceof String) {
						targetNode = document.querySelector(cssSelectorForTargetNode);
					} else {
						targetNode = targetNodeOrCssSelectorForTargetNode;
					}

					let results;
					if (this.includePotentialAccessibilityConcerns) {
						results = this.windowUnderTest.LevelAccess_AccessEngine.ast_runAllTests_returnInstances_JSON_NodeCapture(targetNode, [4, 5]);
					} else {
						results = this.windowUnderTest.LevelAccess_AccessEngine.runAllTests_returnInstances_JSON_NodeCapture(targetNode);
					}
					this.accessibilityConcerns = this._convertAccessEngineResultsToAccessibilityConcerns(results);

					resolve(this.accessibilityConcerns);
				} else {
					reject();
				}
			});

			const arr = [injectAccessEngine, execApi];
			Promise.all(arr).then(() => {
				resolve(this.accessibilityConcerns);
			});
		});
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified accessibility standards against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Note that the IDs of the specified accessibility standards must also be specified in {@link DEFAULT_ACCESSIBILITY_STANDARD_IDS}, otherwise no accessibility concerns will be returned.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} standardIds - the IDs of the accessibility standards to test for (invoke {@link Continuum#getSupportedStandards} for a list of these, or consult AMP)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	testNodeForStandards(standardIds, targetNodeOrCssSelectorForTargetNode) {
		return this._testForStandardsImpl(standardIds, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Runs only the automatic Access Engine tests corresponding to the specified best practices against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} bestPracticeIds - the IDs of the best practices to test for (invoke {@link Continuum#getSupportedBestPractices} for a list of these, or consult AMP)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	testNodeForBestPractices(bestPracticeIds, targetNodeOrCssSelectorForTargetNode) {
		return this._testForBestPracticesImpl(bestPracticeIds, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Runs only the specified automatic Access Engine tests against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number[]} engineTestIds - the IDs of the automatic Access Engine tests to test for (invoke {@link Continuum#getSupportedTests} for a list of these, or consult AMP)
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	runTestsOnNode(engineTestIds, targetNodeOrCssSelectorForTargetNode) {
		return this._runTestsImpl(engineTestIds, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified severity against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minSeverity - the inclusive minimum severity of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	testNodeForSeverity(minSeverity, targetNodeOrCssSelectorForTargetNode) {
		return this._testForSeverityImpl(minSeverity, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified tractability against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minTractability - the inclusive minimum tractability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	testNodeForTractability(minTractability, targetNodeOrCssSelectorForTargetNode) {
		return this._testForTractabilityImpl(minTractability, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Runs only the automatic Access Engine tests of or greater than the specified noticeability against the current page for only the specified node and all its children, as defined by the web driver used previously to invoke {@link Continuum#setUp} and the specified node or its CSS selector.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @param {number} minNoticeability - the inclusive minimum noticeability of accessibility concerns to test for on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable
	 * @param {(Element|string)} targetNodeOrCssSelectorForTargetNode - the target node, or its CSS selector, to restrict accessibility testing to
	 * @returns {Promise}
	 */
	testNodeForNoticeability(minNoticeability, targetNodeOrCssSelectorForTargetNode) {
		return this._testForNoticeabilityImpl(minNoticeability, targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * Gets an object of key-value pairs, where the keys are IDs of accessibility standards (defined in AMP and supported by Continuum) and the values are their names.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @returns {object}
	 */
	getSupportedStandards() {
		return this.webStandardNameById;
	}

	/**
	 * Gets an object of key-value pairs, where the keys are IDs of best practices (defined in AMP and supported by Continuum) and the values are their descriptions.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @returns {object}
	 */
	getSupportedBestPractices() {
		return this.webBestPracticeNameById;
	}

	/**
	 * Gets an object of key-value pairs, where the keys are IDs of automatic Access Engine tests (supported by Continuum) and the values are their descriptions.
	 * Make sure to invoke this {@link Continuum#setUp} method before invoking this method.
	 *
	 * @returns {object}
	 */
	getSupportedTests() {
		return this.webTestNameById;
	}

	/**
	 * Gets the list of accessibility concerns found by Access Engine during the last test execution.
	 *
	 * @returns {AccessibilityConcern[]}
	 */
	getAccessibilityConcerns() {
		return this.accessibilityConcerns;
	}

	/////
	// Deprecated API Functions

	/**
	 * @ignore
	 * @deprecated Renamed for clarity; use {@link Continuum#runAllTests} instead.
	 */
	runAllTests_returnInstances_JSON(callback) {
		return this.runAllTests();
	}

	/**
	 * @ignore
	 * @deprecated Renamed for clarity; use {@link Continuum#runAllTestsOnNode} instead.
	 */
	runAllTests_returnInstances_JSON_NodeCapture(targetNodeOrCssSelectorForTargetNode, callback) {
		return this.runAllTestsOnNode(targetNodeOrCssSelectorForTargetNode);
	}

	/**
	 * @ignore
	 * @deprecated Renamed for clarity; use {@link Continuum#getAccessibilityConcerns} instead.
	 */
	getA11yResults() {
		return this.getAccessibilityConcerns();
	}
}

/**
 * This class represents an accessibility concern identified by Access Engine.
 * At minimum, it contains both information about the concern that was identified and well as where on the page the problem is located.
 * It may also include best practice data from AMP, e.g. how severe or noticeable the issue might be, along with an AMP URL that can be visited for more info.
 */
class AccessibilityConcern {

	/**
	 * @constructor
	 * @param {string} path - a CSS selector to the element with this accessibility concern
	 * @param {number} engineTestId - the automatic Access Engine test ID that failed and produced this accessibility concern
	 * @param {string} attribute - a brief human-readable description of this accessibility concern
	 * @param {number} bestPracticeId - the best practice ID that corresponds to this accessibility concern
	 * @param {string} element - the source code of the HTML node corresponding to this accessibility concern
	 * @param {FixType} fixType - the remediation steps suggested by Access Engine for resolving this accessibility concern
	 * @param {boolean} needsReview - whether or not this accessibility concern requires manual review
	 * @param {object} rawEngineJsonObject - the raw JSON object from Access Engine that was originally used to build this accessibility concern
	 * @param {string} bestPracticeDescription - the name of the best practice that corresponds to this accessibility concern
	 * @param {number} severity - the severity of the best practice that corresponds to this accessibility concern
	 * @param {number} noticeability - the noticeability of the best practice that corresponds to this accessibility concern
	 * @param {number} tractability - the tractability of the best practice that corresponds to this accessibility concern
	 * @param {string} bestPracticeDetailsUrl - the URL of the best practice page in AMP that corresponds to this accessibility concern
	 * @param {Standard[]} bestPracticeStandards - the array of accessibility standards associated with the best practice that corresponds to this accessibility concern
	 * @returns {AccessibilityConcern}
	 */
	constructor(path, engineTestId, attribute, bestPracticeId, element, fixType, needsReview, rawEngineJsonObject, bestPracticeDescription, severity, noticeability, tractability, bestPracticeDetailsUrl, bestPracticeStandards) {
		this._path = path;
		this._engineTestId = engineTestId;
		this._attribute = attribute;
		this._bestPracticeId = bestPracticeId;
		this._element = element;
		this._fixType = (fixType != null && (fixType.domSpec != null || fixType.helperText != null)) ? new FixType(fixType.domSpec, fixType.helperText) : null;

		// enriched data from Continuum (that may be derived from Engine)
		this._needsReview = needsReview;
		this._rawEngineJsonObject = rawEngineJsonObject;

		// optional: enriched best practice data from AMP
		this._bestPracticeDescription = bestPracticeDescription || null;
		this._severity = severity || null;
		this._noticeability = noticeability || null;
		this._tractability = tractability || null;
		this._bestPracticeDetailsUrl = bestPracticeDetailsUrl || null;
		this._bestPracticeStandards = bestPracticeStandards || null;

		this.toJSON = function() {
			const result = {};
			for (let x in this) {
				// exclude member variables that shouldn't be exposed for readability purposes
				if (x !== "_rawEngineJsonObject") {
					result[x] = this[x];
				}
			}
			return result;
		};
	}

	/**
	 * A CSS (for web) or XPath (for mobile) selector to the element with this accessibility concern.
	 *
	 * @returns {string} a CSS selector to the element with this accessibility concern
	 */
	get path() {
		return this._path;
	}

	set path(path) {
		this._path = path;
	}

	/**
	 * The automatic Access Engine test ID that failed and produced this accessibility concern.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {number} the automatic Access Engine test ID that failed and produced this accessibility concern
	 */
	get engineTestId() {
		return this._engineTestId;
	}

	set engineTestId(engineTestId) {
		this._engineTestId = engineTestId;
	}

	/**
	 * A brief human-readable description of this accessibility concern.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {string} a brief human-readable description of this accessibility concern
	 */
	get attribute() {
		return this._attribute;
	}

	set attribute(attribute) {
		this._attribute = attribute;
	}

	/**
	 * The best practice ID that corresponds to this accessibility concern.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {number} the best practice ID that corresponds to this accessibility concern
	 */
	get bestPracticeId() {
		return this._bestPracticeId;
	}

	set bestPracticeId(bestPracticeId) {
		this._bestPracticeId = bestPracticeId;
	}

	/**
	 * The source code of the HTML node corresponding to this accessibility concern.
	 *
	 * @returns {string} the source code of the HTML node corresponding to this accessibility concern
	 */
	get element() {
		return this._element;
	}

	set element(element) {
		this._element = element;
	}

	/**
	 * The remediation steps suggested by Access Engine for resolving this accessibility concern.
	 *
	 * @returns {FixType} the remediation steps suggested by Access Engine for resolving this accessibility concern
	 */
	get fixType() {
		return this._fixType;
	}

	set fixType(fixType) {
		this._fixType = fixType;
	}

	/**
	 * Gets whether or not this accessibility concern requires manual review, i.e. whether the user should manually use AMP to determine whether or not this accessibility concern is actually a legitimate violation given the context of the offending element ({@link AccessibilityConcern#element}).
	 * If this returns true, visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information on how to manually validate the applicability of this accessibility concern relative to the offending element ({@link AccessibilityConcern#element}); it may be that this accessibility concern is not applicable given this context.
	 * Accessibility concerns that require manual review will only ever be returned (and thus this function will only ever possibly return false for a given accessibility concern) if {@link Continuum#includePotentialAccessibilityConcerns} returns true.
	 *
	 * @returns {boolean} whether or not this accessibility concern requires manual review
	 */
	get needsReview() {
		return this._needsReview;
	}

	set needsReview(needsReview) {
		this._needsReview = needsReview;
	}

	/**
	 * The raw JSON object from Access Engine that was originally used to build this accessibility concern.
	 *
	 * @returns {object} the raw JSON object from Access Engine that was originally used to build this accessibility concern
	 */
	get rawEngineJsonObject() {
		return this._rawEngineJsonObject;
	}

	set rawEngineJsonObject(rawEngineJsonObject) {
		this._rawEngineJsonObject = rawEngineJsonObject;
	}

	/**
	 * The name of the best practice that corresponds to this accessibility concern.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {string} the name of the best practice that corresponds to this accessibility concern
	 */
	get bestPracticeDescription() {
		return this._bestPracticeDescription;
	}

	set bestPracticeDescription(bestPracticeDescription) {
		this._bestPracticeDescription = bestPracticeDescription;
	}

	/**
	 * The severity of this accessibility concern on a scale of 1 to 10, where 1 is the least severe and 10 is the most severe.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {number} the severity of the best practice that corresponds to this accessibility concern
	 */
	get severity() {
		return this._severity;
	}

	set severity(severity) {
		this._severity = severity;
	}

	/**
	 * The noticeability of this accessibility concern on a scale of 1 to 10, where 1 is the least noticeable and 10 is the most noticeable.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {number} the noticeability of the best practice that corresponds to this accessibility concern
	 */
	get noticeability() {
		return this._noticeability;
	}

	set noticeability(noticeability) {
		this._noticeability = noticeability;
	}

	/**
	 * The tractability of this accessibility concern on a scale of 1 to 10, where 1 is the least tractable and 10 is the most tractable.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {number} the tractability of the best practice that corresponds to this accessibility concern
	 */
	get tractability() {
		return this._tractability;
	}

	set tractability(tractability) {
		this._tractability = tractability;
	}

	/**
	 * The URL of the best practice page in AMP that corresponds to this accessibility concern.
	 * An AMP license is not required to visit this URL, but if you're logged into AMP, you'll be presented with additional information beyond what's publicly available.
	 *
	 * @returns {string} the URL of the best practice page in AMP that corresponds to this accessibility concern
	 */
	get bestPracticeDetailsUrl() {
		return this._bestPracticeDetailsUrl;
	}

	set bestPracticeDetailsUrl(bestPracticeDetailsUrl) {
		this._bestPracticeDetailsUrl = bestPracticeDetailsUrl;
	}

	/**
	 * An array of accessibility standards associated with the best practice that corresponds to this accessibility concern, ordered alphabetically by name.
	 * Visit the URL returned by {@link AccessibilityConcern#bestPracticeDetailsUrl} for more information.
	 *
	 * @returns {Standard[]} an array of accessibility standards associated with the best practice that corresponds to this accessibility concern
	 */
	get bestPracticeStandards() {
		return this._bestPracticeStandards;
	}

	set bestPracticeStandards(bestPracticeStandards) {
		this._bestPracticeStandards = bestPracticeStandards;
	}
}

/**
 * A class that encapsulates remediation steps suggested by Access Engine for resolving an accessibility concern.
 */
class FixType {

	/**
	 * @constructor
	 * @param {boolean} domSpec - defines whether this fix is specific to the particular page under test
	 * @param {string} helperText - a brief human-readable description of how to resolve the accessibility concern corresponding to this fix
	 * @returns {FixType}
	 */
	constructor(domSpec, helperText) {
		this._domSpec = domSpec;
		this._helperText = helperText;
	}

	set domSpec(domSpec) {
		this._domSpec = domSpec;
	}

	/**
	 * Defines whether this fix is specific to the particular page under test.
	 *
	 * @returns {boolean} whether this fix is specific to the particular page under test, or more general
	 */
	get domSpec() {
		return this._domSpec;
	}

	set helperText(helperText) {
		this._helperText = helperText;
	}

	/**
	 * A brief human-readable description of how to resolve the accessibility concern corresponding to this fix. Consult AMP for additional information.
	 *
	 * @returns {string} a brief human-readable description of how to resolve the accessibility concern corresponding to this fix
	 */
	get helperText() {
		return this._helperText;
	}
}

/**
 * A class that encapsulates accessibility standards associated with best practices returned by AMP.
 */
class Standard {

	/**
	 * @constructor
	 * @param {number} id - the ID of the accessibility standard
	 * @param {string} name - the name of the accessibility standard
	 * @returns {Standard}
	 */
	constructor(id, name) {
		this._id = id;
		this._name = name;
	}

	set id(id) {
		this._id = id;
	}

	/**
	 * Gets the ID of the accessibility standard as defined in AMP.
	 *
	 * @returns {number} the ID of the accessibility standard
	 */
	get id() {
		return this._id;
	}

	set name(name) {
		this._name = name;
	}

	/**
	 * Gets the name of the accessibility standard as defined in AMP.
	 *
	 * @returns {string} the name of the accessibility standard
	 */
	get name() {
		return this._name;
	}
}

/**
 * This class encapsulates all network requests Continuum itself makes to the Internet.
 *
 * @private
 */
class NetworkUtil {

	static getFromAMP(urlEndpointPath, queryParams, includeToken, driver, windowUnderTest) {
		return NetworkUtil._getFromAMP('GET', urlEndpointPath, queryParams, null, includeToken, driver, windowUnderTest);
	}

	static postToAMP(urlEndpointPath, bodyParams, includeToken, driver, windowUnderTest) {
		return NetworkUtil._getFromAMP('POST', urlEndpointPath, null, bodyParams, includeToken, driver, windowUnderTest);
	}

	static _getFromAMP(method, urlEndpointPath, queryParams, bodyParams, includeToken, driver, windowUnderTest) {
		if (includeToken) {
			if (!queryParams) {
				queryParams = {}
			}
			queryParams.apiToken = AMP_API_TOKEN;
		}

		if (!urlEndpointPath) {
			urlEndpointPath = "";
		}
		const url = "https://" + AMP_HOST + urlEndpointPath + NetworkUtil._formatQueryParams(queryParams);

		if (driver) {
			return new Promise((resolve, reject) => {
				const sendAMPRequest = (socket) => {
					const options = {
						host: AMP_HOST,
						port: 443,
						method: method,
						path: urlEndpointPath + NetworkUtil._formatQueryParams(queryParams),
						headers: {
							'Content-Type': 'application/json;charset=UTF-8'
						},
					};
					if (socket) {
						options.socket = socket;
						options.agent = false;
					}

					const req = require('https').request(options, (res) => {
						if (res.statusCode !== 200) {
							throw new HttpErrorException(`Unexpectedly encountered a non-200 status code (${res.statusCode} ${res.statusMessage}) while attempting to GET data from ${url}`);
						}

						res.setEncoding('utf8');

						let output = '';
						res.on('data', (chunk) => {
							output += chunk;
						});
						res.on('end', () => {
							resolve(output ? JSON.parse(output) : null);
						});
					});
					req.on('socket', (socket) => {
						socket.setTimeout(NetworkUtil._getTimeout());
						socket.on('timeout', () => {
							req.abort();
						});
					});
					req.on('error', (err) => {
						reject(err);
					});
					if (method === 'POST') {
						req.write(NetworkUtil._formatBodyParams(bodyParams));
					}
					req.end();
				};

				if (PROXY_HOST) {
					const options = {
						host: PROXY_HOST,
						port: PROXY_PORT,
						method: 'CONNECT',
						path: url,
						headers: {
							Host: `${AMP_HOST}:443`
						}
					};

					if (PROXY_USERNAME) {
						options.headers['Proxy-Authorization'] = `Basic ${new Buffer(`${PROXY_USERNAME}:${PROXY_PASSWORD}`).toString('base64')}`;
					}

					const req = require('http').request(options);
					req.on('connect', (res, socket) => {
						if (res.statusCode !== 200) {
							throw new HttpErrorException(`Unexpectedly encountered a non-200 status code (${res.statusCode} ${res.statusMessage}) while attempting to GET data from ${url} via proxy`);
						}

						sendAMPRequest(socket);
					});
					req.end();
				} else {
					sendAMPRequest();
				}
			});
		} else if (windowUnderTest) {
			return new Promise((resolve, reject) => {
				const request = new XMLHttpRequest();
				request.open(method, url, true);
				request.setRequestHeader('Content-Type', "application/json;charset=UTF-8");
				request.timeout = NetworkUtil._getTimeout();
				request.onload = () => {
					if (request.readyState === 4) {
						if (request.status === 200) {
							resolve(JSON.parse(request.responseText));
						} else {
							throw new HttpErrorException(`Unexpectedly encountered a non-200 status code (${request.status} ${request.statusText}) while attempting to GET data from ${url}`);
						}
					}
				};
				request.onerror = (err) => {
					reject(err);
				};
				request.send(bodyParams ? NetworkUtil._formatBodyParams(bodyParams) : null);
			});
		}
	}

	static _getTimeout() {
		return 10000;  // in milliseconds
	}

	static _formatQueryParams(queryParams) {
		if (!queryParams || Object.keys(queryParams).length <= 0) {
			return "";
		}

		return "?" + Object.keys(queryParams).map((key) => {
			return [key, queryParams[key]].map(encodeURIComponent).join("=");
		}).join("&");
	}

	static _formatBodyParams(bodyParams) {
		if (!bodyParams || Object.keys(bodyParams).length <= 0) {
			return null;
		}

		return JSON.stringify(bodyParams);
	}
}

/**
 * This class encapsulates all of functionality for submitting accessibility concerns identified using Continuum to AMP.
 *
 * Reporting test results from Continuum to AMP is accomplished through a kind of state machine, where you set the active AMP instance, organization, asset, report, and module to use; once these are set, they remain set for as long as they're not set again and for as long as Continuum is initialized.
 * Depending on the report and module management strategies you decide to use—see {@link ReportManagementStrategy} and {@link ModuleManagementStrategy}, respectively—invoking {@link AMPReportingService#submitAccessibilityConcernsToAMP} will first create, overwrite, and/or delete reports and modules from AMP, then publish your test results to the active AMP module.
 * You can set the active report and module management strategies using {@link AMPReportingService#setActiveReportManagementStrategy} and {@link AMPReportingService#setActiveModuleManagementStrategy}, respectively.
 * Only once all of these active items are set should you invoke {@link AMPReportingService#submitAccessibilityConcernsToAMP} using the list of accessibility concerns you'd like to report.
 *
 * More on report and module management strategies: they are designed with two primary use cases in mind: continuous integration (CI) workflows (where you usually want to retain the results of previously published reports), and more manual workflows (e.g. when Continuum is run from a developer's local workstation, where you usually don't want to retain the results of previously published reports).
 * Choosing the correct report and module management strategies to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
 *
 * @hideconstructor
 */
class AMPReportingService {

	/**
	 * @constructor
	 * @returns {AMPReportingService}
	 */
	constructor(driver, windowUnderTest) {
		if (!AMPReportingService.instance) {
			this._activeInstance = AMP_HOST;
			this._activeOrganizationId = null;
			this._activeAssetId = null;
			this._activeReport = null;
			this._activeModule = null;
			this._activeReportManagementStrategy = null;
			this._activeModuleManagementStrategy = null;

			this._driver = driver;
			this._windowUnderTest = windowUnderTest;

			AMPReportingService.instance = this;
		}
	}

	/**
	 * @private
	 * @returns {string}
	 */
	get activeInstance() {
		return this._activeInstance;
	}

	set activeInstance(activeInstance) {
		this._activeInstance = activeInstance;
	}

	/**
	 * @private
	 * @returns {number}
	 */
	get activeOrganizationId() {
		return this._activeOrganizationId;
	}

	set activeOrganizationId(activeOrganizationId) {
		this._activeOrganizationId = activeOrganizationId;
	}

	/**
	 * @private
	 * @returns {number}
	 */
	get activeAssetId() {
		return this._activeAssetId;
	}

	set activeAssetId(activeAssetId) {
		this._activeAssetId = activeAssetId;
	}

	/**
	 * @private
	 * @returns {Report}
	 */
	get activeReport() {
		return this._activeReport;
	}

	set activeReport(activeReport) {
		this._activeReport = activeReport;
	}

	/**
	 * @private
	 * @returns {Module}
	 */
	get activeModule() {
		return this._activeModule;
	}

	set activeModule(activeModule) {
		this._activeModule = activeModule;
	}

	/**
	 * @private
	 * @returns {ReportManagementStrategy}
	 */
	get activeReportManagementStrategy() {
		return this._activeReportManagementStrategy;
	}

	set activeReportManagementStrategy(activeReportManagementStrategy) {
		this._activeReportManagementStrategy = activeReportManagementStrategy;
	}

	/**
	 * @private
	 * @returns {ModuleManagementStrategy}
	 */
	get activeModuleManagementStrategy() {
		return this._activeModuleManagementStrategy;
	}

	set activeModuleManagementStrategy(activeModuleManagementStrategy) {
		this._activeModuleManagementStrategy = activeModuleManagementStrategy;
	}

	/**
	 * @private
	 * @returns {*}
	 */
	get driver() {
		return this._driver;
	}

	set driver(driver) {
		this._driver = driver;
	}

	/**
	 * @private
	 * @returns {Window}
	 */
	get windowUnderTest() {
		return this._windowUnderTest;
	}

	set windowUnderTest(window) {
		this._windowUnderTest = window;
	}

	/**
	 * Validates the specified ID of an existing organization in AMP, then sets it as the active organization in Continuum such that next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked, test results will be submitted to this active organization.
	 *
	 * @param {number} organizationId - the ID of the AMP organization to make active
	 * @throws {IllegalArgumentException} if the specified organization ID is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified organization ID
	 * @throws {NotFoundException} if the specified organization may not exist in the active AMP instance or is otherwise not accessible
	 */
	async setActiveOrganization(organizationId) {
		if (!organizationId) {
			throw new IllegalArgumentException("Active organization cannot be null");
		}

		const responseJson = await NetworkUtil.getFromAMP("/api/cont/organization/validate", {
			organizationId: organizationId.toString()
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid) {
			const message = responseJson.message ? ("; " + responseJson.message) : "";
			throw new NotFoundException(`Organization with ID '${organizationId}' not found in active AMP instance '${this.activeInstance}'${message}`);
		}

		this.activeOrganizationId = organizationId;
	}

	/**
	 * Validates the specified ID of an existing asset in AMP, then sets it as the active asset in Continuum such that next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked, test results will be submitted to this active asset.
	 * Make sure you first set the active organization for this asset prior to invoking this function using {@link AMPReportingService#setActiveOrganization}.
	 *
	 * @param {number} assetId - the ID of the AMP asset to make active
	 * @throws {IllegalStateException} if the active organization is not set
	 * @throws {IllegalArgumentException} if the specified asset ID is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified asset ID
	 * @throws {NotFoundException} if the specified asset may not exist in the active AMP instance or is otherwise not accessible
	 */
	async setActiveAsset(assetId) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!assetId) {
			throw new IllegalArgumentException("Active asset cannot be null");
		}

		const responseJson = await NetworkUtil.getFromAMP("/api/cont/asset/validate", {
			assetId: assetId.toString()
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid) {
			const message = responseJson.message ? ("; " + responseJson.message) : "";
			throw new NotFoundException(`Asset with ID '${organizationId}' not found in active AMP instance '${this.activeInstance}'${message}`);
		}

		this.activeAssetId = assetId;
	}

	/**
	 * Validates the specified ID of an existing report in AMP, then sets it as the active report in Continuum such that next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked, test results will be submitted to this active report.
	 * Make sure you first set the active organization and asset for this report prior to invoking this function using {@link AMPReportingService#setActiveOrganization} and {@link AMPReportingService#setActiveAsset}, respectively.
	 *
	 * @param {number} reportId - the ID of the AMP report to make active
	 * @throws {IllegalStateException} if the active organization or asset is not set
	 * @throws {IllegalArgumentException} if the specified report ID is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified report ID
	 * @throws {NotFoundException} if the specified report may not exist in the active AMP instance or is otherwise not accessible
	 */
	async setActiveReportById(reportId) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!reportId) {
			throw new IllegalArgumentException("Active report cannot be null");
		}

		const responseJson = await NetworkUtil.getFromAMP("/api/cont/report/validate", {
			assetId: this.activeAssetId.toString(),
			reportId: reportId.toString()
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid) {
			const message = responseJson.message ? ("; " + responseJson.message) : "";
			throw new NotFoundException(`Report with ID '${organizationId}' not found in active AMP instance '${this.activeInstance}'${message}`);
		}

		this.activeReport = new Report(reportId, null);
	}

	/**
	 * Sets the active report in AMP to submit test results to next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * The report name specified is validated, but unlike {@link AMPReportingService#setActiveReportById}, this method will not throw an exception if the specified report does not yet exist in AMP; it will be created next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * Make sure you first set the active organization and asset for this report prior to invoking this function using {@link AMPReportingService#setActiveOrganization} and {@link AMPReportingService#setActiveAsset}, respectively.
	 *
	 * @param {string} reportName - the name of the AMP report to make active
	 * @throws {IllegalStateException} if the active organization or asset is not set
	 * @throws {IllegalArgumentException} if the specified report name is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified report name
	 * @returns {number} the ID of the AMP report, if it already exists; null if the report does not yet exist in AMP
	 */
	async setActiveReportByName(reportName) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!reportName) {
			throw new IllegalArgumentException("Active report cannot be null");
		}

		let reportId = null;

		const responseJson = await NetworkUtil.getFromAMP("/api/cont/report/validate", {
			assetId: this.activeAssetId.toString(),
			reportName: reportName
		}, true, this.driver, this.windowUnderTest);

		if (responseJson.valid && responseJson.reportId) {
			reportId = responseJson.reportId;
		}

		this.activeReport = new Report(reportId, reportName);
		return reportId;
	}

	/**
	 * Validates the specified ID of an existing module in AMP, then sets it as the active module in Continuum such that next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked, test results will be submitted to this active module.
	 * Make sure you first set the active organization, asset, and report for this module prior to invoking this function using {@link AMPReportingService#setActiveOrganization}, {@link AMPReportingService#setActiveAsset}, and {@link AMPReportingService#setActiveReportById} or {@link AMPReportingService#setActiveReportByName}, respectively.
	 * While using {@link ReportManagementStrategy#OVERWRITE} as your report management strategy, use {@link AMPReportingService#setActiveModuleByName} instead of this method; see the documentation for {@link ReportManagementStrategy#OVERWRITE} for details as to why.
	 *
	 * @param {number} moduleId - the ID of the AMP module to make active
	 * @throws {IllegalStateException} if the active organization, asset, or report is not set
	 * @throws {IllegalArgumentException} if the specified module ID is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified module ID
	 * @throws {NotFoundException} if the specified module may not exist in the active AMP report
	 */
	async setActiveModuleById(moduleId) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!this.activeReport || !this.activeReport.id) {
			throw new IllegalStateException("Active report has not been set");
		}

		if (!moduleId) {
			throw new IllegalArgumentException("Active module cannot be null");
		}

		const responseJson = await NetworkUtil.getFromAMP("/api/cont/module/validate", {
			assetId: this.activeAssetId.toString(),
			reportId: this.activeReport.id.toString(),
			moduleId: moduleId.toString()
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid) {
			const message = responseJson.message ? ("; " + responseJson.message) : "";
			throw new NotFoundException(`Module with ID '${organizationId}' not found in active AMP instance '${this.activeInstance}'${message}`);
		}

		this.activeModule = new Module(moduleId, null, null);
	}

	/**
	 * Sets the active module in AMP to submit test results to next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * The module name specified is validated if the active report already exists in AMP, but unlike {@link AMPReportingService#setActiveModuleById}, this method will not throw an exception if the specified module does not yet exist in AMP; it will be created next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * Make sure you first set the active organization, asset, and report for this module prior to invoking this function using {@link AMPReportingService#setActiveOrganization}, {@link AMPReportingService#setActiveAsset}, and {@link AMPReportingService#setActiveReportById} or {@link AMPReportingService#setActiveReportByName}, respectively.
	 *
	 * @param {string} moduleName - the name of the AMP module to make active
	 * @param {string} moduleLocation - the name of the location in the website or app being tested; this can be a fully qualified URL, or simply a page title like "Login Page"
	 * @throws {IllegalStateException} if the active organization, asset, or report is not set
	 * @throws {IllegalArgumentException} if the specified module name or location is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the specified module name
	 * @returns {number} the ID of the AMP module, if it already exists; null if the module does not yet exist in AMP
	 */
	async setActiveModuleByName(moduleName, moduleLocation) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!this.activeReport) {
			throw new IllegalStateException("Active report has not been set");
		}

		if (!moduleName) {
			throw new IllegalArgumentException("Active module cannot be null");
		}

		if (!moduleLocation) {
			throw new IllegalArgumentException("Active module location cannot be null");
		}

		let moduleId = null;

		// only attempt to validate this module if we have the necessary report ID to do so
		if (this.activeReport.id) {
			const responseJson = await NetworkUtil.getFromAMP("/api/cont/module/validate", {
				assetId: this.activeAssetId.toString(),
				reportId: this.activeReport.id.toString(),
				moduleName: moduleName
			}, true, this.driver, this.windowUnderTest);

			if (responseJson.valid && responseJson.moduleId) {
				moduleId = responseJson.moduleId;
			}
		}

		this.activeModule = new Module(moduleId, moduleName, moduleLocation);
		return moduleId;
	}

	/**
	 * Sets the active report management strategy to use next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * Choosing the correct report and module management strategies to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
	 *
	 * @param {ReportManagementStrategy} reportManagementStrategy - the preferred management strategy to use when creating and editing AMP reports
	 */
	setActiveReportManagementStrategy(reportManagementStrategy) {
		this.activeReportManagementStrategy = reportManagementStrategy;
	}

	/**
	 * Sets the active module management strategy to use next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked.
	 * Choosing the correct report and module management strategies to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
	 *
	 * @param {ModuleManagementStrategy} moduleManagementStrategy - the preferred management strategy to use when creating and editing AMP modules
	 */
	setActiveModuleManagementStrategy(moduleManagementStrategy) {
		this.activeModuleManagementStrategy = moduleManagementStrategy;
	}

	/**
	 * Submits accessibility concerns to the active AMP instance, organization, asset, report, and module.
	 * Make sure to set the active AMP organization (via {@link AMPReportingService#setActiveOrganization}), asset (via {@link AMPReportingService#setActiveAsset}), report (via {@link AMPReportingService#setActiveReportById} or {@link AMPReportingService#setActiveReportByName}), and module (via {@link AMPReportingService#setActiveModuleById} or {@link AMPReportingService#setActiveModuleByName}) prior to invoking this function.
	 * The active instance, organization, and asset must all already exist in AMP prior to invoking this function, otherwise an exception will be thrown; reports and modules don't need to exist in AMP yet, as they will be created if necessary.
	 * Also, make sure to set your desired report and module management strategies prior to invoking this function using {@link AMPReportingService#setActiveReportManagementStrategy} and {@link AMPReportingService#setActiveModuleManagementStrategy}, respectively, according to your use case.
	 * Choosing the correct report and module management strategies to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
	 *
	 * @param {AccessibilityConcern[]} accessibilityConcerns - the list of accessibility concerns to submit to AMP
	 * @throws {IllegalStateException} if the active instance, organization, asset, report, or module is not set
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP to validate the active organization, asset, report, or module
	 * @throws {NotFoundException} if the active instance, organization, or asset may not exist in AMP as specified, or if an error occurs while attempting to create the necessary report or module in AMP (if applicable)
	 * @returns {boolean} true if uploading of the specified accessibility concerns to AMP succeeded; false if it did not
	 */
	async submitAccessibilityConcernsToAMP(accessibilityConcerns) {
		// validate active organization
		await this.setActiveOrganization(this.activeOrganizationId);

		// validate active asset
		await this.setActiveAsset(this.activeAssetId);

		// validate or create active report
		let reportExistsInAMP = false;
		if (this.activeReport && this.activeReport.id && this.activeReportManagementStrategy !== ReportManagementStrategy.UNIQUE) {
			// the active report already has an ID, so verify it still exists in AMP; if it doesn't, abort
			await this.setActiveReportById(this.activeReport.id);
			reportExistsInAMP = true;
		} else {
			// user has requested we guarantee the creation of a new report by modifying the report name they've specified
			if (this.activeReport && this.activeReport.name && this.activeReportManagementStrategy === ReportManagementStrategy.UNIQUE) {
				this.activeReport.name += ` (${new Date().toISOString()})`;
			}

			// the active report may or may not exist in AMP as no ID was specified, so check and create it if necessary
			const reportId = await this.setActiveReportByName(this.activeReport ? this.activeReport.name : null);
			if (!reportId) {
				this.activeReport.id = await this._createReport(this.activeReport.name);
				if (!this.activeReport.id) {
					throw new NotFoundException(`Could not create new report '${this.activeReport.name}' in AMP`);
				}

				if (this.activeModule) {
					// when the time comes, ensure a new module is created for this new report
					this.activeModule.id = null;
				}
			} else {
				this.activeReport.id = reportId;
				reportExistsInAMP = true;
			}
		}
		if (reportExistsInAMP) {
			if (this.activeReportManagementStrategy === ReportManagementStrategy.OVERWRITE) {
				const success = await this._deleteAllModulesInActiveReport();
				if (success) {
					// assuming the active module already existed in the active report when they were specified by the user, the active module's ID is no longer valid as this module was just deleted from AMP
					// clearing out the active module ID here means the active module will get recreated in AMP later on in the same active report as though the user had not specified an ID, which is what we want
					this.activeModule.id = null;
				} else {
					const reportIdentifierText = this.activeReport.name ? `'${this.activeReport.name}'` : `ID ${this.activeReport.id}`;
					throw new NotFoundException(`Could not delete existing modules from report ${reportIdentifierText} in AMP`);
				}
			}
		}

		// validate or create active module
		let moduleExistsInAMP = false;
		let overwriteExistingAccessibilityConcerns = false;
		if (this.activeModule && this.activeModule.id) {
			// the active module already has an ID, so verify it still exists in AMP
			await this.setActiveModuleById(this.activeModule.id);
			moduleExistsInAMP = true;
		} else {
			// the active module may or may not exist in AMP as no ID was specified, so check and create it if necessary
			const moduleId = await this.setActiveModuleByName(this.activeModule ? this.activeModule.name : null, this.activeModule ? this.activeModule.location : null);
			if (!moduleId) {
				// module does not yet exist in AMP, so create it
				this.activeModule.id = await this._createModule(this.activeModule.name);
				if (!this.activeModule.id) {
					throw new NotFoundException(`Could not create new module '${this.activeModule.name}' in AMP`);
				}
			} else {
				this.activeModule.id = moduleId;
				moduleExistsInAMP = true;
			}
		}
		if (moduleExistsInAMP) {
			if (this.activeModuleManagementStrategy === ModuleManagementStrategy.ABORT) {
				console.log("The active module already exists in AMP! Aborting reporting to AMP per specified module management strategy of ABORT.");
				return false;
			} else if (this.activeModuleManagementStrategy === ModuleManagementStrategy.OVERWRITE) {
				overwriteExistingAccessibilityConcerns = true;
			}
		}

		// at this point, the active organization, asset, report, and module should all exist in AMP (if they didn't already before)

		// convert accessibility concerns into the format AMP expects for uploading
		const records = AMPReportingService._convertAccessibilityConcernsToAMPFormat(accessibilityConcerns);

		// actually submit test results to AMP

		const bodyParams = {
			reportID: this.activeReport.id.toString(),
			moduleID: this.activeModule.id.toString(),
			overwrite: overwriteExistingAccessibilityConcerns.toString(),
			records: records
		};
		if (this.activeModule.name) {
			bodyParams.moduleName = this.activeModule.name;
		}
		if (this.activeModule.location) {
			bodyParams.moduleLocation = this.activeModule.location;
		}

		const responseJson = await NetworkUtil.postToAMP("/api/cont/module/upload", bodyParams, true, this.driver, this.windowUnderTest);
		return !!responseJson.moduleId;
	}

	/**
	 * Creates a new report in the active AMP asset.
	 *
	 * @private
	 * @param {string} reportName - the name of the AMP report to create
	 * @throws {IllegalStateException} if the active organization or asset is not set
	 * @throws {IllegalArgumentException} if the specified report name is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP
	 * @throws {NotFoundException} if the active report cannot be created in AMP
	 * @returns {number} the ID of the AMP report created; null if the AMP report could not be created
	 */
	async _createReport(reportName) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!reportName) {
			throw new IllegalArgumentException("Active report cannot be null");
		}

		let reportId = null;

		const responseJson = await NetworkUtil.postToAMP("/api/cont/report/create", {
			assetId: this.activeAssetId,
			reportName: reportName,
			mediaTypeId: WEB_MEDIA_TYPE_ID
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid && responseJson.message) {
			throw new NotFoundException(responseJson.message);
		}

		if (responseJson.valid && responseJson.reportId) {
			reportId = responseJson.reportId;
		}

		return reportId;
	}

	/**
	 * Deletes any and all modules from the active AMP report.
	 *
	 * @private
	 * @throws {IllegalStateException} if the active organization, asset, or report is not set
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP
	 * @throws {NotFoundException} if the active report in AMP cannot be accessed or found
	 * @returns {boolean} true if the deletion of all the active AMP report's modules succeeded; false if it did not
	 */
	async _deleteAllModulesInActiveReport() {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!this.activeReport || !this.activeReport.id) {
			throw new IllegalStateException("Active report has not been set");
		}

		const responseJson = await NetworkUtil.postToAMP("/api/cont/report/overwrite", {
			assetId: this.activeAssetId,
			reportId: this.activeReport.id
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson) {
			// this endpoint doesn't send back a response if it succeeds
			return true;
		}

		if (!responseJson.valid && responseJson.message) {
			throw new NotFoundException(responseJson.message);
		}

		return false;
	}

	/**
	 * Creates a new module in the active AMP report.
	 *
	 * @private
	 * @param {string} moduleName - the name of the AMP module to create
	 * @throws {IllegalStateException} if the active organization, asset, or report is not set, or if the active report is set but doesn't yet exist in AMP
	 * @throws {IllegalArgumentException} if the specified module name is null
	 * @throws {HttpErrorException} if an error is encountered while attempting to connect to AMP
	 * @throws {NotFoundException} if the active module cannot be created in AMP
	 * @returns {number} the ID of the AMP module created; null if the AMP module could not be created
	 */
	async _createModule(moduleName) {
		if (!this.activeOrganizationId) {
			throw new IllegalStateException("Active organization has not been set");
		}

		if (!this.activeAssetId) {
			throw new IllegalStateException("Active asset has not been set");
		}

		if (!this.activeReport || !this.activeReport.id) {
			throw new IllegalStateException("Active report has not been set");
		}

		if (!moduleName) {
			throw new IllegalArgumentException("Active module cannot be null");
		}

		let moduleId = null;

		const responseJson = await NetworkUtil.postToAMP("/api/cont/module/create", {
			assetId: this.activeAssetId.toString(),
			reportId: this.activeReport.id.toString(),
			moduleName: moduleName
		}, true, this.driver, this.windowUnderTest);

		if (!responseJson.valid && responseJson.message) {
			throw new NotFoundException(responseJson.message);
		}

		if (responseJson.valid && responseJson.moduleId) {
			moduleId = responseJson.moduleId;
		}

		return moduleId;
	}

	/**
	 * Converts accessibility concerns to the format AMP expects for reporting purposes.
	 *
	 * @private
	 * @param {AccessibilityConcern[]} accessibilityConcerns - the accessibility concerns to convert
	 * @returns {object} a JSON object that includes the specified accessibility concerns in a particular format
	 */
	static _convertAccessibilityConcernsToAMPFormat(accessibilityConcerns) {
		const records = {};

		for (let i = 0; i < accessibilityConcerns.length; i++) {
			const accessibilityConcern = accessibilityConcerns[i];
			const result = accessibilityConcern.rawEngineJsonObject;

			const instance = {};

			const element = result.element;
			instance.element = element.substring(0, Math.min(element.length, 3000));

			const attributeDetail = result.attributeDetail;
			instance.attribute = attributeDetail.substring(0, Math.min(attributeDetail.length, 3000));

			instance.xpath = result.path;
			instance.testResult = result.testResult;
			instance.engineTestId = result.engineTestId;

			// pass along stuff used by Alchemy
			const fixType = result.fixType;
			if (typeof fixType === 'object') {
				instance.fixType = fixType.fixType;
				instance.fix = fixType.fix;
				instance.fingerprint = result.fingerprint;
			}

			const bestPracticeIdString = result.bestPracticeId;
			let record = records[bestPracticeIdString];
			if (!record) {
				record = {};

				const violation = {};
				violation.violationID = result.bestPracticeId;
				record.violation = violation;

				const instances = [];
				instances.push(instance);
				record.instances = instances;

				records[bestPracticeIdString] = record;
			} else {
				const instances = record.instances;
				instances.push(instance);
			}
		}

		return records;
	}
}

/**
 * Defines supported strategies with which to create new reports and edit existing ones.
 * Choosing the correct report management strategy to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
 *
 * @readonly
 * @namespace
 * @type {object}
 */
const ReportManagementStrategy = Object.freeze({
	/**
	 * Append any new modules to a report, creating the report first if it doesn't already exist; do not overwrite any existing reports.
	 * Useful for intentionally adding to an existing report, e.g. one that was just created recently, rather than creating a new report.
	 *
	 * @type {string}
	 * @alias APPEND
	 * @memberof! ReportManagementStrategy#
	 */
	APPEND: "APPEND",

	/**
	 * Overwrite existing reports when a report with the same ID or name already exists, deleting any existing modules in the report in AMP prior to repopulating it with any new modules.
	 * This is the recommended strategy for a more manual report generation workflow, e.g. when a developer is creating new reports from their own workstation, or when there is otherwise little reason to retain old reports.
	 * While using this report management strategy, make sure to specify active modules by name (via {@link AMPReportingService#setActiveModuleByName}) rather than by ID (via {@link AMPReportingService#setActiveModuleById}); any modules in the active report—including the active module, assuming it's in the active report—will be deleted from AMP next time {@link AMPReportingService#submitAccessibilityConcernsToAMP} is invoked, making the active module ID invalid before any test results can be submitted to the module in AMP it used to reference, which will cause Continuum to throw a {@link NotFoundException}.
	 *
	 * @type {string}
	 * @alias OVERWRITE
	 * @memberof! ReportManagementStrategy#
	 */
	OVERWRITE: "OVERWRITE",

	/**
	 * Always create new reports, guaranteeing uniqueness by appending the current date and time as an ISO 8601 timestamp to the end of each report's name; do not overwrite or append modules to any existing reports.
	 * This is the recommended strategy for a continuous integration (CI) workflow, i.e. for a report generation process that's automatically performed periodically, or when you otherwise don't wish to overwrite any previous reports for record keeping purposes.
	 *
	 * @type {string}
	 * @alias UNIQUE
	 * @memberof! ReportManagementStrategy#
	 */
	UNIQUE: "UNIQUE"
});

/**
 * Defines supported strategies with which to create new modules and edit existing ones.
 * Choosing the correct module management strategy to meet your business objectives is critical to using Continuum's AMP reporting functionality correctly, so please consult our support documentation for more information.
 *
 * @readonly
 * @namespace
 * @type {object}
 */
const ModuleManagementStrategy = Object.freeze({
	/**
	 * Append any new accessibility concerns to a module, creating the module first if it doesn't already exist; do not overwrite any existing modules.
	 * Useful for intentionally adding to an existing module, e.g. one that was just created recently, rather than creating a new module.
	 *
	 * @type {string}
	 * @alias APPEND
	 * @memberof! ModuleManagementStrategy#
	 */
	APPEND: "APPEND",

	/**
	 * Overwrite existing modules when a module with the same ID or name already exists, deleting any existing accessibility concerns in the module prior to repopulating it with any new accessibility concerns.
	 *
	 * @type {string}
	 * @alias OVERWRITE
	 * @memberof! ModuleManagementStrategy#
	 */
	OVERWRITE: "OVERWRITE",

	/**
	 * Don't report to AMP when a module with the same ID or name already exists; do not overwrite or append accessibility concerns to the existing module.
	 *
	 * @type {string}
	 * @alias ABORT
	 * @memberof! ModuleManagementStrategy#
	 */
	ABORT: "ABORT"
});

/**
 * @private
 */
class Report {

	/**
	 * @constructor
	 * @returns {Report}
	 */
	constructor(id, name) {
		this._id = id;
		this._name = name;
	}

	/**
	 * @returns {number}
	 */
	get id() {
		return this._id;
	}
	set id(id) {
		this._id = id;
	}

	/**
	 * @returns {string}
	 */
	get name() {
		return this._name;
	}
	set name(name) {
		this._name = name;
	}
}

/**
 * @private
 */
class Module {

	/**
	 * @constructor
	 * @returns {Module}
	 */
	constructor(id, name, location) {
		this._id = id;
		this._name = name;
		this._location = location;
	}

	/**
	 * @returns {number}
	 */
	get id() {
		return this._id;
	}
	set id(id) {
		this._id = id;
	}

	/**
	 * @returns {string}
	 */
	get name() {
		return this._name;
	}
	set name(name) {
		this._name = name;
	}

	/**
	 * @returns {string}
	 */
	get location() {
		return this._location;
	}
	set location(location) {
		this._location = location;
	}
}

/**
 * Signals that a method has been invoked at an illegal or inappropriate time.
 */
class IllegalStateException extends Error {}

/**
 * Thrown to indicate that a method has been passed an illegal or inappropriate argument.
 */
class IllegalArgumentException extends Error {}

/**
 * The class indicates a problem was encountered while connecting to a remote resource via HTTP/HTTPS.
 */
class HttpErrorException extends Error {}

/**
 * The class indicates an expected entity could not be found.
 */
class NotFoundException extends Error {}

/**
 * A global reference to Continuum.
 *
 * @const
 * @type {Continuum}
 */
const continuum = new Continuum();

if (typeof module !== 'undefined') {
	module.exports.Continuum = continuum;
	module.exports.ReportManagementStrategy = ReportManagementStrategy;
	module.exports.ModuleManagementStrategy = ModuleManagementStrategy;
}

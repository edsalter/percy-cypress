import serializeDOM from '@percy/dom';

// Collect client and environment information
const sdkPkg = require('./package.json');
const CLIENT_INFO = `${sdkPkg.name}/${sdkPkg.version}`;
const ENV_INFO = `cypress/${Cypress.version}`;

// Maybe get the CLI API address from the environment
const PERCY_CLI_API = Cypress.env('PERCY_CLI_API') || 'http://localhost:5338/percy';

// Check if Percy is enabled using the healthcheck endpoint
function isPercyEnabled() {
  if (isPercyEnabled.result == null) {
    return Cypress.backend('http:request', {
      url: `${PERCY_CLI_API}/healthcheck`
    }).then(({ status }) => {
      isPercyEnabled.result = status === 200;
      return isPercyEnabled.result;
    }).catch(err => {
      isPercyEnabled.result = false;
      console.log('Percy is not running, disabling snapshots');
      return isPercyEnabled.result;
    });
  } else {
    return Promise.resolve(isPercyEnabled.result);
  }
}

// Take a DOM snapshot and post it to the snapshot endpoint
Cypress.Commands.add('percySnapshot', (name, options) => {
  if (!name) throw new Error('The `name` argument is required.');

  // avoid mixing promises and commands
  return cy.then(isPercyEnabled).then(result => {
    // Serialize and capture the DOM
    return result && cy.document().then(dom => {
      // Post the DOM to the snapshot endpoint with snapshot options and other info
      return Cypress.backend('http:request', {
        url: `${PERCY_CLI_API}/snapshot`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          environmentInfo: ENV_INFO,
          clientInfo: CLIENT_INFO,
          domSnapshot: serializeDOM({ ...options, dom }),
          url: dom.URL,
          name
        })
      // Handle errors
      }).then(({ body: { success, error } }) => {
        if (!success) throw new Error(error);
      }).catch(err => {
        console.log(`Could not take DOM snapshot "${name}"\n${err.stack}`);
      });
    });
  });
});

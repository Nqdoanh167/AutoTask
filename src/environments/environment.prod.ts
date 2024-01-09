export const environment = {
  production: true,
  module: 'auto-task',
  apiAddress: 'https://smax.app/api',
  apiModule: 'https://smax.app/api',
  urlDomain: 'https://dev.smax.app',
  clientUrl: 'https://dev.smax.app',
};

const parsedURL = new URL(location.href);
if (parsedURL.hostname !== 'localhost') {
  const serviceAddr = `${parsedURL.origin}/api`;
  environment.apiAddress = serviceAddr;
  environment.apiModule = serviceAddr;
  environment.urlDomain = parsedURL.origin;
  environment.clientUrl = parsedURL.origin;
}

// Firebase App (the core Firebase SDK)
const apps = {};

export function initializeApp(config, name = '[DEFAULT]') {
  if (apps[name]) {
    return apps[name];
  }

  const app = {
    name,
    options: config,
    automaticDataCollectionEnabled: false
  };

  apps[name] = app;
  return app;
}

export function getApp(name = '[DEFAULT]') {
  if (!apps[name]) {
    throw new Error(`No Firebase App '${name}' has been created`);
  }
  return apps[name];
}

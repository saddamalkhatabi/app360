'use strict';

const AGE_GROUPS = Object.freeze(['1-4','4-8','8-12','12-16','16-24','24-45','45-60','60-80']);
const APP_STATUSES = Object.freeze(['live','planned','idea']);
const APP_KINDS = Object.freeze(['goal_aligned','modern_extension','hybrid']);
const APP_SCHEMA_VERSION = '1.0';
const PLATFORM_ID = 'app360-lab';

const CAPABILITY_TYPES = Object.freeze(['client','package','service','asset','integration']);
const DEPTH_LEVELS = Object.freeze(['lite','standard','advanced','expert']);
const RUNTIME_PROFILES = Object.freeze([
  'static-web',
  'legacy-web',
  'pwa',
  'node-service',
  'hybrid-web-service'
]);

module.exports = {
  PLATFORM_ID,
  APP_SCHEMA_VERSION,
  AGE_GROUPS,
  APP_STATUSES,
  APP_KINDS,
  CAPABILITY_TYPES,
  DEPTH_LEVELS,
  RUNTIME_PROFILES
};

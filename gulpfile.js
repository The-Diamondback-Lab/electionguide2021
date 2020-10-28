const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp-promise');

const buildProfile = require('./scripts/profiles');
const buildMinify = require('./scripts/minify');

const {
  BUILD_DIR, DATA_SRC_DIR
} = require('./scripts/constants');

async function build(cb) {
  await mkdirp(path.resolve(BUILD_DIR));

  await Promise.all([ buildCandidateData(), buildMinify() ])
    .then(() => cb())
    .catch(cb);
}

async function buildCandidateData() {
  await mkdirp(path.resolve(BUILD_DIR, 'content'));

  const profiles = await buildProfile(path.resolve(DATA_SRC_DIR, 'profiles'),
    path.resolve(BUILD_DIR, 'content/profiles.json'));
}

function clean(cb) {
  rimraf(path.resolve(BUILD_DIR), err => {
    cb(err);
  });
}

module.exports = {
  default: clean,
  build: build,
  clean: clean
}

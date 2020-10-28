const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');

/**
 * @typedef CandidateProfile
 * @property {string} fullName
 * @property {string} pictureFileBaseName
 * @property {string} position
 * @property {boolean} isIncumbent
 * @property {string} quote
 * @property {string} bio
 * @property {string} photoCreds
 * @property {string} party
 */

/**
 * Converts a profile text file to a profile-data object.
 *
 * The file should have it's first line dedicated to CSV data that specifies
 * the candidate's full name, picture file basename (name w/o
 * extension), what they are running for, if they are an incumbent,
 * and a quote.
 *
 * The rest of the file is dedicated to the candidate's biography.
 *
 * @param {string} filename
 * @param {string} text
 * @returns {CandidateProfile}
 */
function parseProfileFile(filename, text) {
  // Split lines, get rid of empty ones,
  // sanitize special quotes/apostrophe characters
  const lines = text.split(/\r?\n/)
    .filter(s => s.length > 0)
    .map(s => s.replace(/“|”/g, '"'))
    .map(s => s.replace(/’/g, '\''));

  const candidateInfo = lines.splice(0, 6);

  /**
   * @type {CandidateProfile}
   */
  const profile = {
    fullName: candidateInfo[0].trim(),
    pictureFileBaseName: candidateInfo[1].trim(),
    position: candidateInfo[2].trim(),
    isIncumbent: candidateInfo[3].trim().toLowerCase() === 'true',
    photoCreds: candidateInfo[4].trim(),
    party: candidateInfo[5].trim(),
    bio: parseBio(lines)
  };

  return profile;
}

/**
 * Parses lines of text into HTML elements.
 * @param {string[]} lines Lines of text for the biography
 * @returns {string}
 */
function parseBio(lines) {
  return lines.join(' ');
}

/**
 * Builds a list of candidate profiles given a directory to read files from.
 *
 * @param {string} srcDir where to recursively read profile files from
 * @param {string} output where to write parsed profile objects to
 * @returns {Promise.<CandidateProfile[]>} a list of candidate of profiles
 */
function buildProfile(srcDir, output) {
  return new Promise(async (resolve, reject) => {
    // List files in directory and only list .txt files
    const files = (await recursiveReaddir(srcDir)).filter(f => f.endsWith('.txt'));

    // Go over every file in the src directory and parse each file as a candidate profile
    /**
     * List of candidate profiles.
     * @type CandidateProfile[]
     */
    const profiles = await Promise.all(files.map(filename => new Promise((resolve, reject) => {
      fs.readFile(filename, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(parseProfileFile(filename, data.toString()));
        }
      })
    })));

    // Sort candidate profiles by the candidate's position they are running for
    profiles.sort((a, b) => a.position.localeCompare(b.position));

    // Write out to a file if given a destination path.
    if (output != null) {
      fs.writeFile(output, JSON.stringify(profiles), err => {
        if (err) {
          reject(err);
        } else {
          resolve(profiles);
        }
      });
    } else {
      resolve(profiles);
    }
  });
};

module.exports = buildProfile;

const fs = require('fs');
const recursiveReaddir = require('recursive-readdir');

/**
 * A set of warning directives that are intended to be used as
 * placeholder values when not enough information for a candidate is
 * given. For example, a candidate that does not have a quote shoould
 * use the `QUOTE` warning directive, so when parsing that candidate's
 * profile file, a warning will print out saying they have an invalid
 * quote.
 */
const WARNING_DIRECTIVES = {
  FULL_NAME: "InsertFullName",
  PICTURE_FILENAME: "InsertPictureFilename",
  POSITION: "InsertPosition",
  QUOTE: "InsertQuote",
  PHOTO_CREDS: "InsertPhotoCreds",
  PARTY: "InsertParty"
}

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

  const candidateInfo = lines.splice(0, 7);

  /**
   * @type {CandidateProfile}
   */
  const profile = {
    fullName: candidateInfo[0].trim(),
    pictureFileBaseName: candidateInfo[1].trim(),
    position: candidateInfo[2].trim(),
    isIncumbent: candidateInfo[3].trim().toLowerCase() === 'true',
    quote: candidateInfo[4].trim(),
    photoCreds: candidateInfo[5].trim(),
    party: candidateInfo[6].trim(),
    bio: parseBio(lines)
  };

  // Print out any warnings that we can catch
  if (candidateInfo[0].toUpperCase() === WARNING_DIRECTIVES.FULL_NAME.toUpperCase()) {
    console.warn(`Candidate ${filename} does not have a valid full name`);
  } else if (candidateInfo[1].toUpperCase() === WARNING_DIRECTIVES.PICTURE_FILENAME.toUpperCase()) {
    console.warn(`Candidate ${profile.fullName} does not have a valid picture file basename`);
  } else if (candidateInfo[2].toUpperCase() === WARNING_DIRECTIVES.POSITION.toUpperCase()) {
    console.warn(`Candidate ${filename} does not have a valid position`);
  } else if (candidateInfo[3].toUpperCase() !== 'TRUE' && candidateInfo[3].toUpperCase() !== 'FALSE') {
    console.warn(`Candidate ${profile.fullName} does not have a valid incumbent value '${candidateInfo[3]}'`);
  } else if (candidateInfo[4].toUpperCase() === WARNING_DIRECTIVES.QUOTE.toUpperCase()) {
    console.warn(`Candidate ${profile.fullName} does not have a valid quote`);
  } else if (candidateInfo[5].toUpperCase() === WARNING_DIRECTIVES.PHOTO_CREDS.toUpperCase()) {
    console.warn(`Candidate ${profile.fullName} does not have valid photo credits`);
  } else if (candidateInfo[6].toUpperCase() === WARNING_DIRECTIVES.PARTY.toUpperCase()) {
    console.warn(`Candidate ${profile.fullName} does not have a valid party name`);
  }

  // Wrap the candidate's quote in actual quotes if need be
  if (!/^\".*\"$/.test(profile.quote)) {
    if (!profile.quote.startsWith('"')) {
      profile.quote = '"' + profile.quote;
    }

    if (!profile.quote.endsWith('"')) {
      profile.quote += '"';
    }
  }

  return profile;
}

/**
 * Parses lines of text into HTML elements.
 * @param {string[]} lines Lines of text for the biography
 * @returns {string}
 */
function parseBio(lines) {
  return lines.join(' ');
  // Whether or not we're parsing a list
  const parsedElems = [];

  for (let i = 0; i < lines.length; i++) {
    // Lines starting with asterisks indicate lists
    if (lines[i].startsWith('* ')) {
      const listItems = [];
      // Iterate until we don't find a line that starts with an asterisk OR we reach the EOF
      for (; i < lines.length && lines[i].startsWith('* '); i++) {
        listItems.push(`<li>${lines[i].substring(2)}</li>`);
      }
      parsedElems.push(`<ul>${listItems.join('')}</ul>`);

      // Update index
      i--;
    } else {
      parsedElems.push(`<p>${lines[i]}</p>`);
    }
  }

  return parsedElems.join('');
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

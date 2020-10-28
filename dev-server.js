const buildProfiles = require('./scripts/profiles');

const express = require('express');
const app = express();

const profilesPromise = buildProfiles('./src/data/profiles');

app.use(express.static('src/'));

app.get('/', (_, res) => res.redirect('/index.html'));

app.get('/content/profiles.json', (_, res) => {
  profilesPromise.then(profiles => {
    res.send(profiles);
  });
});

app.listen(8080, () => {
  console.log('Development server started on http://localhost:8080/');
});

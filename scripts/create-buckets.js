const S3 = require('aws-sdk/clients/s3');

const argv = process.argv.slice(2);

if (argv.length === 0) {
  throw new Error('No bucket names provided');
}

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const promises = argv.map(bucketName =>
  new Promise((resolve, reject) => {
    s3.createBucket({
      Bucket: bucketName,
      ACL: 'public-read'
    }, (err, _) => {
      if (err) reject(err);
      else resolve();
    });
  })
);

Promise.all(promises)
  .then(() => console.log('Buckets created'))
  .catch(err => {
    throw err;
  });

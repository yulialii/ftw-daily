const passport = require('passport');
const passportFacebook = require('passport-facebook');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const callbackURL = `http://localhost:${PORT}/api/auth/google/callback`;
console.log('callback url', callbackURL);

const strategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL,
};

const verifyCallback = (accessToken, refreshToken, profile, done) => {
  console.log('Google profile:', profile);
  return done(null, profile);
};

passport.use(new GoogleStrategy(strategyOptions, verifyCallback));

exports.authenticateGoogle = passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/plus.login'],
});

exports.authenticateGoogleCallback = passport.authenticate('google', {
  session: false,
  successRedirect: `${rootUrl}/#`,
  failureRedirect: `${rootUrl}/login`,
});

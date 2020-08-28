const http = require('http');
const https = require('https');
const passport = require('passport');
const passportFacebook = require('passport-facebook');
const sharetribeSdk = require('sharetribe-flex-sdk');
const sdkUtils = require('../../api-util/sdk');

const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT, radix);
const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const CLIENT_SECRET = process.env.SHARETRIBE_SDK_CLIENT_SECRET;
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;
const TRANSIT_VERBOSE = process.env.REACT_APP_SHARETRIBE_SDK_TRANSIT_VERBOSE === 'true';
const USING_SSL = process.env.REACT_APP_SHARETRIBE_USING_SSL === 'true';
const rootUrl = process.env.REACT_APP_CANONICAL_ROOT_URL;
const clientID = process.env.FACEBOOK_APP_ID;
const clientSecret = process.env.FACEBOOK_APP_SECRET;

// Instantiate HTTP(S) Agents with keepAlive set to true.
// This will reduce the request time for consecutive requests by
// reusing the existing TCP connection, thus eliminating the time used
// for setting up new TCP connections.
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const baseUrl = BASE_URL ? { baseUrl: BASE_URL } : {};

const FacebookStrategy = passportFacebook.Strategy;

const callbackURL = `http://localhost:${PORT}/api/auth/facebook/callback`;

const strategyOptions = {
  clientID,
  clientSecret,
  callbackURL,
  profileFields: ['id', 'displayName', 'name', 'emails'],
};

const verifyCallback = (accessToken, refreshToken, profile, done) => {
  const { email } = profile._json;
  const userData = {
    email,
    accessToken,
    refreshToken,
  };

  done(null, userData);
};

passport.use(new FacebookStrategy(strategyOptions, verifyCallback));

exports.authenticateFacebook = passport.authenticate('facebook', { scope: ['email'] });

exports.authenticateFacebookCallback = (req, res, next) => {
  passport.authenticate('facebook', function(err, user, info) {
    console.log('Error:', err);
    console.log('User', user);
    if (err || !user) {
      return res.redirect(`${rootUrl}/login#fail`);
    }

    const tokenStore = sharetribeSdk.tokenStore.expressCookieStore({
      clientId: CLIENT_ID,
      req,
      res,
      secure: USING_SSL,
    });

    const sdk = sharetribeSdk.createInstance({
      transitVerbose: TRANSIT_VERBOSE,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      httpAgent,
      httpsAgent,
      tokenStore,
      typeHandlers: sdkUtils.typeHandlers,
      ...baseUrl,
    });

    sdk
      .authWithIdp({
        idpClientId: `${clientID}`,
        idpToken: `${user.accessToken}`,
      })
      .then(response => {
        console.log('Flex API response:', response);
        res.redirect(`${rootUrl}/#success`);
      })
      .catch(e => {
        res.redirect(`${rootUrl}/login#flex-fail`);
        console.log('Flex API error:', e);
      });
  })(req, res, next);
};

const path = require('path') // has path and __dirname
const express = require('express')
const oauthServer = require('../oath')
const DebugControl = require('../utilities/debug')

const router = express.Router() // Instantiate a new router

// const filePath = path.join(__dirname, '../public/oauthAuthenticate.html')

router.get('/', (req,res) => {  // send back a simple form for the oauth
    return res.json({ account: 'todo' });
})

router.post('/authorize', (req,res,next) => {
  DebugControl.log.flow('Initial User Authentication')
  const {username, password} = req.body
  if(username === 'username' && password === 'password') {
    req.body.user = {user: 1}
    return next()
  }
  const params = [ // Send params back down
    'client_id', // client
    'redirect_uri', // client.redirect
     // tried 'code', I think this does authorization_code grant.
     // token is not supported for some reason https://github.com/oauthjs/node-oauth2-server/blob/master/lib/handlers/authorize-handler.js#L32
    'response_type',
    'grant_type', // implicit ?
    'state', // could be used to prevent CSRF https://www.npmjs.com/package/csurf
    'scope', // is a comma separated permissions string like 'public,birthday,email'
  ]
    .map(a => `${a}=${req.body[a]}`)
    .join('&')
  return res.redirect(`/oauth?success=false&${params}`)
}, (req,res, next) => { // sends us to our redirect with an authorization code in our url
  DebugControl.log.flow('Authorization')
  return next()
}, oauthServer.authorize({
  authenticateHandler: {
    handle: req => {
      DebugControl.log.functionName('Authenticate Handler')
      DebugControl.log.parameters(Object.keys(req.body).map(k => ({name: k, value: req.body[k]})))
      return req.body.user
    }
  },
  allowEmptyState: true,
  authorizationCodeLifetime: 600 // 10min, default 5 minutes
}))

router.post('/token', (req,res,next) => {
  DebugControl.log.flow('Token')
  next()
}, oauthServer.token({
  requireClientAuthentication: { // whether client needs to provide client_secret
    'authorization_code': false,
    accessTokenLifetime: 3600, // 1hr, default 1 hour
    refreshTokenLifetime: 1209600 // 2wk, default 2 weeks
  },
}))  // Sends back token

module.exports = router
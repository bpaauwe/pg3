const Router = require('@koa/router')
const fs = require('fs-extra')
const { Tail } = require('tail')

// const logger = require('../modules/logger')
const config = require('../config/config')

/**
 * Frontend Interface Module
 * @module routes/frontend
 * @version 3.0
 */

/**
 Headers: Content-Type: application/json
 Body: {"username": "admin", "password": "admin"}
 Response: {"success": true, "token": "JWT TOKEN", "user": {"username": "e42"}}
 * @name authenticate
 * @route {POST} /frontend/authenticate
 */
const router = new Router({ prefix: '/frontend' })

/**
Headers: Content-Type: application/json
Authorization: JWT token
Body: None
Response: {"isyHost":"10.0.0.14","isyPort":"80","isyUsername":"admin","isyPassword":"admin","isyHttps":"false","mqttHost":"10.0.0.17","mqttPort":"1883"}
* @name settings
* @route {GET} /frontend/settings
*/
router.get('/settings', ctx => {
  const settings = {
    global: config.globalsettings
  }
  ctx.response.body = settings
})

router.get('/ispolisy', ctx => {
  const ispolisy = {
    isPolisy: config.globalsettings.polisy
  }
  ctx.response.body = ispolisy
})

router.get('/logstream/:type', async ctx => {
  const {
    params: { type }
  } = ctx
  if (type === 'main') {
    ctx.response.set('content-type', 'text/plain;charset=UTF-8')
    // Stream Log File
  }
})

module.exports = router

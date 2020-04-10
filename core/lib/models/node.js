const { v4: uuid } = require('uuid')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 *  Node Model
 * @module models/node
 * @version 3.0
 */

const TABLENAME = 'node'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    profileNum INTEGER NOT NULL,
    address TEXT NOT NULL,
    name TEXT,
    nodeDefId TEXT,
    hint TEXT,
    controller INTEGER NOT NULL CHECK (controller IN (0,1)),
    primaryNode TEXT,
    isPrimary INTEGER NOT NULL CHECK (isPrimary IN (0,1)),
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER,
    FOREIGN KEY (uuid, profileNum)
      REFERENCES nodeserver(uuid, profileNum)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum, address)
  );
  CREATE INDEX idx_${TABLENAME}_uuid_profileNum_address
  ON ${TABLENAME} (uuid, profileNum, address)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.enabled = 1
    this.controller = 0
    this.isPrimary = 0
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'profileNum', 'address']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion']
const MUTABLE = ['name', 'nodeDefId', 'hint', 'controller', 'primary', 'isPrimary', 'enabled']

async function get(key, profileNum, address) {
  if (!key || !profileNum || !address)
    throw new Error(`${TABLENAME} get requires a uuid, profileNum, and address`)
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
    .get(key, profileNum, address)
}

async function getAll() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME}`).all()
}

async function getAllIsy(key) {
  return config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid) is (?)`).run(key)
}

async function getAllNodeServer(key, profileNum) {
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .run(key, profileNum)
}

async function add(obj) {
  if (!obj || typeof obj !== 'object')
    throw new Error(`${TABLENAME} object not present or not an object`)
  // Deepcopy hack
  const newObj = JSON.parse(JSON.stringify(obj))
  // Can't overwrite internal properties. Nice try.
  IMMUTABLE.forEach(key => delete newObj[key])
  const checkProps = u.verifyProps(newObj, REQUIRED)
  if (!checkProps.valid) throw new Error(`${TABLENAME} object missing ${checkProps.missing}`)
  const newNode = new DEFAULTS()
  // Overwrite defaults with passed in properties
  Object.assign(newNode, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newNode).forEach(key => {
    if (typeof newNode[key] === 'boolean') newNode[key] = newNode[key] ? 1 : 0
  })
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newNode)})
    VALUES (${Object.keys(newNode).fill('?')})`
    )
    .run(Object.values(newNode))
}

async function update(key, profileNum, address, updateObject) {
  if (key && profileNum && address && updateObject && typeof updateObject === 'object') {
    const current = await get(key, profileNum, address)
    if (current) {
      let updated = ``
      MUTABLE.forEach(item => {
        if (u.isIn(updateObject, item)) {
          if (typeof updateObject[item] === 'boolean')
            updated += `${item} = '${updateObject[item] ? 1 : 0}',`
          else updated += `${item} = '${updateObject[item]}',`
        }
      })
      if (updated.length > 0) {
        updated += `timeModified = ${Date.now()}`
        return config.db
          .prepare(
            `UPDATE ${TABLENAME} SET
          ${updated}
          WHERE (uuid, profileNum, address) is (?, ?, ?)`
          )
          .run(key, profileNum, address)
      }
    } else throw new Error(`${TABLENAME} ${key}/${profileNum}/${address} does not exist`)
  } else throw new Error(`updateNode parameters not valid`)
  return null
}

async function remove(key, profileNum, address) {
  if (!key || !profileNum || !address)
    throw new Error(`remove ${TABLENAME} requires uuid, profileNum, and address parameters`)
  return config.db
    .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
    .run(key, profileNum, address)
}

module.exports = { TABLE, DEFAULTS, get, getAll, getAllIsy, getAllNodeServer, add, update, remove }
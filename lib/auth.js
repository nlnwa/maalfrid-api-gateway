const db = require('./db')
const schedule = require('node-schedule')

const ROLES = {
  ANY_USER: 0,
  ANY: 1,
  ADMIN: 2,
  CURATOR: 3,
  READONLY: 4
}

const LOGGED_IN = [ROLES.ANY_USER, ROLES.ANY]
const ADMIN_ONLY = [ROLES.ADMIN]

let roleMap = []

schedule.scheduleJob({minute: 1}, updateRoleMap)

async function updateRoleMap () {
  roleMap = await db.getRoleMapping()
}

function adminGuard (app) {
  return roleGuard(ADMIN_ONLY)(app)
}

function roleGuard (allowedRoles) {
  return authGuard(async (user) => {
    const roles = getRolesForUser(user.email, user.groups, LOGGED_IN)
    // ~ operator means -(N+1) so if indexOf return -1 it means 0 e.g. falsy
    return roles.some((role) => ~allowedRoles.indexOf(role))
  })
}

function authGuard (assertion) {
  return (app) => async function auth (ctx, next) {
    const isAuthorized = await assertion(ctx.state.user)

    ctx.assert(isAuthorized, 403, 'Unauthorized')

    await app(ctx, next)
  }
}

function getRolesForUser (email, groups, roles) {
  return roles
    .concat(findRoleMappingForEmail(email))
    .concat(findRoleMappingForGroups(groups))
}

function findRoleMappingForEmail (email) {
  return findRoleMapping('email', email)
}

function findRoleMappingForGroups (groups) {
  if (!groups) {
    return []
  }
  return groups.reduce((roles, group) => roles.concat(findRoleMappingForGroup(group)), [])
}

function findRoleMappingForGroup (group) {
  return findRoleMapping('group', group)
}

function findRoleMapping (key, value) {
  const mapping = roleMap
    .filter((mapping) => mapping.hasOwnProperty(key))
    .find((mapping) => mapping[key] === value)
  return mapping ? mapping['role'] : []
}

module.exports = {adminGuard}

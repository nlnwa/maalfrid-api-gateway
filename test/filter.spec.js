const {describe, it, before} = require('mocha')
const {assert} = require('chai')

const reqlMock = {
  expr: (_) => _,
  add: (a, b) => new RegExp(a.concat(b))
}

const {
  someArrayElementEquals,
  someArrayElementIsPrefixOf,
  prefixOf,
  filterFn,
  fieldFilter,
  filterToReql
} = require('../lib/filter')(reqlMock)

const data = require('./filter')
const selection = require('./filter.data')
const filters = Object.freeze(data.filter)

describe('spec', () => {

})

describe('lib/filter.js', () => {
  before('monkeypatch built-ins to emulate reql objects', () => {
    // eslint-disable-next-line no-extend-native
    Array.prototype.contains = Array.prototype.some
    // eslint-disable-next-line no-extend-native
    String.prototype.eq = function (str) { return this.toString() === str }
    // eslint-disable-next-line no-extend-native
    Object.prototype.getField = function getField (field) { return this[field] }
  })

  describe('reqlMock', () => {
    it('r.add should return regexp of concatenated strings', () => {
      const expected = '/ab'.concat('cd/')
      const actual = reqlMock.add('ab', 'cd').toString()

      assert.equal(expected, actual)
    })

    it('getField should be an object method returning named property of object', () => {
      const expected = 2
      const obj = {expected}
      const actual = obj.getField('expected')
      assert.equal(expected, actual)
    })
  })

  describe('prefixOf', () => {
    it('should return a function when given an argument', () => {
      assert.isFunction(prefixOf('hello'))
    })

    it('returned function should return null when argument of function is not a prefix', () => {
      assert.isNull(prefixOf('hello')('go'))
    })

    it('returned function should return an array when argument of function is a prefix', () => {
      const result = prefixOf('golang')('go')

      assert.isArray(result)
      assert.equal(result[0], 'go')
    })
  })

  describe('someArrayElementEquals', () => {
    it('should return a function when given an argument', () => {
      assert.isFunction(someArrayElementEquals('NNO'))
    })

    it('returned function should return boolean when given an array argument', () => {
      assert.isBoolean(someArrayElementEquals('NNO')([1, 2, 3]))
    })

    it('returned function should throw when given an undefined argument', () => {
      assert.throws(someArrayElementEquals('NNO'), TypeError)

      // eslint-disable-next-line no-undef
      const fn = someArrayElementEquals('SSB').bind(someArrayElementEquals, undefined)
      assert.throws(fn, TypeError)
    })

    it('returned function should work', () => {
      const result = someArrayElementEquals('NNO')(['NNO', 1, 2, 3])
      assert.isTrue(result)
    })
  })

  describe('someArrayElementIsPrefixOf', () => {
    it('should return a function when given an argument', () => {
      const result = someArrayElementIsPrefixOf('NNO')
      assert.isFunction(result)
    })

    it('returned function should return boolean when argument is any array', () => {
      const result = someArrayElementIsPrefixOf('NNO')([1, '2', {}])
      assert.isBoolean(result)
    })

    it('returned function should throw when argument is undefined', () => {
      assert.throws(someArrayElementIsPrefixOf('NNO'), TypeError)
    })

    it('returned function should return true when there is some array element who is a prefix of stored string', () => {
      const result = someArrayElementIsPrefixOf('NNOBELUGA')(['NNOB', 1, 2, 3])
      assert.isTrue(result)
    })
  })

  describe('filterFn', () => {
    it('should return a function given the name of a filter', () => {
      const fn = filterFn('requestedUri')
      assert.isFunction(fn)
    })

    it('should return a predicateFn resolving true given a non-existent filter', () => {
      const fn = filterFn('barbie')
      assert.isTrue(fn('whatever'))
      assert.isTrue(fn('yo mo'))
      assert.isTrue(fn(32))
    })
  })

  describe('fieldFilter', () => {
    it('should return a function when given an argument', () => {
      const name = 'requestedUri'
      const fn = fieldFilter(name, filters[name])
      assert.isFunction(fn)
    })

    it('returned function should return boolean when given an array argument', () => {
      const name = 'requestedUri'
      const predicateFn = fieldFilter(name, filters[name])
      const predicate = predicateFn(selection[0])
      assert.isBoolean(predicate)
    })
  })

  describe('filterToReql', () => {
    it('should return an array given an array selection and a set of filters', () => {
      assert.isArray(selection)
      assert.isObject(filters)
      const result = filterToReql(selection, filters)
      assert.isArray(result)
    })

    it('should filter a selection of according to the rules (of language)', () => {
      const no = {language: 'BOR'}
      const yes = {language: 'NNO'}
      const selection = [no, yes]
      const filters = {language: ['NNO']}

      const result = filterToReql(selection, filters)
      assert.deepEqual(result, [yes])
    })

    it('should filter a selection of according to the rules (of requestedUri)', () => {
      const no = {language: 'BOR', requestedUri: 'https://www.nb.no'}
      const yes = {language: 'NNO', requestedUri: 'https://nettarkivet.nb.no'}
      const selection = [no, yes]
      const filters = {requestedUri: ['https://nettarkivet']}

      const result = filterToReql(selection, filters)
      assert.deepEqual(result, [yes])
    })
  })
})

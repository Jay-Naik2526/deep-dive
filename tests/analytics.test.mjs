// Analytics must be off by default, respect Do Not Track, and only ever name fixed events.
import test from 'node:test'
import assert from 'node:assert/strict'
import { providerFrom, allowed, eventForLink } from '../src/analytics.ts'

test('is OFF by default: no ID configured means nothing loads', () => {
  assert.equal(providerFrom({}), null)
  assert.equal(providerFrom({ goatcounter: '  ', plausible: '' }), null)
  assert.equal(allowed({ provider: null }), false)
})

test('picks a provider only when an ID is set', () => {
  assert.equal(providerFrom({ goatcounter: 'jaynaik' }), 'goatcounter')
  assert.equal(providerFrom({ plausible: 'jaynaik.tech' }), 'plausible')
})

test('Do Not Track and the opt-out switch always win', () => {
  assert.equal(allowed({ provider: 'goatcounter', dnt: '1' }), false)
  assert.equal(allowed({ provider: 'goatcounter', dnt: 'yes' }), false)
  assert.equal(allowed({ provider: 'goatcounter', optOut: true }), false)
  assert.equal(allowed({ provider: 'goatcounter', dnt: '0' }), true)
  assert.equal(allowed({ provider: 'plausible', dnt: null }), true)
})

test('link clicks become fixed event names, never urls', () => {
  assert.equal(eventForLink('mailto:naikjay208@gmail.com'), 'email-click')
  assert.equal(eventForLink('https://drive.google.com/file/d/abc/view'), 'resume-open')
  assert.equal(eventForLink('https://github.com/Jay-Naik2526/deep-dive/issues/new?template=guestbook.yml'), 'guestbook-sign')
  assert.equal(eventForLink('https://github.com/Jay-Naik2526'), 'link-github')
  assert.equal(eventForLink('https://www.linkedin.com/in/jay-naik-68a00231a'), 'link-linkedin')
  assert.equal(eventForLink('https://studysync-inky.vercel.app'), null)
  assert.equal(eventForLink(''), null)
  for (const href of ['mailto:a@b.co', 'https://drive.google.com/x', 'https://github.com/x']) {
    const n = eventForLink(href)
    assert.ok(!/[:/@.]/.test(n ?? ''), `event name "${n}" must not contain a url or address`)
  }
})

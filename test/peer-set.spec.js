/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const PeerSet = require('../src')
const parallel = require('run-parallel')

function peerToId (peer) {
  return peer.id
}

describe('peer-set', function () {
  this.timeout(20000)

  it('create with bootstrap peers', (done) => {
    const Alice = {id: 'Alice'}
    const Bob = {id: 'Bob'}
    const set = new PeerSet([Alice, Bob], {peerToId: peerToId})
    expect(set).to.exist
    expect(set.peers[set.peerToId(Alice)]).to.eql(Alice)
    expect(set.peers[set.peerToId(Bob)]).to.eql(Bob)
    done()
  })

  it('get single peer', (done) => {
    const Alice = {id: 'Alice'}
    const Bob = {id: 'Bob'}
    const set = new PeerSet([Alice, Bob], {peerToId: peerToId})
    expect(set).to.exist
    expect(set.get(Alice)).to.eql(Alice)
    expect(set.get(Bob)).to.eql(Bob)
    done()
  })

  it('emits the peer.id in a `remove` event whenever a peer is removed', (done) => {
    const Alice = {id: 'Alice'}
    const Bob = {id: 'Bob'}

    parallel([
      (cb) => {
        const set = new PeerSet([Alice, Bob], {peerToId: peerToId})
        set.once('remove', (id) => {
          expect(id).to.eql(Alice.id)
          cb()
        })
        set.remove(Alice)
      },
      (cb) => {
        const set = new PeerSet([Alice], {limit: 1, peerToId: peerToId})
        set.once('remove', (id) => {
          expect(id).to.eql(Alice.id)
          cb()
        })
        set.add([Bob], [Alice])
      }
    ], done)
  })

  it('sample a subset of peers', (done) => {
    const peers = Array.from(new Array(50), (x, i) => {
      return {id: 'id_' + i}
    })
    const set = new PeerSet(peers, {peerToId: peerToId})
    const subset = set.sample(10)
    expect(subset).to.have.lengthOf(10)

    const empty = new PeerSet()
    expect(empty.sample()).to.have.lengthOf(0)
    done()
  })

  it('limit the amount of peers when specified', (done) => {
    const peers = Array.from(new Array(11), (x, i) => {
      return {id: 'id_' + i}
    })
    const set = new PeerSet(peers, {peerToId: peerToId, limit: 10})
    expect(set).to.have.lengthOf(10)
    done()
  })

  it('replaces given peers with new peers', (done) => {
    const old = Array.from(new Array(10), (x, i) => {
      return {id: 'id_a_' + i}
    })
    const set = new PeerSet(old, {peerToId: peerToId, limit: 10})
    expect(set).to.have.lengthOf(10)

    const sampled = set.sample(5)
    expect(sampled).to.have.lengthOf(5)

    const fresh = Array.from(new Array(5), (x, i) => {
      return {id: 'id_b_' + i}
    })

    set.add(fresh, sampled)
    expect(set).to.have.lengthOf(10)
    let oldCount = 0
    let freshCount = 0

    set.forEach((peer) => {
      const id = set.peerToId(peer)
      if (id.startsWith('id_a_')) {
        oldCount++
      } else {
        freshCount++
      }
    })

    expect(oldCount).to.eql(5)
    expect(freshCount).to.eql(5)

    done()
  })
})

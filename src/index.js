'use strict'

const sample = require('pick-random')
const EventEmitter = require('events').EventEmitter

function defaultPeerToId (peer) {
  return peer.id.toB58String()
}
var i = 0
class PeerSet extends EventEmitter {
  constructor (peers, opts = {}) {
    super()

    this.peers = {}
    this.limit = opts.limit
    this.peerToId = opts.peerToId || defaultPeerToId
    if (peers) {
      this.add(peers)
    }
  }

  sample (limit, exclude) {
    let ids = Object.keys(this.peers)
    if (ids.length === 0) {
      return []
    }
    if (exclude && exclude.length > 0) {
      const excludeIds = exclude.map(this.peerToId)
      ids = ids.filter(peer => excludeIds.indexOf(peer) < 0)
    }
    if (ids.length === 0) {
      return []
    }

    let sampled = sample(ids, {count: Math.min(limit, ids.length)})
    return sampled.map((key) => {
      return this.peers[key]
    })
  }

  get length () {
    return Object.keys(this.peers).length
  }

  get (peer) {
    const id = this.peerToId(peer)
    return this.peers[id]
  }

  getAll () {
    return Object.keys(this.peers)
      .map(peer => this.peers[peer])
  }

  forEach (fn) {
    Object.keys(this.peers).forEach((peer) => {
      fn(this.peers[peer])
    })
  }

  remove (peer) {
    i++
    const id = this.peerToId(peer)
    peer = this.peers[id]
    if (peer) {
      delete this.peers[id]
    }
    this.emit('remove', id)
  }

  add (peers, replaceable) {
    peers.forEach((peer, i) => {
      // check if we have reached a limit
      if (this.limit && this.length >= this.limit) {
        // if so, halt if we have no element to replace
        if (!replaceable || replaceable.length === 0) {
          return
        }
        // otherwise, replace
        let replacing = replaceable.shift(0)
        const id = this.peerToId(replacing)
        this.emit('remove', id)
        delete this.peers[id]
      }
      const id = this.peerToId(peer)
      const exist = this.peers[id]
      this.peers[id] = peer

      if (!exist) {
        this.emit('add', peer)
      } else {
        this.emit('update', peer)
      }
    })
  }
}

module.exports = PeerSet

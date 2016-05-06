'use strict'

const sample = require('pick-random')
const EventEmitter = require('events').EventEmitter

function defaultPeerToId (peer) {
  return peer.id.toB58String()
}

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

  sample (limit) {
    let ids = Object.keys(this.peers)
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

  forEach (fn) {
    Object.keys(this.peers).forEach((peer) => {
      fn(this.peers[peer])
    })
  }

  remove (peer) {
    const id = this.peerToId(peer)
    peer = this.peers[id]
    if (peer) {
      delete this.peers[id]
    }
    this.emit('remove', peer)
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
        this.emit('remove', this.peers[id])
        delete this.peers[id]
      }
      const id = this.peerToId(peer)
      this.peers[id] = peer
      this.emit('add', peer)
    })
  }
}

module.exports = PeerSet

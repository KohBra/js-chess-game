import { implement } from './helpers.js'
import MoveSet from './MoveSet.js'

export default class Piece
{
    type = null
    color = null
    position = null
    moved = false

    constructor (position, color = null) {
        this.color = color
        this.position = position
    }

    getType () {
        return this.type
    }

    getPosition () {
        return this.position
    }

    getColor () {
        return this.color
    }

    setMoved () {
        this.moved = true
    }

    hasMoved () {
        return this.moved
    }

    getCharacter () {
        implement('Implement getCharacter()')
    }

    getPinningMoves (board) {
        return new Moveset
    }

    getPotentialMoves (board) {
        implement('Implement getPotentialMoves()')
    }
}
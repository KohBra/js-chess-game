import { implement } from './helpers.js'

export default class Piece
{
    type = null
    color = null
    position = null
    moved = false
    protected = false
    underAttack = false
    pinned = false
    currentPotentialMoves = null

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

    getValue () {
        implement('Implement getValue()')
    }

    getPinningMoves (board) {
        implement('Implement getPinningMoves()')
    }

    getPotentialMoves (board) {
        implement('Implement getPotentialMoves()')
    }

    setProtected (isProtected = true) {
        this.protected = isProtected
    }

    isProtected () {
        return this.protected
    }

    setAttacked (underAttack = true) {
        this.underAttack = underAttack
    }

    isUnderAttack () {
        return this.underAttack
    }

    setPinned (isPinned = true) {
        this.pinned = isPinned
    }

    isPinned () {
        return this.pinned
    }

    setPotentialMoves (moves) {
        this.currentPotentialMoves = moves
    }

    getAvailableMoves () {
        return this.currentPotentialMoves
    }
}
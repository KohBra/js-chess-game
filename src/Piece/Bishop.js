import Piece from '../Piece.js'
import { BISHOP } from '../const.js'
import MoveSet from '../MoveSet.js'
import { addMoveVectors, addPinVectors, getDiagonalVectors } from '../helpers.js'

export default class Bishop extends Piece
{
    type = BISHOP

    getCharacter () {
        return '\u2657'
    }

    getPinningMoves (board) {
        let moves = new Moveset
        addPinVectors(getDiagonalVectors, this, moves, board)
        return moves
    }

    getPotentialMoves (board) {
        let moves = new Moveset
        addMoveVectors(getDiagonalVectors, this, moves, board)
        return moves
    }
}
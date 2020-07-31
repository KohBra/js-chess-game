import Piece from '../Piece.js'
import { BISHOP } from '../const.js'
import MoveSet from '../MoveSet.js'
import { addMoveVectors, addPinVectors, getDiagonalVectors } from '../helpers.js'

export default class Bishop extends Piece
{
    type = BISHOP

    getValue () {
        return 3
    }

    getPinningMoves (board) {
        let moves = new MoveSet
        addPinVectors(getDiagonalVectors, this, moves, board)
        return moves
    }

    getPotentialMoves (board) {
        let moves = new MoveSet
        addMoveVectors(getDiagonalVectors, this, moves, board)
        return moves
    }
}
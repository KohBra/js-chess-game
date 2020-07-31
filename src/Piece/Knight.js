import Piece from '../Piece.js'
import { KNIGHT } from '../const.js'
import MoveSet from '../MoveSet.js'
import Position from '../Position.js'
import Move from '../Move.js'
import { oppositeColor } from '../helpers.js'

export default class Knight extends Piece
{
    type = KNIGHT

    getValue () {
        return 3
    }

    getMovePositions () {
        return [
            new Position(this.position.rank + 1, this.position.file + 2),
            new Position(this.position.rank - 1, this.position.file + 2),
            new Position(this.position.rank + 2, this.position.file - 1),
            new Position(this.position.rank + 2, this.position.file + 1),
            new Position(this.position.rank + 1, this.position.file - 2),
            new Position(this.position.rank - 1, this.position.file - 2),
            new Position(this.position.rank - 2, this.position.file - 1),
            new Position(this.position.rank - 2, this.position.file + 1)
        ]
    }

    getPinningMoves (board) {
        let moves = new MoveSet

        this.getMovePositions().forEach(position => {
            if (!board.isValidPosition(position)) {
                return
            }

            if (board.hasPieceAt(position, oppositeColor(this.color))) {
                return
            }

            moves.add(new Move(this, position))
        })

        return moves
    }

    getPotentialMoves (board) {
        let moves = new MoveSet

        this.getMovePositions().forEach(position => {
            if (!board.isValidPosition(position)) {
                return
            }

            if (board.hasPieceAt(position, this.color)) {
                return
            }

            moves.add(new Move(this, position))
        })

        return moves
    }
}
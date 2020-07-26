import SpecialMove from './SpecialMove.js'
import Move from '../Move.js'
import Position from '../Position.js'

export default class QueensideCastle extends SpecialMove
{
    execute (board) {
        board.executeMove(this)
        board.executeMove(new Move(board.at(this.to.rank, 1), new Position(this.to.rank, 4)))
    }
}
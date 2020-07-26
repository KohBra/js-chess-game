import SpecialMove from './SpecialMove.js'
import Queen from '../Piece/Queen.js'

export default class Promotion extends SpecialMove
{
    execute (board, { addPiece, removePiece }) {
        // todo choice?
        removePiece(this.piece)
        addPiece(new Queen(this.to, this.piece.color))
    }
}
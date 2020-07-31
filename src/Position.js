export default class Position
{
    constructor (rank, file) {
        this.rank = rank
        this.file = file
    }

    equals (position) {
        return this.rank === position.rank && this.file === position.file
    }

    copy () {
        return new Position(this.rank, this.file)
    }
}
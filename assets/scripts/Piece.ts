import { _decorator, Component, Node, resources, Sprite, SpriteFrame } from 'cc'
const { ccclass, property } = _decorator

export enum PieceState {
  CLICK = 'CLICK',
  LINE = 'LINE',
  COLUMN = 'COLUMN',
  WRAP = 'WRAP',
//   ELIMINATE_SAME = 'ELIMINATE_SAME'
}
/**
 * 其子类需要实现的方法
 * 1. 加载棋子
 * 2. 设置棋子状态
 *      棋子状态：常规、消除整行、消除整列、消除整行整列、消除相同棋子
 *      不同状态下显示不同的 SpriteFrame
 */

@ccclass('Piece')
export class Piece extends Component {

  @property({ type: String, tooltip: '棋子名称' })
  pieceName: string = ''

  @property({
    type: String,
    tooltip: `
        CLICK：常规,
        LINE：消除整行,
        COLUMN：消除整列,
        ELIMINATE_ROW_COL：消除整行整列
    `
  })
  pieceState: string = PieceState.CLICK

  private path: string = 'pieces/'
  start() {
    // this.loadPiece()
  }

  update(deltaTime: number) {}

  setState(state: PieceState) {
    this.pieceState = state
    this.loadPiece()
  }
  
  resolvePath() {
    const suffix = this.pieceState.toLocaleLowerCase()
    return `${this.path}${this.pieceName}/${this.pieceName}_${suffix}_00`
  }

  loadPiece() {
    const _path = this.resolvePath()
    resources.load(_path, (err, _spriteFrame) => {
      this.node.getComponent(Sprite).spriteFrame = _spriteFrame as SpriteFrame
    })
  }
}

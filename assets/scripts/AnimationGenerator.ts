import { _decorator, Component, Node, Sprite, SpriteFrame, resources, Animation, AnimationClip } from 'cc'
import { PieceState } from './Piece'

const { ccclass, property } = _decorator

@ccclass('AnimationGenerator')
export class AnimationGenerator extends Component {

  pieceState: string = PieceState.LINE

  private path: string = 'pieces/'

  piece: Node = null!
  frameCount: number = 28

  start() {
    // this.loadFramesFromResources()
  }

  update(deltaTime: number) {}

  /**
   * 获取路径数组
   * @returns
   */
  getFramePaths(pieceName: string, pieceState: string): string[] {
    const framePaths: string[] = []
    this.frameCount = pieceState === PieceState.WRAP ? 48 : 28
    const suffix = pieceState.toLocaleLowerCase()
    this.pieceState = pieceState
    for (let i = 0; i <= this.frameCount; i++) {
      framePaths.push(
        `${this.path}${pieceName}/${pieceName}_${suffix}_${
          i < 10 ? '0' + i : i
        }`
      )
    }
    return framePaths
  }

  loadFramesFromResources(pieceName: string, pieceState: string, piece: Node) {
    const framePaths = this.getFramePaths(pieceName, pieceState)
    this.piece = piece

    resources.load(framePaths, SpriteFrame, (err, assets) => {
      if (err) {
        console.error('Failed to load frames:', err)
        return
      }
      // console.log('Loaded frames:', assets)
      const frames = assets as SpriteFrame[]
      this.createFrameAnimation(frames)
    })
  }

  createFrameAnimation(frames: SpriteFrame[]) {
    console.log('Creating animation with frames:',  this.frameCount)
      const clip = AnimationClip.createWithSpriteFrames(frames, this.frameCount / 2)
      clip.name = this.pieceState.toLocaleLowerCase()

      const anim = this.piece.getComponent(Animation)
      if (!anim) {
        console.error('Animation component not found!')
        return
      }
      clip.wrapMode = AnimationClip.WrapMode.Loop
      anim.addClip(clip)
      anim.play(clip.name)
  }
}
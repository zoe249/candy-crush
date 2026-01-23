import { _decorator, Component, Node, Sprite, SpriteFrame, resources } from 'cc'
import { PieceState } from './Piece'

const { ccclass, property } = _decorator

@ccclass('AnimationGenerator')
export class AnimationGenerator extends Component {
  // @property(Sprite)
  // sprite: Sprite = null!

  pieceState: string = PieceState.CLICK

//   @property({ tooltip: '资源路径前缀' })
//   pieceName: string = ''

  private path: string = 'pieces/'

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
    const frameCount = pieceState === PieceState.WRAP ? 48 : 28
    const suffix = pieceState.toLocaleLowerCase()
    for (let i = 0; i <= frameCount; i++) {
      framePaths.push(
        `${this.path}${pieceName}/${pieceName}_${suffix}_${
          i < 10 ? '0' + i : i
        }`
      )
    }
    return framePaths
  }

  loadFramesFromResources(pieceName: string, pieceState: string) {
    const framePaths = this.getFramePaths(pieceName, pieceState)
    console.log('framePaths', framePaths)

    // const framePaths: string[] = ['pieces/bear/bear_click_00']

    resources.load(framePaths, SpriteFrame, (err, assets) => {
      if (err) {
        console.error('Failed to load frames:', err)
        return
      }
      console.log('Loaded frames:', assets)
      const frames = assets as SpriteFrame[]
      this.createFrameAnimation(frames)
    })
  }

  createFrameAnimation(frames: SpriteFrame[]) {}
}

// import { _decorator, Component, Node, Sprite, Animation, AnimationClip, SpriteFrame, resources } from 'cc';
// const { ccclass, property } = _decorator;

// @ccclass('AnimationGenerator')
// export class AnimationGenerator extends Component {
//     @property(Sprite)
//     sprite: Sprite = null!; // 拖拽您的 Sprite 组件到此属性

//     @property
//     frameRate: number = 10; // 每秒帧数

//     @property
//     framesPath: string = 'animations/'; // SpriteFrame 资源路径前缀，例如 'animations/frame'

//     @property
//     frameCount: number = 3; // 帧的数量

//     start() {
//         if (!this.sprite) {
//             console.error('Sprite component not assigned!');
//             return;
//         }

//         this.loadFramesFromResources();
//     }

//     private loadFramesFromResources() {
//         // 构建路径数组，例如 ['animations/frame0', 'animations/frame1', 'animations/frame2']
//         const framePaths: string[] = [];
//         for (let i = 0; i < this.frameCount; i++) {
//             framePaths.push(`${this.framesPath}frame${i}`);
//         }

//         resources.load(framePaths, SpriteFrame, (err, assets) => {
//             if (err) {
//                 console.error('Failed to load frames:', err);
//                 return;
//             }
//             const frames = assets as SpriteFrame[];
//             this.createFrameAnimation(frames);
//         });
//     }

//     private createFrameAnimation(frames: SpriteFrame[]) {
//         const anim = this.node.getComponent(Animation);
//         if (!anim) {
//             console.error('Animation component not found!');
//             return;
//         }

//         // 创建 AnimationClip
//         const clip = new AnimationClip();
//         clip.name = 'FrameAnimation';
//         clip.duration = frames.length / this.frameRate; // 总时长 = 帧数 / 帧率

//         // 获取 Sprite.spriteFrame 属性的曲线
//         const spriteFrameCurve = clip.createPropertyCurve('sprite.spriteFrame', 'spriteFrame');

//         // 为每个帧添加关键帧
//         for (let i = 0; i < frames.length; i++) {
//             const time = i / this.frameRate; // 关键帧时间
//             spriteFrameCurve.addKey(time, frames[i]);
//         }

//         // 添加剪辑到动画组件
//         anim.addClip(clip);

//         // 播放动画（循环播放）
//         anim.play(clip.name);
//     }
// }

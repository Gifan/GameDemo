// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Graphics)
    pen: cc.Graphics = null;

    @property(cc.Sprite)
    spicon: cc.Sprite = null;

    @property(sp.Skeleton)
    spp: sp.Skeleton = null;

    @property(cc.Texture2D)
    test: cc.Texture2D = null;

    @property(cc.Camera)
    camera: cc.Camera = null;
    target: cc.RenderTexture = null;
    start() {
        this.target = new cc.RenderTexture();
        this.target.initWithSize(cc.winSize.width, cc.winSize.height, cc.RenderTexture.DepthStencilFormat.RB_FMT_D24S8);
        this.camera.targetTexture = this.target;
    }

    onRenderTexture() {
        // this.spicon.spriteFrame = new cc.SpriteFrame(this.targetTexture);
        // console.log(this.spicon.spriteFrame.getTexture(),this.test,this.spicon.spriteFrame.getRect(),);
        // let find = this.CreateRegion(this.spicon.spriteFrame.getTexture());
        let att = this.spp.getMaterial(0);
        att.setProperty('texture', this.target);
    }

    // update (dt) {}
}

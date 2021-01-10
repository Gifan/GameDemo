// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;
let vec4 = new cc.Vec4();
@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Sprite)
    testSprite: cc.Sprite = null;

    @property(cc.Slider)
    hSlider: cc.Slider = null;

    @property(cc.Slider)
    sSlider: cc.Slider = null;

    @property(cc.Slider)
    vSlider: cc.Slider = null;

    @property(cc.Label)
    hText: cc.Label = null;
    @property(cc.Label)
    sText: cc.Label = null;
    @property(cc.Label)
    vText: cc.Label = null;
    // LIFE-CYCLE CALLBACKS:

    private _material:cc.Material = null;
    onLoad() {
        this._material = this.testSprite.getMaterial(0);
        this._material.define("USE_CHANGEHSV", true);
        this.updateShow();
    }

    start() {

    }

    updateShow(){
        this.hText.string = cc.js.formatStr("H色相", (this.hSlider.progress*360).toFixed(1));
        this.sText.string = cc.js.formatStr("s饱和度", this.sSlider.progress.toFixed(1));
        this.vText.string = cc.js.formatStr("v明度", this.vSlider.progress.toFixed(1));
        cc.Vec4.set(vec4, this.hSlider.progress,this.sSlider.progress,this.vSlider.progress, 0);
        this._material.setProperty("hsv", vec4);
    }
    // update (dt) {}
}

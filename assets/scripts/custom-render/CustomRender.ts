// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property,mixins } = cc._decorator;

@ccclass
export default class CustomRender extends cc.RenderComponent {
    @property(cc.Texture2D)
    _texture: cc.Texture2D = null;

    @property(cc.Texture2D)
    get texture() {
        return this._texture;
    }
    set texture(val: cc.Texture2D) {
        this._texture = val;
        this._updateMaterial();
    }

    // @property({ type: [cc.Vec2], serializable: true })
    // _polygon: cc.Vec2[] = [];
    // @property({ type: [cc.Vec2], serializable: true })
    // public get polygon() {
    //     return this._polygon;
    // }
    // public set polygon(points: cc.Vec2[]) {
    //     this._polygon = points;
    //     this._updateVerts();
    // }

    _assembler: cc.Assembler = null;

    public _updateMaterial() {
        let texture = this._texture;
        let material = this.getMaterial(0);
        if (material) {
            if (material.getDefine("USE_TEXTURE") !== undefined) {
                material.define("USE_TEXTURE", true);
            }
            material.setProperty("texture", texture);
        }
        this.setVertsDirty();
    }
}

export class Wall2D {
    protected _A: cc.Vec2;//端点 A B
    protected _B: cc.Vec2;
    protected _N: cc.Vec2;// 法向量

    public constructor(from: cc.Vec2, to: cc.Vec2) {
        this._A = from;
        this._B = to;
        this.calculateNormal();
    }

    private calculateNormal() {
        let temp = this._B.sub(this._A).normalize();
        [temp.x, temp.y] = [-temp.y, temp.x];
        this._N = temp;
    }

    public form() { return this._A; }
    public to() { return this._B; }
    public setFrom(v: cc.Vec2) { this._A = v; this.calculateNormal(); }
    public setTo(v: cc.Vec2) { this._B = v; this.calculateNormal(); }

    public normal() { return this._N; }
    public center() { return this._A.add(this._B).mul(0.5) };
}
(function () {
    //@ts-ignore
    cc.Vec2.prototype.perp = function () {
        return cc.v2(-this.y, this.x);
    }
    //@ts-ignore
    cc.Vec2.prototype.sign = function (v2: cc.Vec2) {
        if (this.y * v2.x > this.x * v2.y) return -1;
        else return 1;
    }
    //@ts-ignore
    cc.Vec2.prototype.truncate = function (max: number) {
        if (this.magSqrt() > max * max) {
            return this.normalizeSelf().mulSelf(max);
        } else {
            return this;
        }
    }
}());
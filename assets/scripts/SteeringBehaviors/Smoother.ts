export class Smoother<T extends cc.Vec2>{
    private _history: Array<T> = null;
    private _nextUpdateSlot: number = 0;
    private _zeroValue: T;

    public constructor(sampleSize: number, zeroValue: T) {
        this._nextUpdateSlot = 0;
        this._zeroValue = zeroValue;
        this._history = (new Array<T>(sampleSize)).fill(zeroValue);
    }

    public onUpdate(mostRecentValue: T, out?: T): T {
        this._history[this._nextUpdateSlot++] = mostRecentValue;
        if (this._nextUpdateSlot == this._history.length) this._nextUpdateSlot = 0;
        if (!out) {
            out = this._zeroValue.clone() as T;
        }
        out.x = this._zeroValue.x;
        out.y = this._zeroValue.y;
        for (let i = 0, len = this._history.length; i < len; i++) {
            out.addSelf(this._history[i]);
        }
        out.divSelf(this._history.length);
        return out;
    }
}
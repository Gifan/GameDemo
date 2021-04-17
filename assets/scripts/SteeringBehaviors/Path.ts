export class Path {
    private _wayPoints: Array<cc.Vec2> = [];
    private _looped: boolean = false;
    private _curWayPointIndex: number = 0;
    public constructor() {

    }

    public isFinish() {
        return this._wayPoints.length == this._curWayPointIndex;
    }

    public createRandomPath(numWayPoints: number, minX: number, minY: number, maxX: number, maxY: number) {
        this.clear();
        let midX = (minX + maxX) * 0.5;
        let midY = (minY + maxY) * 0.5;
        let smaller = Math.min(midX, midY);
        let spacing = 2 * Math.PI / numWayPoints;
        let range1 = smaller * 0.2;
        for (let i = 0; i < numWayPoints; i++) {
            let radialDist = range1 + Math.random() * (smaller - range1);
            let temp = cc.v2(radialDist, 0);
            temp.rotateSelf(i * spacing);
            temp.x += midX; temp.y += midY;
            this._wayPoints.push(temp);
        }
    }

    public loopOn() { this._looped = true; }
    public loopOff() { this._looped = false; }

    public addWayPoint(newPoint: cc.Vec2) {
        this._wayPoints.push(newPoint);
    }

    public set(path: Path | cc.Vec2[]) {
        if (path instanceof Path) {
            this._wayPoints = path.getPath();
        } else {
            this._wayPoints = path;
        }
        this._curWayPointIndex = 0;
    }

    public getPath() {
        return this._wayPoints;
    }

    public clear() {
        this._wayPoints.length = 0;
    }

    public setNextWayPoint() {
        if (this._wayPoints.length > 0) {
            if (++this._curWayPointIndex == this._wayPoints.length) {
                if (this._looped) {
                    this._curWayPointIndex = 0;
                }
            }
        }
    }
}
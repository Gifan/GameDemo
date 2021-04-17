import BaseEntity from "./BaseEntity";
import { CellSpacePartition } from "./CellSpacePartition";
import { Obstacle } from "./Obstacle";
import { Path } from "./Path";
import Vehicle from "./Vehicle";
import { Wall2D } from "./Wall2D";
const tempVec22 = cc.v2();
const tempVec21 = cc.v2();
const tempVec3 = cc.v3();
export default class GameWorld {
    private _vehicles: Array<Vehicle> = [];//智能体
    private _cellSpace: CellSpacePartition<BaseEntity> = null;//空间分割
    private _obstacles: Array<Obstacle> = [];//障碍物
    private _walls: Array<Wall2D> = []; //墙体
    private _path: Path = null;//指定路径点

    private _pause: boolean = false;

    private _maxXClient: number = 0;
    private _maxYClient: number = 0;

    private _avFrameTime: number = 0;//平均帧率间隔时间，取多次dt的平均值

    //创建障碍物
    private createObstacles() {

    }
    //创建墙体
    private createWalls() {

    }

    public constructor(width: number, height: number) {
        this._maxXClient = width;
        this._maxYClient = height;
        this._cellSpace = new CellSpacePartition<BaseEntity>(width, height, 10, 10, 300);
        this._path = new Path();

        //生成对应智能体

    }

    public udpate(dt: number) {
        if (this._pause) return;
        for (let i = 0, len = this._vehicles.length; i < len; i++) {
            this._vehicles[i].onUpdate(dt);
        }
    }

    public nonPenetrationContraint(v: Vehicle) {

        for (let i = 0, len = this._vehicles.length; i < len; i++) {
            let entity = this._vehicles[i];
            if (entity.ID == v.ID) continue;

            cc.Vec2.set(tempVec21, entity.position.x, entity.position.y);
            cc.Vec2.set(tempVec22, v.position.x, v.position.y);
            cc.Vec2.subtract(tempVec21, tempVec22, tempVec21);
            let disFromEachOther = tempVec21.mag();
            let amoutOfOverlap = entity.bRadius + v.bRadius - disFromEachOther;
            if (amoutOfOverlap >= 0) {
                cc.Vec2.multiplyScalar(tempVec21, tempVec21, 1 / disFromEachOther * amoutOfOverlap);
                cc.Vec2.add(tempVec21, tempVec22, tempVec21);
                cc.Vec3.set(tempVec3, tempVec21.x, tempVec21.y, 0);
                entity.position = tempVec3;
            }
        }
    }

    //标记给定实体范围内的智能体
    public tagVehiclesWithinViewRange(v: BaseEntity, radius: number) {
        cc.Vec2.set(tempVec22, v.position.x, v.position.y);
        for (let i = 0, len = this._vehicles.length; i < len; i++) {
            let entity = this._vehicles[i];
            entity.unTag();
            cc.Vec2.set(tempVec21, entity.position.x, entity.position.y);
            cc.Vec2.subtract(tempVec21, tempVec22, tempVec21);
            let range = radius + entity.bRadius;
            if (entity.ID != v.ID && tempVec21.magSqr() < range * range) {
                entity.onTag();
            }
        }
    }

    public walls() { return this._walls; }
    public cellSpace() { return this._cellSpace; }
    public obstacles() { return this._obstacles; }
    public agents() { return this._vehicles; }

    public cxClient() { return this._maxXClient; }
    public cyClient() { return this._maxYClient; }


}
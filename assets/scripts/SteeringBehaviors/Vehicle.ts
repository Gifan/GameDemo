import BaseEntity, { EntityType } from "./BaseEntity";
import { BehaviorsConst } from "./constants";
import GameWorld from "./GameWorld";
import { Smoother } from "./Smoother";
import SteeringBehavior from "./SteeringBehaviors";

const tempVec2 = new cc.Vec2();
const tempVec21 = new cc.Vec2();
const tempVec3 = new cc.Vec3();

export default class Vehicle extends BaseEntity {
    private _velocity: cc.Vec2 = cc.Vec2.ZERO;//速度
    public get velocity() { return this._velocity; }
    public set velocity(vec: cc.Vec2) { this._velocity = vec; }

    private _weight: number = 1;//质量
    public get weight() { return this._weight };
    public set weight(weight: number) { this._weight = weight };

    private _hp: number = 1;    //血量
    public get hp() { return this._hp };
    public set hp(hp: number) { this._hp = hp; }

    private _maxSpeed: number = 0;//最大速度值
    public get maxSpeed() { return this._maxSpeed; }
    public set maxSpeed(speed: number) { this._maxSpeed = speed; }

    public get speed() { return this._velocity.mag() }

    private _side: cc.Vec2 = cc.Vec2.ZERO;//侧方向
    public get side() { return this._side; }
    private _heading: cc.Vec2 = cc.Vec2.ZERO;//朝向方向
    public get heading() { return this._heading; }
    public set heading(head: cc.Vec2) { this._heading = head; this._side = this._heading.perp(); }


    private _headingSmoother: Smoother<cc.Vec2> = null;
    private _smoothedHeading: cc.Vec2 = cc.Vec2.ZERO;
    public get smoothedHeading(): cc.Vec2 { return this._smoothedHeading; }
    private _smoothingOn: boolean = false;
    public smoothingOn() { this._smoothingOn = true; }
    public smoothingOff() { this._smoothingOn = false; }
    private _timeElapsed: number = 0.1;
    public get timeElapsed() { return this._timeElapsed; }

    private _maxForce: number = 0;//最大力
    public get maxForce() { return this._maxForce; }
    public set maxForce(force: number) { this._maxForce = force; }

    public index: number = -1;//索引下标

    private _gameWorld: GameWorld = null;
    public setGameWorld(world: GameWorld) { this._gameWorld = world; }
    public get gameWorld() { return this._gameWorld };



    //最大转向率 弧度/s
    public maxTurnRate: number = 1;

    private _Steering: SteeringBehavior = null;
    public get steering() { return this._Steering; }



    public constructor(type: EntityType, typeId: number, entityNode: cc.Node) {
        super(type, typeId, entityNode);
        this._Steering = new SteeringBehavior(this);
        this._headingSmoother = new Smoother<cc.Vec2>(10, cc.v2(0, 0));
        this._timeElapsed = 0;
        this._smoothingOn = false;
        this._smoothedHeading = cc.Vec2.ZERO;
        this._maxForce = BehaviorsConst.MaxSteeringForce;
        this.maxTurnRate = BehaviorsConst.MaxTurnRatePerSecond;
    }

    public onUpdate(dt: number) {
        this._timeElapsed = dt;
        cc.Vec2.set(tempVec2, this.position.x, this.position.y);

        let steeringForce = this._Steering.calculate();
        steeringForce.mulSelf(dt / this._weight);
        cc.Vec2.set(this._velocity, steeringForce.x, steeringForce.y);
        this._velocity.truncate(this._maxSpeed);
        cc.Vec2.multiplyScalar(tempVec21, this._velocity, dt);
        tempVec3.x = tempVec21.x; tempVec3.y = tempVec21.y;
        this.position = cc.Vec3.add(tempVec3, this.position, tempVec3);
        if (this._velocity.magSqr() > 0.000001) {
            cc.Vec2.normalize(this._heading, this._velocity);
            cc.Vec2.set(this._side, -this._heading.y, this._heading.y);
        }
        // cc.Vec3.set(tempVec3, this.position.x, this.position.y, 0);
        this.warpAround(tempVec3, 0, 0);

        if (this._Steering.isSpacePartitioningOn()) {
            this._gameWorld.cellSpace().updateEntity(this, tempVec2);
        }

        if (this._smoothingOn) {
            this._headingSmoother.onUpdate(this._heading, this._smoothedHeading);
        }
    }

    //限制位置在特定区域内
    private warpAround(out: cc.Vec3, maxX: number, maxY: number) {

    }
}
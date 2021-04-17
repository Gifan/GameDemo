//--------------------------- Constants ----------------------------------

import BaseEntity from "./BaseEntity";
import Vehicle from "./Vehicle";
import { BehaviorsConst } from "./constants";

//躲避圆半径
const WanderRad: number = 1.2;
//在智能体躲避行为中前面圆的距离
const WanderDist: number = 2.0;
//躲避最大角度
const WanderJitterPerSec: number = 80.0;
//路径根据距离阀值
const WaypointSeekDist: number = 20;


enum SummingMethod { weighted_average, prioritized, dithered };
enum BehaviorType {
    none = 0x00000,
    seek = 0x00002,
    flee = 0x00004,
    arrive = 0x00008,
    wander = 0x00010,
    cohesion = 0x00020,
    separation = 0x00040,
    allignment = 0x00080,
    obstacleAvoidance = 0x00100,
    wallAvoidance = 0x00200,
    followPath = 0x00400,
    pursuit = 0x00800,
    evade = 0x01000,
    interpose = 0x02000,
    hide = 0x04000,
    flock = 0x08000,
    offsetPursuit = 0x10000,
};

enum Deceleration {
    slow = 3,
    normal = 2,
    fast = 1,
}

const tempVec2 = cc.v2();
const tempVec21 = cc.v2();
export default class SteeringBehavior {
    private _vehicle: Vehicle = null;
    private _steeringForce: cc.Vec2 = cc.Vec2.ZERO;
    private _targetAgent1: Vehicle = null;
    private _targetAgent2: Vehicle = null;

    private _curTarget: cc.Vec2 = cc.Vec2.ZERO;

    private _boxLength: number = 40;

    private _feelers: cc.Vec2[] = null;

    private _wallDetectionFeelerLength: number = 40;

    private _wanderTarget: cc.Vec2 = cc.Vec2.ZERO;

    private _wanderJitter: number = WanderJitterPerSec;
    private _wanderRadius: number = WanderRad;
    private _wanderDistance: number = WanderDist;

    //权重
    private _weightSeparation: number = 1;
    private _weightCohesion: number = 2;
    private _weightAlignment: number = 1;
    private _weightObstacleAvoidance: number = 10;
    private _weightWallAvoidance: number = 10;
    private _weightSeek: number = 1;
    private _weightFlee: number = 1;
    private _weightArrive: number = 1;
    private _weightPursuit: number = 1;
    private _weightOffsetPursuit: number = 1;
    private _weightInterpose: number = 1;
    private _weightHide: number = 1;
    private _weightFollowPath: number = 0.05;
    private _weightEvade: number = 0.01;
    private _weightWander: number = 1;

    private _viewDistance: number = 1000000;

    private _wayPointSeekDistSq: number = WaypointSeekDist * WaypointSeekDist;

    private _offset: cc.Vec2 = cc.Vec2.ZERO;

    private _flags: number = 0;

    private _deceleration: Deceleration = Deceleration.normal;

    private _cellSpaceOn: boolean = false;

    private _summingMethod: SummingMethod = SummingMethod.prioritized;

    private On(bt: BehaviorType): boolean { return (this._flags & bt) == bt; }

    private accumulateForce(sf: cc.Vec2, forceToAdd: cc.Vec2): boolean {
        let magnitudeSoFar = sf.mag();
        let remaing = this._vehicle.maxForce - magnitudeSoFar;

        if (remaing <= 0) return false;

        let toadd = forceToAdd.mag();

        if (toadd < remaing) {
            sf.addSelf(forceToAdd);
        } else {
            sf.addSelf(cc.Vec2.normalize(tempVec2, forceToAdd).mulSelf(remaing));
        }
        return true;
    }

    private createFeelers(): void { };

    /* .......................................................

                    BEGIN BEHAVIOR DECLARATIONS

      .......................................................*/
    private seek(targetPos: cc.Vec2): cc.Vec2 {
        cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
        cc.Vec2.subtract(tempVec2, targetPos, tempVec2);
        cc.Vec2.normalize(tempVec2, tempVec2);
        cc.Vec2.multiplyScalar(tempVec2, tempVec2, this._vehicle.maxSpeed);
        cc.Vec2.subtract(tempVec21, tempVec2, this._vehicle.velocity);
        return tempVec21;
    }

    private flee(targetPos: cc.Vec2): cc.Vec2 {
        cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
        cc.Vec2.subtract(tempVec2, tempVec2, targetPos);
        cc.Vec2.normalize(tempVec2, tempVec2);
        cc.Vec2.multiplyScalar(tempVec2, tempVec2, this._vehicle.maxSpeed);
        cc.Vec2.subtract(tempVec21, tempVec2, this._vehicle.velocity);
        return tempVec21;
    }

    private arrive(targetPos: cc.Vec2, deceleration: Deceleration): cc.Vec2 {
        cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
        cc.Vec2.subtract(tempVec2, targetPos, tempVec2);
        let dist = tempVec2.mag();
        if (dist > 0) {
            let delertationTweaker = 0.3;
            let speed = dist / (deceleration * delertationTweaker);
            speed = Math.min(speed, this._vehicle.maxSpeed);
            cc.Vec2.multiplyScalar(tempVec2, tempVec2, speed / dist);
            cc.Vec2.subtract(tempVec21, tempVec2, this._vehicle.velocity);
            return tempVec21;
        }
        return cc.Vec2.ZERO
    }
    private pursuit(agent: Vehicle): cc.Vec2 {
        cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
        cc.Vec2.set(tempVec21, agent.position.x, agent.position.y);
        cc.Vec2.subtract(tempVec2, tempVec21, tempVec2);
        let relativeHeading = this._vehicle.heading.dot(agent.heading);
        if (tempVec2.dot(this._vehicle.heading) > 0 && relativeHeading < -0.95) {
            return this.seek(tempVec21);
        }
        let lookAheadTime = tempVec2.mag() / (this._vehicle.maxSpeed + agent.speed);
        cc.Vec2.scaleAndAdd(tempVec21, tempVec21, agent.velocity, lookAheadTime);
        return this.seek(tempVec21);
    }
    private offsetPursuit(agent: Vehicle, offset: cc.Vec2): cc.Vec2 {
        return cc.Vec2.ZERO;
    }
    private evade(agent: Vehicle): cc.Vec2 {
        cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
        cc.Vec2.set(tempVec21, agent.position.x, agent.position.y);
        cc.Vec2.subtract(tempVec2, tempVec21, tempVec2);
        let threatRange = 100;
        if (tempVec2.magSqr() > threatRange * threatRange)
            return cc.Vec2.ZERO;
        let lookAheadTime = tempVec2.mag() / (this._vehicle.maxSpeed + agent.speed);
        cc.Vec2.scaleAndAdd(tempVec21, tempVec21, agent.velocity, lookAheadTime);
        return this.flee(tempVec21);
    }
    private wander(): cc.Vec2 {
        let jitterThisTimeSlice = this._wanderJitter * this._vehicle.timeElapsed;
        cc.Vec2.set(tempVec2, (Math.random() - Math.random()) * jitterThisTimeSlice, (Math.random() - Math.random()) * jitterThisTimeSlice);
        cc.Vec2.add(this._wanderTarget, this._wanderTarget, tempVec2);
        this._wanderTarget.normalizeSelf();
        cc.Vec2.multiplyScalar(this._wanderTarget, this._wanderTarget, this._wanderRadius);
        cc.Vec2.set(tempVec2, 0, this._wanderDistance);
        cc.Vec2.add(tempVec2, this._wanderTarget, tempVec2);
        cc.Vec2.set(tempVec21, 0, 1);
        let angle = tempVec21.signAngle(this._vehicle.heading);
        tempVec2.rotateSelf(angle);
        return tempVec2;
    }
    private obstacleAvoidance(obstacles: Array<BaseEntity>): cc.Vec2 {

        return cc.Vec2.ZERO;
    }
    private wallAvoidance(walls: Array<any>): cc.Vec2 { return cc.Vec2.ZERO };
    private followPath(): cc.Vec2 { return cc.Vec2.ZERO }
    private interpose(vehicleA: Vehicle, vehicleB: Vehicle): cc.Vec2 { return cc.Vec2.ZERO }
    private hide(hunter: Vehicle, obstacles: Array<BaseEntity>): cc.Vec2 { return cc.Vec2.ZERO }


    // -- Group Behaviors -- //
    private cohesion(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }
    private separation(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }
    private alignment(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }

    private cohesionPlus(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }
    private separationPlus(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }
    private alignmentPlus(agents: Array<Vehicle>): cc.Vec2 { return cc.Vec2.ZERO }

    /* .......................................................

                   END BEHAVIOR DECLARATIONS

  .......................................................*/

    private calculateWeightedSum(): cc.Vec2 {
        let force: cc.Vec2 = null;
        if (this.On(BehaviorType.wallAvoidance)) {
            force = this.wallAvoidance(this._vehicle.gameWorld.walls());
            force.mulSelf(this._weightWallAvoidance);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.obstacleAvoidance)) {
            force = this.obstacleAvoidance(this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightObstacleAvoidance);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.evade)) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.evade(this._targetAgent1);
            force.mulSelf(this._weightEvade);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.flee)) {
            if (!this._targetAgent1) return this._steeringForce;
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.flee(tempVec2);
            force.mulSelf(this._weightFlee);
            this._steeringForce.addSelf(force);
        }

        if (!this.isSpacePartitioningOn()) {
            if (this.On(BehaviorType.separation)) {
                force = this.separation(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightSeparation);
                this._steeringForce.addSelf(force);
            }
            if (this.On(BehaviorType.allignment)) {
                force = this.alignment(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightAlignment);
                this._steeringForce.addSelf(force);
            }
            if (this.On(BehaviorType.cohesion)) {
                force = this.cohesion(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightCohesion);
                this._steeringForce.addSelf(force);
            }
        } else {
            if (this.On(BehaviorType.separation)) {
                force = this.separationPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightSeparation);
                this._steeringForce.addSelf(force);
            }
            if (this.On(BehaviorType.allignment)) {
                force = this.alignmentPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightAlignment);
                this._steeringForce.addSelf(force);
            }
            if (this.On(BehaviorType.cohesion)) {
                force = this.cohesionPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightCohesion);
                this._steeringForce.addSelf(force);
            }
        }

        if (this.On(BehaviorType.seek)) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.seek(tempVec2);
            force.mulSelf(this._weightSeek);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.arrive)) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.arrive(tempVec2, this._deceleration);
            force.mulSelf(this._weightArrive);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.wander)) {
            force = this.wander();
            force.mulSelf(this._weightWander);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.pursuit)) {
            if (!this._targetAgent1) this._steeringForce;
            force = this.pursuit(this._targetAgent1);
            force.mulSelf(this._weightPursuit);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.offsetPursuit)) {
            if (!this._targetAgent1 || this._offset.magSqr() < 0.000001) {
                return this._steeringForce;
            }
            force = this.offsetPursuit(this._targetAgent1, this._offset);
            force.mulSelf(this._weightOffsetPursuit);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.interpose)) {
            if (!this._targetAgent1 || !this._targetAgent2) return this._steeringForce;
            force = this.interpose(this._targetAgent1, this._targetAgent2);
            force.mulSelf(this._weightInterpose);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.hide)) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.hide(this._targetAgent1, this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightHide);
            this._steeringForce.addSelf(force);
        }
        if (this.On(BehaviorType.followPath)) {
            force = this.followPath();
            force.mulSelf(this._weightFollowPath);
            this._steeringForce.addSelf(force);
        }
        this._steeringForce.truncate(this._vehicle.maxForce);
        return this._steeringForce;
    }

    //按照优先级计算合力
    private calculatePrioritized(): cc.Vec2 {
        let force: cc.Vec2 = null;
        if (this.On(BehaviorType.wallAvoidance)) {
            force = this.wallAvoidance(this._vehicle.gameWorld.walls());
            force.mulSelf(this._weightWallAvoidance);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.obstacleAvoidance)) {
            force = this.obstacleAvoidance(this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightObstacleAvoidance);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }

        if (this.On(BehaviorType.evade)) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.evade(this._targetAgent1);
            force.mulSelf(this._weightEvade);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.flee)) {
            if (!this._targetAgent1) return this._steeringForce;
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.flee(tempVec2);
            force.mulSelf(this._weightFlee);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }

        if (!this.isSpacePartitioningOn()) {
            if (this.On(BehaviorType.separation)) {
                force = this.separation(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightSeparation);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
            if (this.On(BehaviorType.allignment)) {
                force = this.alignment(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightAlignment);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
            if (this.On(BehaviorType.cohesion)) {
                force = this.cohesion(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightCohesion);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
        } else {
            if (this.On(BehaviorType.separation)) {
                force = this.separationPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightSeparation);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
            if (this.On(BehaviorType.allignment)) {
                force = this.alignmentPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightAlignment);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
            if (this.On(BehaviorType.cohesion)) {
                force = this.cohesionPlus(this._vehicle.gameWorld.agents());
                force.mulSelf(this._weightCohesion);
                if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
            }
        }

        if (this.On(BehaviorType.seek)) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.seek(tempVec2);
            force.mulSelf(this._weightSeek);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.arrive)) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.arrive(tempVec2, this._deceleration);
            force.mulSelf(this._weightArrive);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.wander)) {
            force = this.wander();
            force.mulSelf(this._weightWander);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.pursuit)) {
            if (!this._targetAgent1) this._steeringForce;
            force = this.pursuit(this._targetAgent1);
            force.mulSelf(this._weightPursuit);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.offsetPursuit)) {
            if (!this._targetAgent1 || this._offset.magSqr() < 0.000001) {
                return this._steeringForce;
            }
            force = this.offsetPursuit(this._targetAgent1, this._offset);
            force.mulSelf(this._weightOffsetPursuit);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.interpose)) {
            if (!this._targetAgent1 || !this._targetAgent2) return this._steeringForce;
            force = this.interpose(this._targetAgent1, this._targetAgent2);
            force.mulSelf(this._weightInterpose);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.hide)) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.hide(this._targetAgent1, this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightHide);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        if (this.On(BehaviorType.followPath)) {
            force = this.followPath();
            force.mulSelf(this._weightFollowPath);
            if (!this.accumulateForce(this._steeringForce, force)) return this._steeringForce;
        }
        return this._steeringForce;
    }
    private calculateDithered(): cc.Vec2 {
        this._steeringForce.set(cc.Vec2.ZERO);
        let force: cc.Vec2 = null;
        if (this.On(BehaviorType.wallAvoidance) && Math.random() < BehaviorsConst.prWallAvoidance) {
            force = this.wallAvoidance(this._vehicle.gameWorld.walls());
            force.mulSelf(this._weightWallAvoidance / BehaviorsConst.prWallAvoidance);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.obstacleAvoidance) && Math.random() < BehaviorsConst.prObstacleAvoidance) {
            force = this.obstacleAvoidance(this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightObstacleAvoidance / BehaviorsConst.prObstacleAvoidance);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.separation) && Math.random() < BehaviorsConst.prSeparation) {
            if (!this.isSpacePartitioningOn()) {
                force = this.separation(this._vehicle.gameWorld.agents());
            } else {
                force = this.separationPlus(this._vehicle.gameWorld.agents());
            }
            force.mulSelf(this._weightSeparation / BehaviorsConst.prSeparation);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.flee) && Math.random() < BehaviorsConst.prFlee) {
            if (!this._targetAgent1) return this._steeringForce;
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.flee(tempVec2);
            force.mulSelf(this._weightFlee / BehaviorsConst.prFlee);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.evade) && Math.random() < BehaviorsConst.prEvade) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.evade(this._targetAgent1);
            force.mulSelf(this._weightEvade / BehaviorsConst.prEvade);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }

        if (this.On(BehaviorType.allignment) && Math.random() < BehaviorsConst.prAlignment) {
            if (!this.isSpacePartitioningOn()) {
                force = this.alignment(this._vehicle.gameWorld.agents());
            } else {
                force = this.alignmentPlus(this._vehicle.gameWorld.agents());
            }
            force.mulSelf(this._weightAlignment / BehaviorsConst.prAlignment);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.cohesion) && Math.random() < BehaviorsConst.prCohesion) {
            if (!this.isSpacePartitioningOn())
                force = this.cohesion(this._vehicle.gameWorld.agents());
            else {
                force = this.cohesionPlus(this._vehicle.gameWorld.agents());
            }
            force.mulSelf(this._weightCohesion / BehaviorsConst.prCohesion);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.wander) && Math.random() < BehaviorsConst.prWander) {
            force = this.wander();
            force.mulSelf(this._weightWander / BehaviorsConst.prWander);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.seek) && Math.random() < BehaviorsConst.prSeek) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.seek(tempVec2);
            force.mulSelf(this._weightSeek / BehaviorsConst.prSeek);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.arrive) && Math.random() < BehaviorsConst.prArrive) {
            cc.Vec2.set(tempVec2, this._targetAgent1.position.x, this._targetAgent1.position.y);
            force = this.arrive(tempVec2, this._deceleration);
            force.mulSelf(this._weightArrive / BehaviorsConst.prArrive);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }

        if (this.On(BehaviorType.pursuit) && Math.random() < BehaviorsConst.prPursuit) {
            if (!this._targetAgent1) this._steeringForce;
            force = this.pursuit(this._targetAgent1);
            force.mulSelf(this._weightPursuit / BehaviorsConst.prPursuit);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.offsetPursuit) && Math.random() < BehaviorsConst.prOffsetPursuit) {
            if (!this._targetAgent1 || this._offset.magSqr() < 0.000001) {
                return this._steeringForce;
            }
            force = this.offsetPursuit(this._targetAgent1, this._offset);
            force.mulSelf(this._weightOffsetPursuit / BehaviorsConst.prOffsetPursuit);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }
        if (this.On(BehaviorType.hide) && Math.random() < BehaviorsConst.prHide) {
            if (!this._targetAgent1) return this._steeringForce;
            force = this.hide(this._targetAgent1, this._vehicle.gameWorld.obstacles());
            force.mulSelf(this._weightHide / BehaviorsConst.prHide);
            this._steeringForce.set(force);
            if (force.magSqr() > 0.000001) {
                this._steeringForce.truncate(this._vehicle.maxForce);
                return this._steeringForce;
            }
        }

        return this._steeringForce;
    }

    private getHidingPosition(posOb: cc.Vec2, radiusOb: number, posHunter: cc.Vec2): cc.Vec2 { return cc.Vec2.ZERO }

    public constructor(agent: Vehicle) {
        let theta = 2 * Math.random() * Math.PI;
        this._wanderTarget = cc.v2(this._wanderRadius * Math.cos(theta), this.wanderRadius * Math.sin(theta));
        this._vehicle = agent;
        this._flags = 0;
        this._boxLength = BehaviorsConst.MinDetectionBoxLength;
        this._weightCohesion = BehaviorsConst.CohesionWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightAlignment = BehaviorsConst.AlignmentWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightSeparation = BehaviorsConst.SeparationWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightObstacleAvoidance = BehaviorsConst.ObstacleAvoidanceWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightWander = BehaviorsConst.WanderWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightWallAvoidance = BehaviorsConst.WallAvoidanceWeight * BehaviorsConst.SteeringForceTweaker;
        this._wallDetectionFeelerLength = BehaviorsConst.WallDetectionFeelerLength;
        this._feelers = (new Array<cc.Vec2>()).fill(cc.Vec2.ZERO);
        this._deceleration = Deceleration.normal;
        this._wanderDistance = WanderDist;
        this._wanderJitter = WanderJitterPerSec;
        this._wanderRadius = WanderRad;
        this._wayPointSeekDistSq = WaypointSeekDist * WaypointSeekDist;
        this._weightSeek = BehaviorsConst.SeekWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightFlee = BehaviorsConst.FleeWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightArrive = BehaviorsConst.ArriveWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightPursuit = BehaviorsConst.PursuitWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightOffsetPursuit = BehaviorsConst.OffsetPursuitWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightInterpose = BehaviorsConst.InterposeWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightHide = BehaviorsConst.HideWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightEvade = BehaviorsConst.EvadeWeight * BehaviorsConst.SteeringForceTweaker;
        this._weightFollowPath = BehaviorsConst.FollowPathWeight * BehaviorsConst.SteeringForceTweaker;
        this._cellSpaceOn = false;
        this._summingMethod = SummingMethod.prioritized;
    }

    public calculate(): cc.Vec2 {
        this._steeringForce.set(cc.Vec2.ZERO);
        if (!this.isSpacePartitioningOn()) {
            if (this.On(BehaviorType.separation) || this.On(BehaviorType.allignment) || this.On(BehaviorType.cohesion)) {
                this._vehicle.gameWorld.tagVehiclesWithinViewRange(this._vehicle, this._viewDistance);
            }
        } else {
            if (this.On(BehaviorType.separation) || this.On(BehaviorType.allignment) || this.On(BehaviorType.cohesion)) {
                cc.Vec2.set(tempVec2, this._vehicle.position.x, this._vehicle.position.y);
                this._vehicle.gameWorld.cellSpace().calculateNeighbors(tempVec2, this._viewDistance);
            }
        }
        switch (this._summingMethod) {
            case SummingMethod.weighted_average:
                this._steeringForce = this.calculateWeightedSum(); break;
            case SummingMethod.prioritized:
                this._steeringForce = this.calculatePrioritized(); break;
            case SummingMethod.dithered:
                this._steeringForce = this.calculateDithered(); break;
            default:
                break;
        }
        return this._steeringForce;
    }

    public forwardComponent(): number {
        return this._vehicle.heading.dot(this._steeringForce);;
    }
    public sideComponent(): number {
        return this._vehicle.side.dot(this._steeringForce);
    }

    public setTarget(t: cc.Vec2) { this._curTarget = t; }
    public setTargetAgent1(agent: Vehicle) { this._targetAgent1 = agent; }
    public setTargetAgent2(agent: Vehicle) { this._targetAgent2 = agent; }

    public set offset(offset: cc.Vec2) { this._offset = offset }
    public get offset() { return this._offset }

    public get force() { return this._steeringForce; }

    public toggleSpacePartitioningOnOff() { this._cellSpaceOn = !this._cellSpaceOn; }
    public isSpacePartitioningOn(): boolean { return this._cellSpaceOn; }
    public setSummingMethod(sm: SummingMethod) { this._summingMethod = sm; }

    fleeOn() { this._flags |= BehaviorType.flee; }
    seekOn() { this._flags |= BehaviorType.seek; }
    arriveOn() { this._flags |= BehaviorType.arrive; }
    wanderOn() { this._flags |= BehaviorType.wander; }
    pursuitOn(v: Vehicle) { this._flags |= BehaviorType.pursuit; this._targetAgent1 = v; }
    evadeOn(v: Vehicle) { this._flags |= BehaviorType.evade; this._targetAgent1 = v; }
    cohesionOn() { this._flags |= BehaviorType.cohesion; }
    separationOn() { this._flags |= BehaviorType.separation; }
    alignmentOn() { this._flags |= BehaviorType.allignment; }
    bbstacleAvoidanceOn() { this._flags |= BehaviorType.obstacleAvoidance; }
    wallAvoidanceOn() { this._flags |= BehaviorType.wallAvoidance; }
    followPathOn() { this._flags |= BehaviorType.followPath; }
    interposeOn(v1: Vehicle, v2: Vehicle) { this._flags |= BehaviorType.interpose; this._targetAgent1 = v1; this._targetAgent2 = v2; }
    hideOn(v: Vehicle) { this._flags |= BehaviorType.hide; this._targetAgent1 = v; }
    offsetPursuitOn(v1: Vehicle, offset: cc.Vec2) { this._flags |= BehaviorType.offsetPursuit; this._offset = offset; this._targetAgent1 = v1; }
    flockingOn() { this.cohesionOn(); this.alignmentOn(); this.separationOn(); this.wanderOn(); }

    fleeOff() { if (this.On(BehaviorType.flee)) this._flags ^= BehaviorType.flee; }
    seekOff() { if (this.On(BehaviorType.seek)) this._flags ^= BehaviorType.seek; }
    arriveOff() { if (this.On(BehaviorType.arrive)) this._flags ^= BehaviorType.arrive; }
    wanderOff() { if (this.On(BehaviorType.wander)) this._flags ^= BehaviorType.wander; }
    pursuitOff() { if (this.On(BehaviorType.pursuit)) this._flags ^= BehaviorType.pursuit; }
    evadeOff() { if (this.On(BehaviorType.evade)) this._flags ^= BehaviorType.evade; }
    cohesionOff() { if (this.On(BehaviorType.cohesion)) this._flags ^= BehaviorType.cohesion; }
    separationOff() { if (this.On(BehaviorType.separation)) this._flags ^= BehaviorType.separation; }
    alignmentOff() { if (this.On(BehaviorType.allignment)) this._flags ^= BehaviorType.allignment; }
    obstacleAvoidanceOff() { if (this.On(BehaviorType.obstacleAvoidance)) this._flags ^= BehaviorType.obstacleAvoidance; }
    wallAvoidanceOff() { if (this.On(BehaviorType.wallAvoidance)) this._flags ^= BehaviorType.wallAvoidance; }
    followPathOff() { if (this.On(BehaviorType.followPath)) this._flags ^= BehaviorType.followPath; }
    interposeOff() { if (this.On(BehaviorType.interpose)) this._flags ^= BehaviorType.interpose; }
    hideOff() { if (this.On(BehaviorType.hide)) this._flags ^= BehaviorType.hide; }
    offsetPursuitOff() { if (this.On(BehaviorType.offsetPursuit)) this._flags ^= BehaviorType.offsetPursuit; }
    flockingOff() { this.cohesionOff(); this.alignmentOff(); this.separationOff(); this.wanderOff(); }

    isFleeOn() { return this.On(BehaviorType.flee); }
    isSeekOn() { return this.On(BehaviorType.seek); }
    isArriveOn() { return this.On(BehaviorType.arrive); }
    isWanderOn() { return this.On(BehaviorType.wander); }
    isPursuitOn() { return this.On(BehaviorType.pursuit); }
    isEvadeOn() { return this.On(BehaviorType.evade); }
    isCohesionOn() { return this.On(BehaviorType.cohesion); }
    isSeparationOn() { return this.On(BehaviorType.separation); }
    isAlignmentOn() { return this.On(BehaviorType.allignment); }
    isObstacleAvoidanceOn() { return this.On(BehaviorType.obstacleAvoidance); }
    isWallAvoidanceOn() { return this.On(BehaviorType.wallAvoidance); }
    isFollowPathOn() { return this.On(BehaviorType.followPath); }
    isInterposeOn() { return this.On(BehaviorType.interpose); }
    isHideOn() { return this.On(BehaviorType.hide); }
    isOffsetPursuitOn() { return this.On(BehaviorType.offsetPursuit); }

    get boxLength() { return this._boxLength; }
    get wanderJitter() { return this._wanderJitter; }
    get wanderRadius() { return this._wanderRadius; }
    get separationWeight() { return this._weightSeparation; }
    get alignmentWeight() { return this._weightAlignment; }
    get cohesionWeight() { return this._weightCohesion; }

}
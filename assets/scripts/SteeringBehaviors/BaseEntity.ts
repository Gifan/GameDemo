
let flagOffset = 0;
export enum EntityType {
    DefauleEntity = 1 << flagOffset++,
    Role = 1 << flagOffset++,
    Monster = 1 << flagOffset++,
    Obstacle = 1 << flagOffset++,
    Wall = 1 << flagOffset++,
}

export default class BaseEntity {
    private _iD: number = 0;//唯一id
    public get ID() { return this._iD; }
    public set ID(id: number) { this._iD = id; }

    static _nextVaildId: number = 1;
    public static GetNextVaildID() { return BaseEntity._nextVaildId++; }

    private _Tag: boolean = false;   //标记
    public get isTagged() { return this._Tag; }
    public unTag() { this._Tag = false; }
    public onTag() { this._Tag = true };

    private _entityType: EntityType;   //类型
    public get entityType(): EntityType { return this._entityType }
    public set entityType(newType: EntityType) { this._entityType = newType; }

    private _entityNode: cc.Node = null;
    public get entityNode(): cc.Node { return this._entityNode; }

    private _isDead: boolean = false;//是否死亡
    public get isDead() { return this._isDead };
    public set isDead(boo: boolean) { this._isDead = boo; }

    private _param = null;  //额外参数
    public get customParam() { return this._param; }
    public set customParam(param: any) { this._param = param; }

    private _entityTypeId: number = 0;//实体类型id
    public get entityTypeId() { return this._entityTypeId };
    public set entityTypeId(entitytype) { this._entityTypeId = entitytype };

    private _boundRadius: number = 0;
    public get bRadius() { return this._boundRadius; }
    public set bRadius(radius: number) { this._boundRadius = radius; }

    public get position() { return this.entityNode.position; }
    public set position(pos: cc.Vec3) { this.entityNode.position = pos; }
    public set x(x: number) { this.entityNode.x = x; }
    public set y(y: number) { this.entityNode.y = y; }

    public get scale() { return this.entityNode.scale; }
    public get scaleX() { return this.entityNode.scaleX; }
    public get scaleY() { return this.entityNode.scaleY; }
    public set scaleX(x: number) { this.entityNode.scaleX = x; }
    public set scaleY(y: number) { this.entityNode.scaleY = y; }

    public set scale(scale: number) { this._boundRadius *= scale / Math.max(this.scaleX, this.scaleY); this.entityNode.scale = scale; }

    public constructor(entityType: EntityType, entityTypeId: number, entityNode: cc.Node) {
        this._entityNode = entityNode;
        this.entityTypeId = entityTypeId;
        this.entityType = entityType;
        //@ts-ignore
        this.entityNode.entityObject = this;
        this.ID = BaseEntity.GetNextVaildID();
    }


    public onUpdate(dt) { }

    public onPause(boo: boolean) { };
}


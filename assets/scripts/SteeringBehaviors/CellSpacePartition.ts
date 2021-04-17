import BaseEntity from "./BaseEntity";

export class Cell<T extends BaseEntity>{
    public members: Map<number, T> = null;
    public box: cc.Rect;
    public constructor(x: number, y: number, width: number, height: number) {
        this.box = new cc.Rect(x, y, width, height);
        this.members = new Map<number, T>();
    }
}

const tempVec21 = cc.v2();
const tempVec22 = cc.v2();

/**
 * 2D空间分割
 */
export class CellSpacePartition<T extends BaseEntity>{
    private _cells: Cell<T>[] = [];
    private _neighbors: T[] = [];
    private _curNeightbors: number = 0;
    private _spaceWidth: number = 0;//空间宽度
    private _spaceHeight: number = 0;//空间高度

    private _numCellX: number = 10;//横向划分cell个数
    private _numCellY: number = 10;//纵向划分cell个数

    //每个cell大小
    private _cellSizeX: number = 0;
    private _cellSizeY: number = 0;



    public constructor(
        width: number,//空间宽度
        height: number,//空间高度
        cellsX: number,//水平cell个数
        cellsY: number,//垂直cell个数
        maxEntitys: number//最大可以添加的实体
    ) {
        this._spaceWidth = width;
        this._spaceHeight = height;
        this._numCellX = cellsX;
        this._numCellY = cellsY;
        this._cellSizeX = width / cellsX;
        this._cellSizeY = height / cellsY;
        for (let y = 0; y < this._numCellY; ++y) {
            for (let x = 0; x < this._numCellX; ++x) {
                let left = x * this._cellSizeX;
                let bot = y * this._cellSizeY;
                this._cells.push(new Cell(left, bot, this._cellSizeX, this._cellSizeY));
            }
        }
    }

    public addEntity(ent: T) {
        if (ent && !ent.isDead) {
            cc.Vec2.set(tempVec21, ent.position.x, ent.position.y);
            let idx = this.positionToIndex(tempVec21);
            this._cells[idx].members.set(ent.ID, ent);
        }
    }

    public updateEntity(ent: T, oldPos: cc.Vec2) {
        let oldIdx = this.positionToIndex(oldPos);
        cc.Vec2.set(tempVec22, ent.position.x, ent.position.y);
        let newIdx = this.positionToIndex(tempVec22);
        if (oldIdx == newIdx) return;
        let entity = this._cells[oldIdx].members.get(ent.ID);
        if (entity) {
            this._cells[oldIdx].members.delete(ent.ID);
            this._cells[newIdx].members.set(entity.ID, entity);
        }
    }

    public calculateNeighbors(targetPos: cc.Vec2, queryRadius: number) {
        let width = 2 * queryRadius;
        let radiusSqr = queryRadius * queryRadius;
        let queryBox = new cc.Rect(targetPos.x - queryRadius, targetPos.y - queryRadius, width, width);
        this._curNeightbors = 0;
        for (let i = 0, len = this._cells.length; i < len; ++i) {
            let cell = this._cells[i];
            if (cell.box.intersects(queryBox) && cell.members.size > 0) {
                let members = cell.members;
                members.forEach((value: T, key: number) => {
                    if (value && !value.isDead) {
                        cc.Vec2.set(tempVec22, value.position.x, value.position.y);
                        cc.Vec2.subtract(tempVec21, tempVec22, targetPos);
                        if (tempVec21.magSqr() < radiusSqr) {
                            this._neighbors[this._curNeightbors++] = value;
                        }
                    }
                })
            }
        }
    }

    public emptyCells() {
        for (let i = 0, len = this._cells.length; i < len; ++i) {
            this._cells[i].members.clear();
        }
    }

    /**
     * 给定一个游戏空间中的世界坐标值返回相对应的cell下标
     * @param pos 坐标
     * @returns 对应下标
     */
    public positionToIndex(pos: cc.Vec2): number {
        let idx: number = Math.floor(this._numCellX * pos.x / this._spaceWidth) + Math.floor(this._numCellY * pos.y / this._spaceHeight) * this._numCellY;
        return idx;
    }

}
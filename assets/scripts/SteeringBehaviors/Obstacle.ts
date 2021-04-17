import BaseEntity, { EntityType } from "./BaseEntity";

export class Obstacle extends BaseEntity {
    public constructor(entityNode: cc.Node) {
        super(EntityType.Obstacle, 0, entityNode);
        this.bRadius = entityNode.width;
    }
}
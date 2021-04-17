export class BehaviorsConst {
    //智能体数量
    public static NumAgents = 300;
    //障碍物数量
    public static NumObstacles = 7;
    //障碍物大小范围
    public static MinObstacleRadius = 10;
    public static MaxObstacleRadius = 30;

    //空间单元分割个数
    public static NumCellsX = 10;
    public static NumCellsY = 10;

    //平滑朝向计算个数
    public static NumSamplesForSmoothing = 10;

    //计算力系数
    public static SteeringForceTweaker = 200;

    //合理比例
    public static SteeringForce = 2;

    //智能体最大力
    public static MaxSteeringForce = BehaviorsConst.SteeringForceTweaker * BehaviorsConst.SteeringForce;

    //最大转向速度 弧度/s
    public static MaxTurnRatePerSecond = Math.PI;
    //智能体质量
    public static AgentsMass = 1.0;

    //各个力的权重
    public static SeparationWeight = 1.0;
    public static AlignmentWeight = 1.0;
    public static CohesionWeight = 2.0;
    public static ObstacleAvoidanceWeight = 10.0;
    public static WallAvoidanceWeight = 10.0;
    public static WanderWeight = 1.0;
    public static SeekWeight = 1.0;
    public static FleeWeight = 1.0;
    public static ArriveWeight = 1.0;
    public static PursuitWeight = 1.0;
    public static OffsetPursuitWeight = 1.0;
    public static InterposeWeight = 1.0;
    public static HideWeight = 1.0;
    public static EvadeWeight = 0.01;
    public static FollowPathWeight = 0.05;

    //对应行为力权重占比
    public static prWallAvoidance = 0.5;
    public static prObstacleAvoidance = 0.5;
    public static prSeparation = 0.2;
    public static prAlignment = 0.3;
    public static prCohesion = 0.6;
    public static prWander = 0.8;
    public static prSeek = 0.8;
    public static prFlee = 0.6;
    public static prEvade = 1.0;
    public static prHide = 0.8;
    public static prArrive = 0.5;
    public static prPursuit = 0.5;
    public static prOffsetPursuit = 0.5;

    public static MinDetectionBoxLength = 40;
    public static WallDetectionFeelerLength = 40;

    //视野距离
    public static ViewDistance = 50;
}
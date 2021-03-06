// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    onEnable(){
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this,true);
        // this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        // this.node._touchListener.swallowTouches = false;
    }

    public touchStart(event:cc.Event){
        cc.error("touchStart parent",event.eventPhase);
    }

    // update (dt) {}
}

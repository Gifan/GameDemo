// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

function testD(value:string){
    return function(target: any){
        console.log(value, cc.js.getClassName(target),target.name);
    }
}

const {ccclass, property} = cc._decorator;

@testD("test")
@ccclass
export default class TestHaha extends cc.Component {
    
    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        console.log(TestHaha.name);
    }

    // update (dt) {}
}

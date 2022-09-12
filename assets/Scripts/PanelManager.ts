import { _decorator, Component, ToggleComponent, Toggle, EditBox } from "cc";
import { GameManager } from "./GameManager";
const { ccclass, property } = _decorator;

@ccclass("Panel")
export class Panel extends Component {
  @property(ToggleComponent)
  considerDistanceToggle: ToggleComponent = null;

  @property(EditBox)
  colorCountEditBox: EditBox = null;

  onLoad() {
    this.considerDistanceToggle.node.on(
      "toggle",
      this.considerDistanceCallback,
      this
    );
    this.colorCountEditBox.node.on(
      "editing-did-ended",
      this.changeColorCount,
      this
    );
  }

  changeColorCount(editbox: EditBox) {
    let num = parseInt(editbox.getComponent(EditBox).string);
    if (num < 0 || num > 8) {
      editbox.getComponent(
        EditBox
      ).string = `${GameManager.instance.colorList.length}`;
      return;
    }
    GameManager.instance.clearAllUnits();
    GameManager.instance.colorList = GameManager.allColors.slice(0, num);
    GameManager.instance.initColorAccelerationMap();
    GameManager.instance.generateUnits();
  }

  considerDistanceCallback() {
    if (this.considerDistanceToggle.getComponent(Toggle).isChecked) {
      GameManager.accelerationCoefficient = 1;
      GameManager.considerDistance = true;
    } else {
      GameManager.accelerationCoefficient = 0.001;
      GameManager.considerDistance = false;
    }
    GameManager.instance.clearAllUnits();
    GameManager.instance.generateUnits();
  }

  start() {}

  update(deltaTime: number) {}
}

import { _decorator, Component, ToggleComponent, Toggle } from "cc";
import { GameManager } from "./GameManager";
const { ccclass, property } = _decorator;

@ccclass("Panel")
export class Panel extends Component {
  @property(ToggleComponent)
  considerDistanceToggle: ToggleComponent = null;

  onLoad() {
    this.considerDistanceToggle.node.on(
      "toggle",
      this.considerDistanceCallback,
      this
    );
  }

  considerDistanceCallback() {
    if (this.considerDistanceToggle.getComponent(Toggle).isChecked) {
      GameManager.accelerationCoefficient = 1;
      GameManager.considerDistance = true;
    } else {
      GameManager.accelerationCoefficient = 0.001;
      GameManager.considerDistance = false;
    }
    GameManager.instance.regenerate();
  }

  start() {}

  update(deltaTime: number) {}
}

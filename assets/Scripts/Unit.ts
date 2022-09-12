import { _decorator, Component, Node, Sprite, RigidBody2D, math } from "cc";
import { GameManager } from "./GameManager";
import { colorMap } from "./Utils";
const { ccclass, property } = _decorator;
const { Vec2 } = math;

@ccclass("Unit")
export class Unit extends Component {
  color: string = "red";

  start() {
    this.node.getComponent(RigidBody2D).linearDamping = 0.08;
  }

  init(color: string) {
    const sprite = this.getComponent(Sprite);
    sprite.color = colorMap(color);
  }

  update(deltaTime: number) {
    if (
      this.node.position.x < -GameManager.canvasWidth / 2 ||
      this.node.position.x > GameManager.canvasWidth / 2
    ) {
      this.node.getComponent(RigidBody2D).linearVelocity = this.node
        .getComponent(RigidBody2D)
        .linearVelocity.multiply(new Vec2(-1, 1));
    }
    if (
      this.node.position.y < -GameManager.canvasHeight / 2 ||
      this.node.position.y > GameManager.canvasHeight / 2
    ) {
      this.node.getComponent(RigidBody2D).linearVelocity = this.node
        .getComponent(RigidBody2D)
        .linearVelocity.multiply(new Vec2(1, -1));
    }
  }
}

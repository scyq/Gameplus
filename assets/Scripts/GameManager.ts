import {
  _decorator,
  Component,
  Node,
  instantiate,
  Prefab,
  director,
  UITransform,
  RigidBody2D,
  math,
} from "cc";
import { Unit } from "./Unit";
import { getRandomInt } from "./Utils";
const { ccclass, property } = _decorator;
const { Vec2 } = math;

@ccclass("GameManager")
export class GameManager extends Component {
  @property({ type: Prefab })
  private unitPrefab: Prefab = null;

  @property({ type: Node })
  private canvas: Node = null;

  category: any = {};

  colorList = ["cyan", "red", "yellow"];

  static canvasWidth: number = 0;
  static canvasHeight: number = 0;
  basicAcceleration: number = 15;

  createUnitFromPrefab(color: string) {
    let unit = instantiate(this.unitPrefab);
    unit.parent = this.canvas;
    unit.setPosition(
      getRandomInt(-GameManager.canvasWidth / 2, GameManager.canvasWidth / 2),
      getRandomInt(-GameManager.canvasHeight / 2, GameManager.canvasHeight / 2),
      0
    );
    unit.getComponent(Unit).init(color);
    return unit;
  }

  start() {
    GameManager.canvasWidth = this.canvas.getComponent(UITransform).width;
    GameManager.canvasHeight = this.canvas.getComponent(UITransform).height;

    const generatedUnitCount = 100;

    for (const color of this.colorList) {
      this.category[color] = [];
      for (let i = 0; i < generatedUnitCount; i++) {
        let aUnit = this.createUnitFromPrefab(color);
        this.category[color].push(aUnit);
      }
    }
  }

  applyRule(units0: Node[], units1: Node[]) {
    for (let i = 0; i < units0.length; i++) {
      for (let j = 0; j < units1.length; j++) {
        const unit0 = units0[i];
        const unit1 = units1[j];
        const dx = unit1.position.x - unit0.position.x;
        const dy = unit1.position.y - unit0.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vec = new Vec2(dx, dy).normalize();
        let acceleration = this.basicAcceleration / (distance * distance);
        if (distance > 5) {
          unit0.getComponent(RigidBody2D).linearVelocity = unit0
            .getComponent(RigidBody2D)
            .linearVelocity.add(vec.multiplyScalar(acceleration));
        }
      }
    }
  }

  update(deltaTime: number) {
    for (let i = 0; i < this.colorList.length; i++) {
      for (let j = 0; j < this.colorList.length; j++) {
        this.applyRule(
          this.category[this.colorList[i]],
          this.category[this.colorList[j]]
        );
      }
    }
  }
}

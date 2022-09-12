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
  EventKeyboard,
  KeyCode,
  input,
  Input,
} from "cc";
import { Unit } from "./Unit";
import { getRandomInt } from "./Utils";
const { ccclass, property } = _decorator;
const { Vec2 } = math;

@ccclass("GameManager")
export class GameManager extends Component {
  @property(Prefab)
  private unitPrefab: Prefab = null;

  @property(Node)
  private canvas: Node = null;

  @property(Node)
  private panel: Node = null;

  static instance: GameManager = null;

  pause: boolean = false;

  category: any = {};
  colorList = ["cyan", "red", "yellow"];

  /**
   * 查询一个单位的颜色会受到其它颜色单位的加速度
   */
  colorAccelerationMap: any = {};
  static generatedUnitCount: number = 200;
  static canvasWidth: number = 0;
  static canvasHeight: number = 0;

  /**
   * 用于调整加速度的数量级
   */
  static accelerationCoefficient: number = 1;
  static considerDistance: boolean = true;

  onLoad() {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  onDestroy() {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

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

  initColorAccelerationMap() {
    for (let i = 0; i < this.colorList.length; i++) {
      const color = this.colorList[i];
      this.colorAccelerationMap[color] = {};
      for (let j = 0; j < this.colorList.length; j++) {
        const color2 = this.colorList[j];
        if (color !== color2) {
          this.colorAccelerationMap[color][color2] = 50;
        }
      }
    }
  }

  generateUnits() {
    for (const color of this.colorList) {
      this.category[color] = [];
      for (let i = 0; i < GameManager.generatedUnitCount; i++) {
        let aUnit = this.createUnitFromPrefab(color);
        this.category[color].push(aUnit);
      }
    }
  }

  start() {
    GameManager.instance = this;
    GameManager.canvasWidth = this.canvas.getComponent(UITransform).width;
    GameManager.canvasHeight = this.canvas.getComponent(UITransform).height;
    this.initColorAccelerationMap();
    this.generateUnits();
  }

  regenerate() {
    for (const color of this.colorList) {
      for (let i = 0; i < GameManager.generatedUnitCount; i++) {
        this.category[color][i].destroy();
      }
      this.category[color] = [];
    }
    this.generateUnits();
  }

  /**
   *
   * @param units0 作用单位
   * @param units1 参考单位
   */
  applyRule(units0: Node[], units1: Node[], defaultAcceleration: number = 15) {
    for (let i = 0; i < units0.length; i++) {
      for (let j = 0; j < units1.length; j++) {
        const unit0 = units0[i];
        const unit1 = units1[j];
        const dx = unit1.position.x - unit0.position.x;
        const dy = unit1.position.y - unit0.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        const division = GameManager.considerDistance ? distance * distance : 1;
        const vec = new Vec2(dx, dy).normalize();
        const acceleration =
          (GameManager.accelerationCoefficient * defaultAcceleration) /
          division;
        if (distance > 5) {
          unit0.getComponent(RigidBody2D).linearVelocity = unit0
            .getComponent(RigidBody2D)
            .linearVelocity.add(vec.multiplyScalar(acceleration));
        }
      }
    }
  }

  onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.SPACE:
        if (this.pause) {
          director.resume();
        } else {
          director.pause();
        }
        this.pause = !this.pause;
        break;
      case KeyCode.TAB:
        this.panel.active = !this.panel.active;
        break;
    }
  }

  update(deltaTime: number) {
    for (let i = 0; i < this.colorList.length; i++) {
      for (let j = 0; j < this.colorList.length; j++) {
        this.applyRule(
          this.category[this.colorList[i]],
          this.category[this.colorList[j]],
          this.colorAccelerationMap[this.colorList[i]][this.colorList[j]]
        );
      }
    }
  }
}

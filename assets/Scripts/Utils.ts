import { Color } from "cc";

export function colorMap(color: string) {
  switch (color) {
    case "blue":
      return Color.BLUE;
    case "red":
      return Color.RED;
    case "cyan":
      return Color.CYAN;
    case "yellow":
      return Color.YELLOW;
    case "green":
      return Color.GREEN;
    case "purple":
      return new Color(95, 33, 103);
    default:
      return new Color(1, 1, 1);
  }
}

// 左闭右开
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

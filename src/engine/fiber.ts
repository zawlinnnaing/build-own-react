import { UseStateAction } from "./useState";

type FunctionComponent = (props: Record<string, any>) => Fiber;

export interface Hook<T = any> {
  state?: T;
  tag: "STATE" | "EFFECT";
  deps?: any[];
  effect?: () => void | Function;
  queue: UseStateAction<T>[];
}

export interface Fiber {
  type: string | FunctionComponent;
  dom?: Element | Text;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  hooks?: Hook[];
  /**
   * Previously committed fiber for this fiber
   */
  alternate?: Fiber;
  effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
  props: {
    children?: Fiber[];
    [key: string]: any;
  };
}

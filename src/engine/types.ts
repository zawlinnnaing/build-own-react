export interface SimpleReactElementNode {
  type: string;
  props: {
    children: SimpleReactElementNode[];
    [key: string]: any;
  };
}

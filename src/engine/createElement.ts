import { SimpleReactElementNode } from "./types";

export default function createElement(
  type: string,
  props: any,
  ...children: (SimpleReactElementNode | string)[]
): SimpleReactElementNode {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === "string" ? createTextElement(child) : child;
      }),
    },
  };
}

function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

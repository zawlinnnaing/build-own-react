import { Fiber } from "./fiber";

export default function createElement(
  type: string,
  props: any,
  ...children: (Fiber | string)[]
): Fiber {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === "object" ? child : createTextElement(child);
      }),
    },
  };
}

function createTextElement(text: any) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

import { SimpleReactElementNode } from "./types";

export default function render(
  element: SimpleReactElementNode,
  container: Element | Text
) {
  const isTextNode = element.type === "TEXT_ELEMENT";
  const dom = isTextNode
    ? document.createTextNode("")
    : document.createElement(element.type);
  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((key) => {
      console.log("🚀 ~ .forEach ~ key:", key, dom);
      // @ts-expect-error
      dom[key] = element.props[key];
    });
  if (!isTextNode) {
    element.props.children.forEach((child) => {
      render(child, dom);
    });
  }

  container.appendChild(dom);
}

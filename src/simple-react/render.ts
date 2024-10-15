import { renderWorker } from "./RenderWorker";
import { Fiber } from "./fiber";

export default function render(fiber: Fiber, container: Element | Text) {
  renderWorker.setRoot({
    dom: container,
    props: {
      children: [fiber],
    },
    type: fiber.type,
    alternate: renderWorker.currentRoot,
  });
  renderWorker.startWork();
}

import { Hook } from "./fiber";
import { renderWorker } from "./RenderWorker";

export type UseStateAction<T> = T | ((prev: T) => T);

export default function useState<T>(
  initialValue: T
): [T, (val: UseStateAction<T>) => void] {
  const oldHook =
    renderWorker.currentHookFiber?.alternate?.hooks?.[
      renderWorker.hookIndex ?? 0
    ];
  const hook: Hook<T> = {
    state: oldHook?.state ?? initialValue,
  };
  renderWorker.currentHookFiber?.hooks?.push(hook);
  renderWorker.setHookIndex(renderWorker.hookIndex + 1);

  oldHook?.queue?.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action: UseStateAction<T>) => {
    console.log("🚀 ~ setState ~ action:", action);
    if (!renderWorker.currentRoot) {
      throw new Error("Current root is not defined");
    }
    hook.queue?.push(action);
    renderWorker.setRoot({
      dom: renderWorker.currentRoot.dom,
      props: renderWorker.currentRoot.props ?? {},
      type: renderWorker.currentRoot.type,
      alternate: renderWorker.currentRoot,
    });
  };

  return [hook.state, setState];
}

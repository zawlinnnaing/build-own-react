import { EffectCallback, Hook } from "./fiber";
import { renderWorker } from "./RenderWorker";

export default function useEffect(effect: EffectCallback, deps?: any[]) {
  const oldHook =
    renderWorker.currentHookFiber?.alternate?.hooks?.[
      renderWorker.hookIndex ?? 0
    ];
  const hook: Hook = {
    tag: "EFFECT",
    deps,
    effect,
    queue: [],
  };

  const hasDepsChanged = oldHook?.deps?.some(
    (dep, i) => dep !== hook.deps?.[i]
  );

  //   Add the effect to pending effects if the deps have changed
  if (
    (!hook.deps ||
      hasDepsChanged ||
      hook.deps.length !== oldHook?.deps?.length) &&
    hook.effect
  ) {
    oldHook?.cleanup?.();
    renderWorker.pendingEffectHooks.push(hook);
  }

  renderWorker.currentHookFiber?.hooks?.push(hook);
  renderWorker.hookIndex += 1;
}

import { Fiber, Hook } from "./fiber";

export class RenderWorker {
  private nextUnitOfWork: Fiber | undefined;
  private wipRoot: Fiber | undefined;
  private deletions: Fiber[] = [];
  public pendingEffectHooks: Hook[] = [];

  public currentHookFiber: Fiber | undefined;
  public hookIndex = 0;
  /**
   * Previously committed root
   */
  public currentRoot: Fiber | undefined;

  public startWork() {
    requestIdleCallback(this.workloop);
  }

  public setRoot(element: Fiber) {
    this.wipRoot = element;
    this.nextUnitOfWork = element;
    this.deletions = [];
  }

  public setWipRoot = (root: Fiber) => {
    this.wipRoot = root;
  };

  public setDeletions = (fibers: Fiber[]) => {
    this.deletions = fibers;
  };

  public workloop = (deadline: IdleDeadline) => {
    let shouldYield = false;
    while (this.nextUnitOfWork && !shouldYield) {
      this.nextUnitOfWork = this.performUnitOfWork(this.nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1;
    }
    if (!this.nextUnitOfWork && this.wipRoot) {
      this.commitRoot();
    }
    requestIdleCallback(this.workloop);
  };

  public performUnitOfWork(wipFiber: Fiber): Fiber | undefined {
    if (wipFiber.type instanceof Function) {
      this.updateFunctionComponent(wipFiber);
    } else {
      this.updateHostComponent(wipFiber);
    }
    if (wipFiber.child) {
      return wipFiber.child;
    }
    let nextFiber: Fiber | undefined = wipFiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
  }

  private commitRoot() {
    this.deletions.forEach(this.commitWork);
    if (this.wipRoot?.child) {
      this.commitWork(this.wipRoot.child);
    }
    this.runEffects();
    this.currentRoot = this.wipRoot;
    this.wipRoot = undefined;
  }

  private runEffects = () => {
    this.pendingEffectHooks.forEach((hook) => {
      // @ts-expect-error
      hook.cleanup = hook.effect?.();
    });
    this.pendingEffectHooks = [];
  };

  private isNewProps = (props: Fiber["props"], prevProps: Fiber["props"]) => {
    return (key: string) => props[key] !== prevProps[key];
  };

  private isRemovedProps(props: Fiber["props"]) {
    return (key: string) => !(key in props);
  }

  private isProperty = (key: string) => {
    return key !== "children" && !this.isEventListener(key);
  };

  private isEventListener = (key: string) => {
    return key.startsWith("on");
  };

  private getEventTypeFromProps = (name: string) =>
    name.toLowerCase().substring(2);

  public createDOM = (fiber: Fiber) => {
    if (fiber.type instanceof Function) {
      throw new Error("Fiber must not be functional component");
    }
    const isTextNode = fiber.type === "TEXT_ELEMENT";
    const dom = isTextNode
      ? document.createTextNode("")
      : document.createElement(fiber.type);
    this.updateDOM(dom, fiber.props);
    return dom;
  };

  public updateDOM = (
    node: Node,
    props: Fiber["props"],
    prevProps: Fiber["props"] = {}
  ) => {
    // Remove old or changed event listeners
    Object.keys(prevProps)
      .filter(this.isEventListener)
      .filter(
        (key) => !(key in props) || this.isNewProps(props, prevProps)(key)
      )
      .forEach((key) => {
        node.removeEventListener(
          this.getEventTypeFromProps(key),
          prevProps[key] ?? null
        );
      });

    // Add new event listeners
    Object.keys(props)
      .filter(this.isEventListener)
      .filter(this.isNewProps(props, prevProps))
      .forEach((name) => {
        node.addEventListener(this.getEventTypeFromProps(name), props[name]);
      });

    // Remove old properties
    Object.keys(prevProps ?? {})
      .filter(this.isProperty)
      .filter(this.isRemovedProps(props))
      .forEach((key) => {
        // @ts-expect-error
        node[key] = "";
      });

    // Update new properties
    Object.keys(props)
      .filter(this.isProperty)
      .filter(this.isNewProps(props, prevProps))
      .forEach((key) => {
        // @ts-expect-error
        node[key] = props[key];
      });
  };

  private commitDeletion = (fiber: Fiber, domParent: Node) => {
    if (!fiber.dom) {
      return;
    }
    if (domParent) {
      domParent.removeChild(fiber.dom);
    } else if (fiber.child) {
      this.commitDeletion(fiber.child, domParent);
    }
  };

  private commitWork = (fiber: Fiber) => {
    let domParentFiber = fiber.parent;
    while (!domParentFiber?.dom) {
      domParentFiber = domParentFiber?.parent;
    }
    const domParent = domParentFiber.dom;
    if (!domParent || !fiber.dom) {
      return;
    }

    if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "DELETION") {
      this.commitDeletion(fiber, domParent);
    } else if (fiber.effectTag === "UPDATE") {
      this.updateDOM(fiber.dom, fiber.props, fiber.alternate?.props);
    }
    if (fiber.child) {
      this.commitWork(fiber.child);
    }
    if (fiber.sibling) {
      this.commitWork(fiber.sibling);
    }
  };

  private updateHostComponent(fiber: Fiber) {
    if (!fiber.dom) {
      fiber.dom = this.createDOM(fiber);
    }
    this.reconcileChildren(fiber, fiber.props.children);
  }

  private updateFunctionComponent(fiber: Fiber) {
    if (!(fiber.type instanceof Function)) {
      throw new Error("Fiber must be function component");
    }
    fiber.hooks = [];
    this.currentHookFiber = fiber;
    this.hookIndex = 0;
    const children = [fiber.type(fiber.props)];
    this.reconcileChildren(fiber, children);
  }

  private reconcileChildren(
    wipFiber: Fiber,
    children: Fiber["props"]["children"]
  ) {
    if (!children) {
      return;
    }
    let prevSibling: Fiber | undefined = undefined;
    let index = 0;
    let oldChildFiber = wipFiber.alternate?.child;
    while (index < children.length || !!oldChildFiber) {
      const element: Fiber | undefined = children[index];
      const sameType = oldChildFiber?.type === element?.type;

      let newFiber: Fiber | undefined = undefined;
      if (sameType) {
        newFiber = {
          props: element.props,
          type: element.type,
          dom: oldChildFiber?.dom,
          alternate: oldChildFiber,
          effectTag: "UPDATE",
          parent: wipFiber,
        };
      }
      if (!sameType && element) {
        newFiber = {
          props: element.props,
          type: element.type,
          parent: wipFiber,
          effectTag: "PLACEMENT",
        };
      }
      if (!element && oldChildFiber) {
        oldChildFiber.effectTag = "DELETION";
        this.deletions.push(oldChildFiber);
      }

      if (oldChildFiber) {
        oldChildFiber = oldChildFiber.sibling;
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element && prevSibling) {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
      index++;
    }
  }
}

export const renderWorker = new RenderWorker();

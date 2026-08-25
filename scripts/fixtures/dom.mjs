const unsupported = (operation) => {
  throw new Error(`Component harness does not implement ${operation}; add an explicit capability before using it`);
};

export class HarnessEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.composed = Boolean(options.composed);
    this.cancelable = Boolean(options.cancelable);
    Object.assign(this, options);
  }
  preventDefault() { if (this.cancelable) this.defaultPrevented = true; }
  stopPropagation() { this.propagationStopped = true; }
  stopImmediatePropagation() { this.propagationStopped = true; this.immediatePropagationStopped = true; }
  composedPath() { return this._path ? [...this._path] : []; }
}

class HarnessStyle {
  #values = new Map();
  setProperty(name, value) { this.#values.set(String(name), String(value)); }
  getPropertyValue(name) { return this.#values.get(String(name)) ?? ""; }
  removeProperty(name) { const value = this.getPropertyValue(name); this.#values.delete(String(name)); return value; }
}

class HarnessClassList {
  #owner;
  constructor(owner) { this.#owner = owner; }
  #set() { return new Set((this.#owner.getAttribute("class") ?? "").split(/\s+/).filter(Boolean)); }
  #write(values) { this.#owner.setAttribute("class", [...values].join(" ")); }
  add(...names) { const values = this.#set(); names.forEach((name) => values.add(name)); this.#write(values); }
  remove(...names) { const values = this.#set(); names.forEach((name) => values.delete(name)); this.#write(values); }
  contains(name) { return this.#set().has(name); }
  toggle(name, force) { const enabled = force ?? !this.contains(name); if (enabled) this.add(name); else this.remove(name); return enabled; }
  [Symbol.iterator]() { return this.#set()[Symbol.iterator](); }
}

const selectorMatches = (node, selector) => {
  const value = selector.trim();
  if (!value || /[>+~:,]/.test(value)) unsupported(`selector ${selector}`);
  const last = value.split(/\s+/).at(-1);
  const id = /#([\w-]+)/.exec(last)?.[1];
  const classes = [...last.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  const tag = /^([a-z][\w-]*)/i.exec(last)?.[1]?.toLowerCase();
  const attribute = /^\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]$/.exec(last);
  if (!tag && !id && !classes.length && !attribute) unsupported(`selector ${selector}`);
  return (!tag || node.localName === tag)
    && (!id || node.id === id)
    && classes.every((name) => node.classList.contains(name))
    && (!attribute || (attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2]));
};

export class HarnessNode {
  constructor(localName = "div") {
    this.localName = String(localName).toLowerCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.dataset = {};
    this.style = new HarnessStyle();
    this.classList = new HarnessClassList(this);
    this.listeners = new Map();
    this.hidden = false;
    this.isConnected = false;
  }
  get id() { return this.getAttribute("id") ?? ""; }
  set id(value) { this.setAttribute("id", value); }
  get className() { return this.getAttribute("class") ?? ""; }
  set className(value) { this.setAttribute("class", value); }
  get lastElementChild() { return this.children.at(-1) ?? null; }
  append(...nodes) { for (const node of nodes) this.#adopt(node); }
  appendChild(node) { this.#adopt(node); return node; }
  replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this.append(...nodes); }
  #adopt(node) {
    if (!(node instanceof HarnessNode)) throw new TypeError("Harness DOM append accepts HarnessNode instances only");
    node.remove();
    this.children.push(node);
    node.parentNode = this;
    node._setConnected(this.isConnected);
  }
  remove() {
    const index = this.parentNode?.children.indexOf(this) ?? -1;
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
    this._setConnected(false);
  }
  _setConnected(connected) {
    const changed = this.isConnected !== connected;
    this.isConnected = connected;
    if (changed) {
      if (connected) this.connectedCallback?.();
      else this.disconnectedCallback?.();
    }
    for (const child of this.children) child._setConnected(connected);
  }
  setAttribute(name, value) {
    const key = String(name); const serialised = String(value);
    this.attributes.set(key, serialised);
    if (key.startsWith("data-")) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = serialised;
  }
  getAttribute(name) { return this.attributes.get(String(name)) ?? null; }
  hasAttribute(name) { return this.attributes.has(String(name)); }
  removeAttribute(name) { this.attributes.delete(String(name)); }
  toggleAttribute(name, force) { const enabled = force ?? !this.hasAttribute(name); if (enabled) this.setAttribute(name, ""); else this.removeAttribute(name); return enabled; }
  addEventListener(type, listener) {
    if (typeof listener !== "function") throw new TypeError("Event listener must be a function");
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type, listener) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== listener)); }
  dispatchEvent(event) {
    if (!(event instanceof HarnessEvent)) throw new TypeError("Harness dispatchEvent requires Event or CustomEvent");
    event.target ??= this;
    const path = [this];
    if (event.bubbles) for (let node = this.parentNode; node; node = node.parentNode) path.push(node);
    event._path = path;
    for (const node of path) {
      event.currentTarget = node;
      for (const listener of [...(node.listeners.get(event.type) ?? [])]) {
        listener.call(node, event);
        if (event.immediatePropagationStopped) break;
      }
      if (event.propagationStopped) break;
    }
    return !event.defaultPrevented;
  }
  get innerHTML() { return this._innerHTML ?? ""; }
  set innerHTML(markup) {
    this._innerHTML = String(markup);
    this.replaceChildren();
    for (const match of this._innerHTML.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)) {
      const node = new HarnessNode(match[1]);
      for (const attribute of match[2].matchAll(/([\w-]+)(?:=["']([^"']*)["'])?/g)) node.setAttribute(attribute[1], attribute[2] ?? "");
      this.append(node);
    }
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  getElementById(id) {
    const target = String(id);
    const visit = (node) => {
      for (const child of node.children) {
        if (child.id === target) return child;
        const found = visit(child);
        if (found) return found;
      }
      return null;
    };
    return visit(this);
  }
  querySelectorAll(selector) {
    const rows = [];
    const visit = (node) => { for (const child of node.children) { if (selectorMatches(child, selector)) rows.push(child); visit(child); } };
    visit(this);
    return rows;
  }
  focus() { this.focused = true; }
  getBoundingClientRect() { unsupported("getBoundingClientRect"); }
  setPointerCapture() { unsupported("setPointerCapture"); }
}

export class HarnessHTMLElement extends HarnessNode {
  constructor() { super("host"); }
  attachShadow(options) {
    if (this.shadowRoot) throw new Error("A component may attach only one shadow root");
    if (!options || options.mode !== "open" || Object.keys(options).length !== 1) throw new Error("Component harness supports only an explicit open Shadow DOM");
    this.shadowRoot = new HarnessNode("shadow-root");
    this.shadowRoot.parentNode = this;
    this.shadowRoot.isConnected = this.isConnected;
    return this.shadowRoot;
  }
  _setConnected(connected) {
    super._setConnected(connected);
    this.shadowRoot?._setConnected(connected);
  }
}

export function createDom({ definitions = new Map() } = {}) {
  const styles = new Map();
  const document = {
    head: new HarnessNode("head"),
    body: new HarnessNode("body"),
    activeElement: null,
    visibilityState: "visible",
    createElement(name) { const Element = definitions.get(name); return Element ? new Element() : new HarnessNode(name); },
    getElementById(id) { return styles.get(id) ?? null; },
    addEventListener() { unsupported("document.addEventListener without an explicit document-events capability"); },
    removeEventListener() { unsupported("document.removeEventListener without an explicit document-events capability"); },
  };
  document.head._setConnected(true);
  document.body._setConnected(true);
  const append = document.head.append.bind(document.head);
  document.head.append = (...nodes) => { append(...nodes); for (const node of nodes) if (node.id) styles.set(node.id, node); };
  return { document, HTMLElement: HarnessHTMLElement, Event: HarnessEvent, CustomEvent: HarnessEvent };
}

class DashboardPreferenceEditorV3 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.built = false;
    this.hiddenIds = new Set();
  }

  open(options) {
    this.options = options;
    this.items = options.items.map((item) => ({ ...item }));
    const ids = new Set(this.items.map((item) => item.id));
    this.hiddenIds = new Set((options.hidden || []).filter((id) => ids.has(id)));
    this.build();
    this.clearSaveError();
    this.render();
    this.dialog.showModal();
    queueMicrotask(() => this.shadowRoot.querySelector(".close")?.focus());
  }

  build() {
    if (this.built) return;
    this.built = true;
    this.shadowRoot.innerHTML = `
      <style>
        *{box-sizing:border-box}
        dialog{width:min(560px,calc(100vw - 24px));max-height:min(760px,calc(100dvh - 24px));border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-dialog,8px);padding:0;color:var(--primary-text-color);background:var(--card-background-color);box-shadow:var(--dashboard-dialog-shadow,0 16px 48px rgba(0,0,0,.22))}
        dialog::backdrop{background:var(--dashboard-modal-scrim,rgba(0,0,0,.12));backdrop-filter:blur(3px)}
        button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}
        .header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--divider-color);background:var(--card-background-color)}
        h2{font-size:16px;line-height:1.2;font-weight:500;margin:0}
        .close,.move,.visibility{width:44px;height:44px;border-radius:var(--dashboard-radius-control,6px);display:grid;place-items:center;color:var(--secondary-text-color)}
        .close ha-icon,.move ha-icon,.visibility ha-icon{--mdc-icon-size:17px}
        .body{padding:12px 14px 88px}.copy{font-size:12px;color:var(--secondary-text-color);line-height:1.45;margin:0 2px 10px}.rows{display:grid;gap:7px}
        .row{min-height:56px;border:var(--dashboard-card-border,1px solid var(--divider-color));border-radius:var(--dashboard-radius-card,8px);display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 6px}.row.off{opacity:.52}
        .icon{width:32px;height:32px;display:grid;place-items:center;color:var(--secondary-text-color)}.icon ha-icon{--mdc-icon-size:18px}.name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{font-size:12px;color:var(--secondary-text-color);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .actions,.buttons{display:flex;gap:8px}.move[disabled]{opacity:.22}.visibility.off{color:var(--error-color)}
        .save-error{margin:0;padding:10px 14px 0;color:var(--error-color);font-size:13px;line-height:1.4}
        .footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-top:1px solid var(--divider-color);background:var(--card-background-color)}.count{font-size:12px;color:var(--secondary-text-color)}
        .cancel,.save{min-height:44px;padding:0 13px;border:1px solid var(--divider-color);border-radius:var(--dashboard-radius-control,6px);background:transparent;font-size:13px;font-weight:500}.save{min-width:84px;background:var(--primary-color);color:var(--text-primary-color,#fff);border-color:transparent}:is(button):focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      </style>
      <dialog>
        <div class="header"><h2></h2><button class="close" type="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
        <div class="body"><div class="copy"></div><div class="rows"></div></div>
        <p class="save-error" role="alert" hidden></p>
        <div class="footer"><span class="count"></span><span class="buttons"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save</button></span></div>
      </dialog>`;
    this.dialog = this.shadowRoot.querySelector("dialog");
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
    this.shadowRoot.querySelector(".close").onclick = () => this.dialog.close();
    this.shadowRoot.querySelector(".cancel").onclick = () => this.dialog.close();
    this.shadowRoot.querySelector(".save").onclick = () => this.save();
  }

  render() {
    this.shadowRoot.querySelector("h2").textContent = this.options.title || "Edit";
    this.shadowRoot.querySelector(".copy").textContent = this.options.description || "Reorder or hide items.";
    const rows = this.shadowRoot.querySelector(".rows");
    rows.replaceChildren();
    this.items.forEach((item, index) => {
      const row = document.createElement("div");
      const hidden = this.hiddenIds.has(item.id);
      row.className = `row ${hidden ? "off" : ""}`;
      row.innerHTML = `<span class="icon"><ha-icon icon="${item.icon || "mdi:circle-outline"}"></ha-icon></span><span><div class="name"></div><div class="meta"></div></span><span class="actions"><button class="move up" type="button" aria-label="Move earlier" ${index === 0 ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button><button class="move down" type="button" aria-label="Move later" ${index === this.items.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="visibility ${hidden ? "off" : ""}" type="button" aria-label="${hidden ? "Show" : "Hide"}"><ha-icon icon="mdi:${hidden ? "eye-outline" : "eye-off-outline"}"></ha-icon></button></span>`;
      row.querySelector(".name").textContent = item.name;
      row.querySelector(".meta").textContent = item.meta || "";
      row.querySelector(".up").onclick = () => this.move(index, -1);
      row.querySelector(".down").onclick = () => this.move(index, 1);
      row.querySelector(".visibility").onclick = () => {
        if (hidden) this.hiddenIds.delete(item.id);
        else this.hiddenIds.add(item.id);
        this.render();
      };
      rows.append(row);
    });
    this.shadowRoot.querySelector(".count").textContent = `${this.items.length - this.hiddenIds.size} of ${this.items.length} shown`;
  }

  move(index, direction) {
    const next = index + direction;
    if (next < 0 || next >= this.items.length) return;
    [this.items[index], this.items[next]] = [this.items[next], this.items[index]];
    this.render();
  }

  clearSaveError() {
    const error = this.shadowRoot.querySelector(".save-error");
    if (!error) return;
    error.hidden = true;
    error.textContent = "";
  }

  async save() {
    const button = this.shadowRoot.querySelector(".save");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Saving…";
    this.clearSaveError();
    try {
      await this.options.onSave?.({
        order: this.items.map((item) => item.id),
        hidden: [...this.hiddenIds],
      });
      this.dialog.close();
    } catch (error) {
      const message = this.shadowRoot.querySelector(".save-error");
      if (message) {
        message.textContent = error?.message || "Couldn’t save these changes. Your current choices are still open; try again.";
        message.hidden = false;
      }
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Save";
    }
  }
}

if (!customElements.get("dashboard-preference-editor-v3")) {
  customElements.define("dashboard-preference-editor-v3", DashboardPreferenceEditorV3);
}

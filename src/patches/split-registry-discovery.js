/** Refresh room and active collections when shared split state changes. */
(()=>{
  customElements.whenDefined("component-smart-collection-v3").then(()=>{
    const Collection=customElements.get("component-smart-collection-v3");
    const prototype=Collection?.prototype;
    if(!prototype||prototype.__splitRegistryDiscoveryV1)return;
    prototype.__splitRegistryDiscoveryV1=true;
    const hassDescriptor=Object.getOwnPropertyDescriptor(prototype,"hass");
    const originalConnected=prototype.connectedCallback;
    const originalDisconnected=prototype.disconnectedCallback;
    prototype.subscribeSplitRegistryV1=function(){
      const registry=globalThis.__componentSplitRegistryV4;
      if(this._splitRegistryUnsubV1||!this.h||!registry?.subscribe)return;
      this._splitRegistryUnsubV1=registry.subscribe(this.h,()=>{
        this.split=null;
        this.structureSig="";
        this.schedule();
      });
    };
    Object.defineProperty(prototype,"hass",{
      ...hassDescriptor,
      set(value){
        hassDescriptor.set.call(this,value);
        this.subscribeSplitRegistryV1();
      }
    });
    prototype.connectedCallback=function(){
      originalConnected.call(this);
      this.subscribeSplitRegistryV1();
    };
    prototype.disconnectedCallback=function(){
      this._splitRegistryUnsubV1?.();
      this._splitRegistryUnsubV1=null;
      originalDisconnected.call(this);
    };
  });
})();

/** Route room and active collections through the shared split-system registry. */
(()=>{
  const HD2=globalThis.__homeDashboardV2;
  if(HD2?.controlConfig&&!HD2.__splitRegistryDiscoveryV1){
    HD2.__splitRegistryDiscoveryV1=true;
    const originalControlConfig=HD2.controlConfig;
    HD2.controlConfig=(entry,state,data,hass,split)=>{
      const system=split?.systems?.get(entry?.entity_id);
      if(system)return{
        type:"custom:component-split-controller-v4",
        entity:entry.entity_id,
        room_id:system.room_id,
        registry_entity:system.registry_entity,
        controller_entity:system.controller_entity,
        vertical_vane_entity:system.vertical_vane_entity,
        horizontal_vane_entity:system.horizontal_vane_entity,
        minimum_target:system.minimum_target,
        maximum_target:system.maximum_target,
        fan_ceiling:system.fan_ceiling,
        last_mode:system.last_mode,
        deadline:system.deadline,
        profiles:system.profiles
      };
      return originalControlConfig(entry,state,data,hass,split);
    };
  }

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

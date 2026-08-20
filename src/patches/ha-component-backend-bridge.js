/** Route Split System Components through the scalable HA Component Backend. */
(()=>{
  const LEGACY_DOMAIN="split_state_registry",BACKEND_DOMAIN="ha_component_backend",TAG="component-split-controller-v4",proxies=new WeakMap;
  const backendHass=hass=>{
    if(!hass||typeof hass!=="object"||typeof hass.callService!=="function")return hass;
    if(proxies.has(hass))return proxies.get(hass);
    const proxy=new Proxy(hass,{get(target,key,receiver){
      const value=Reflect.get(target,key,receiver);
      if(key==="callService")return(domain,...args)=>value.call(target,domain===LEGACY_DOMAIN?BACKEND_DOMAIN:domain,...args);
      return typeof value==="function"?value.bind(target):value;
    }});
    proxies.set(hass,proxy);
    return proxy;
  };
  customElements.whenDefined(TAG).then(()=>{
    const Controller=customElements.get(TAG),prototype=Controller?.prototype,descriptor=prototype&&Object.getOwnPropertyDescriptor(prototype,"hass");
    if(!prototype||!descriptor?.set||prototype.__haComponentBackendBridgeV1)return;
    prototype.__haComponentBackendBridgeV1=true;
    Object.defineProperty(prototype,"hass",{...descriptor,set(value){return descriptor.set.call(this,backendHass(value))}});
  });
})();

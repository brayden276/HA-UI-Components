/** Shared read-only registry cache for room-aware components. */
const DASHBOARD_REGISTRY_CACHE=new WeakMap();
const loadDashboardRegistries=connection=>{
  if(!connection||!connection.sendMessagePromise)return Promise.resolve({areas:[],devices:[],entities:[]});
  let cached=DASHBOARD_REGISTRY_CACHE.get(connection);
  if(!cached){
    cached=Promise.all([
      connection.sendMessagePromise({type:"config/area_registry/list"}),
      connection.sendMessagePromise({type:"config/device_registry/list"}),
      connection.sendMessagePromise({type:"config/entity_registry/list"})
    ]).then(values=>({
      areas:Array.isArray(values[0])?values[0]:[],
      devices:Array.isArray(values[1])?values[1]:[],
      entities:Array.isArray(values[2])?values[2]:[]
    })).catch(()=>({areas:[],devices:[],entities:[]}));
    DASHBOARD_REGISTRY_CACHE.set(connection,cached);
  }
  return cached;
};

Object.assign(globalThis.__HA_COMPONENT_LIBRARY_SHARED__, { loadDashboardRegistries });



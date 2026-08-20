"""Constants for Split State Registry."""

DOMAIN = "split_state_registry"
PLATFORMS = ["sensor"]
STORE_VERSION = 1
STORE_KEY = DOMAIN
SENSOR_ENTITY_ID = "sensor.split_state_registry"

SERVICE_REGISTER_ROOM = "configure_room"
SERVICE_REMOVE_ROOM = "remove_room"
SERVICE_SET_SETTINGS = "update_room"
SERVICE_SET_TIMER = "set_timer"
SERVICE_RESUME_ROOM = "resume_room"
SERVICE_UPSERT_PROFILE = "upsert_profile"
SERVICE_DELETE_PROFILE = "remove_profile"

ROOMS = "rooms"
REVISION = "revision"
FAN_CEILINGS = {"quiet": "Quiet", "low": "Low", "medium": "Medium", "high": "High", "unrestricted": "Unrestricted"}

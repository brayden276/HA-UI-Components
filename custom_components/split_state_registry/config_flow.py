"""Config flow for the local persistent Split State Registry."""

from homeassistant import config_entries

from .const import DOMAIN


class SplitStateRegistryConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Create one local registry entry."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Create the singleton registry."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title="Split State Registry", data={})

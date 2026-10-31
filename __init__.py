"""Hermes Agent entrypoint for a Desktop-only theme plugin.

The theme itself is registered by ``desktop/plugin.js`` inside Hermes Desktop.
Hermes Agent imports every installed plugin directory through this module, so
it exists only to satisfy that contract: it registers no tools, hooks, commands
or settings.
"""


def register(ctx):
    """Satisfy the Agent plugin contract without registering anything."""
    del ctx

# ChatGPT plugin package (draft)

Source for the Bolagskvarnen plugin package for the ChatGPT plugin directory
(https://developers.openai.com/plugins/deploy/submission). Not submitted yet.

To build the ZIP, zip the *contents* of this folder (so `plugin.json` is at the ZIP root):

```
cd chatgpt-plugin && zip -r ../bolagskvarnen-plugin.zip plugin.json mcp.json assets
```

Test cases use the sandbox company 569900-0013 (Exempelbolaget). Reviewer credentials,
the demo recording link and the domain verification are entered in the portal, never in this folder.

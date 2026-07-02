# TAE Migration Notes

ScriptTag removed in commit dba328c. Widget now delivered via Theme App Extension.

Key changes:
- No ScriptTag registration on OAuth
- Widget reads data-* attrs from Liquid block (not ShopifyAnalytics.meta)
- Widget renders into #fbt-widget-root (merchant places in theme editor)
- fbt-widget.js served from Shopify Fastly CDN
- Scopes: removed read/write_script_tags
- BfS badge eligible

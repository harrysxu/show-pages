---
layout: default
title: Markora Support and FAQ
description: Markora troubleshooting and support
permalink: /markora/support-en/
---

# Markora Support and FAQ

## Contact

Open an issue on [GitHub Issues](https://github.com/harrysxu/show-pages/issues). To protect your privacy, do not upload document text, scan images, Apple receipts, order numbers, or other sensitive information. Include your device model, OS version, app version, and reproducible steps instead.

## Frequently asked questions

### Why should I review scan results?

OCR can be affected by fonts, lighting, perspective, tables, and handwriting. Markora shows a review screen after on-device recognition so you can check low-confidence text before creating or inserting the document.

### Does Markora upload my documents?

The current version has no Markora-hosted document service. Documents, scan images, and OCR results are processed on the device or saved where you choose through the system file picker. See the [Privacy Policy](privacy-en.md).

### Why does the camera not open?

Allow Markora under **Settings > Privacy & Security > Camera**. You can also import an image or PDF from the scan screen. Simulators generally do not support a real document camera.

### Why is Pro still locked after subscribing?

Confirm the Apple Account used for the purchase, wait for the store status to load, and choose Restore Purchases. If access still does not appear, open a support issue without posting a receipt or payment information. Contact Apple for refunds.

### How do I delete documents and drafts?

Delete documents and `assets` saved in Files or iCloud Drive at that location. Unsaved drafts are local app data; see [Data deletion and requests](data-requests-en.md).

### Why do external links or remote images not appear?

The editor limits remote-image loading to avoid unexpected network requests while editing. External links can be opened by the system browser; the external site controls its content and privacy policy.

## Security reports

If you find a possible issue affecting document security or privacy, mark the GitHub issue as “security” and do not paste sensitive content publicly. The maintainer will provide a follow-up channel appropriate to the report.

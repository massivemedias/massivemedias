"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// No custom public routes for qr-scan - all scan data is exposed via the
// qr-code controller (listScans, listWithScans). This file exists only to
// prevent future accidental creation of a public scan listing endpoint.
exports.default = { routes: [] };

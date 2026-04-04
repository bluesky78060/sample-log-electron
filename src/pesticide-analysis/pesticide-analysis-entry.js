// npm packages
import * as XLSX from 'xlsx-js-style';
window.XLSX = XLSX;

// Shared modules (sanitize must be first)
import '../shared/sanitize.js';
import '../shared/constants.js';
import '../shared/utils.js';
import '../shared/toast.js';
import '../shared/theme.js';
import '../shared/tooltip.js';
import '../shared/logger.js';
import '../shared/firebase-config.js';
import '../shared/firestore-db.js';
import '../shared/pesticide-data.js';

// Main script
import './pesticide-analysis-script.js';

// npm packages
import * as XLSX from 'xlsx-js-style';
window.XLSX = XLSX;

// Shared modules
import '../shared/sanitize.js';
import '../shared/constants.js';
import '../shared/utils.js';
import '../shared/toast.js';
import '../shared/theme.js';
import '../shared/tooltip.js';
import '../shared/logger.js';

// Main script
import './water-analysis-script.js';

// npm packages
import * as XLSX from 'xlsx-js-style';
window.XLSX = XLSX;

// Shared modules
import '../shared/sanitize.js';
import '../bonghwaData.js';
import '../shared/constants.js';
import '../shared/utils.js';
import '../shared/toast.js';
import '../shared/address.js';
import '../shared/address-parser.js';
import '../shared/theme.js';
import '../shared/tooltip.js';
import '../shared/logger.js';

// Main script
import './heuktoram-script.js';

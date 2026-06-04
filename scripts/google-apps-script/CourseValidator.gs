/**
 * tridorian Course Validator
 * Version: 1.0.0
 *
 * Instructions:
 * 1. Open your Google Doc.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Save and refresh the Google Doc.
 * 5. Use the "tridorian" menu to validate.
 */

function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('tridorian')
      .addItem('Validate Course Structure', 'validateCourse')
      .addToUi();
}

/**
 * Main validation logic
 */
function validateCourse() {
  const doc = DocumentApp.getActiveDocument();
  const tabs = doc.getTabs();
  const errors = [];
  const warnings = [];

  // 1. Basic Tab Check
  if (tabs.length < 3) {
    errors.push("Document must have at least 3 tabs: [Config], [Intro], and at least one Module.");
  }

  // 2. Validate Config Tab
  const configTab = tabs[0].asDocumentTab();
  if (!configTab.getTitle().toUpperCase().includes("CONFIG")) {
    errors.push("The first tab must be named '[Config]'.");
  } else {
    const configData = parseConfigTable(configTab);
    if (!configData.course_id) errors.push("[Config]: Missing 'course_id' in table.");
    if (!configData.title) errors.push("[Config]: Missing 'title' in table.");
    if (!configData.version) warnings.push("[Config]: 'version' is missing, defaulting to 0.0.1.");
  }

  // 3. Validate Intro Tab
  const introTab = tabs[1] ? tabs[1].asDocumentTab() : null;
  if (introTab && !introTab.getTitle().toUpperCase().includes("INTRO")) {
    warnings.push("The second tab is usually named '[Intro]'. Found: " + introTab.getTitle());
  }

  // 4. Validate Module Tabs
  for (let i = 2; i < tabs.length; i++) {
    const tab = tabs[i].asDocumentTab();
    const body = tab.getBody();
    const tabTitle = tab.getTitle();

    // Check for Heading 1
    const h1 = body.getParagraphs().filter(p => p.getHeading() === DocumentApp.ParagraphHeading.HEADING1);
    if (h1.length === 0) {
      errors.push(`Module [${tabTitle}]: Missing Heading 1 for Module Title.`);
    }

    // Check for Heading 2 (Duration)
    const h2 = body.getParagraphs().filter(p => p.getHeading() === DocumentApp.ParagraphHeading.HEADING2);
    if (h2.length === 0) {
      warnings.push(`Module [${tabTitle}]: No Heading 2 found. Did you forget the duration (e.g., "5 mins")?`);
    }

    // Check for Tables (Info/Warning boxes)
    const tables = body.getTables();
    tables.forEach((table, index) => {
       const bgColor = table.getRow(0).getCell(0).getBackgroundColor();
       // Note: Background color check might be tricky in Apps Script depending on how it was set
       if (!bgColor) {
         warnings.push(`Module [${tabTitle}]: Table #${index+1} has no background color. It will be treated as a standard table.`);
       }
    });
  }

  showResults(errors, warnings);
}

/**
 * Helper to parse a 2-column key-value table
 */
function parseConfigTable(tab) {
  const tables = tab.getBody().getTables();
  const data = {};
  if (tables.length === 0) return data;

  const table = tables[0];
  for (let i = 0; i < table.getNumRows(); i++) {
    const row = table.getRow(i);
    if (row.getNumCells() >= 2) {
      const key = row.getCell(0).getText().trim().toLowerCase().replace(/\s+/g, '_');
      const value = row.getCell(1).getText().trim();
      data[key] = value;
    }
  }
  return data;
}

/**
 * Display results in a dialog
 */
function showResults(errors, warnings) {
  const ui = DocumentApp.getUi();
  let message = "";

  if (errors.length === 0 && warnings.length === 0) {
    message = "✅ Document is fully compliant and ready to sync!";
  } else {
    if (errors.length > 0) {
      message += "❌ ERRORS (Must fix):\n- " + errors.join("\n- ") + "\n\n";
    }
    if (warnings.length > 0) {
      message += "⚠️ WARNINGS (Recommended fix):\n- " + warnings.join("\n- ");
    }
  }

  const output = HtmlService.createHtmlOutput('<pre style="font-family: sans-serif; white-space: pre-wrap;">' + message + '</pre>')
      .setWidth(450)
      .setHeight(300);
  ui.showModalDialog(output, 'tridorian Validation Results');
}

/**
 * YouTube Ad Skipper Background Service Worker
 * Handles context menu creation and toggle state management
 */

// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Ad Skipper: Extension installed/updated")

  const manualSkipButtonEnabled = true

  // Set default state for manual skip button (enabled by default)
  chrome.storage.sync.set({ manualSkipButtonEnabled })

  // Create context menu item
  createContextMenu(manualSkipButtonEnabled)
})

// Create the context menu
function createContextMenu(checked) {
  // Remove existing context menu items first
  chrome.contextMenus.removeAll(() => {
    // Create the toggle menu item
    chrome.contextMenus.create({
      id: "toggleManualSkipButton",
      title: "Show Manual Skip Button",
      type: "checkbox",
      checked,
      contexts: ["action"],
    })
  })
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toggleManualSkipButton") {
    const isEnabled = info.checked

    // Update storage with new state
    chrome.storage.sync.set({
      manualSkipButtonEnabled: isEnabled,
    })

    // Send message to content script to update button visibility
    if (tab && tab.url && tab.url.includes("youtube.com")) {
      chrome.tabs.sendMessage(tab.id, {
        action: "toggleManualSkipButton",
        enabled: isEnabled,
      })
    }

    console.log(
      `YouTube Ad Skipper: Manual skip button ${
        isEnabled ? "enabled" : "disabled"
      }`
    )
  }
})

// Update context menu state when storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.manualSkipButtonEnabled) {
    const isEnabled = changes.manualSkipButtonEnabled.newValue

    // Update the context menu checkbox state
    chrome.contextMenus.update("toggleManualSkipButton", {
      checked: isEnabled,
    })
  }
})

// Initialize context menu on startup
chrome.runtime.onStartup.addListener(() => {
  // Get current state and update context menu
  chrome.storage.sync.get(["manualSkipButtonEnabled"], (result) => {
    const isEnabled = result.manualSkipButtonEnabled !== false // default to true

    createContextMenu(isEnabled)
  })
})

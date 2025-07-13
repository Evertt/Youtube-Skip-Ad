/**
 * YouTube Ad Skipper (v5 - Final, Direct Control)
 * This script is stable and skips ads by directly manipulating the video player,
 * which is more reliable than simulating clicks. It also properly injects a
 * manual skip button into the player UI.
 */

console.log("YouTube Ad Skipper: Initializing (Direct Control Mode)")

// Global state for manual skip button toggle
let manualSkipButtonEnabled = true

// --- CORE FUNCTIONS ---

/**
 * Finds any active ad video and force-skips it by fast-forwarding to the end.
 * This is the primary ad-skipping mechanism.
 */
const forceSkipAd = () => {
  // Ads on YouTube play in a container with the class 'ad-showing'.
  const adContainer = document.querySelector(".ad-showing")
  if (!adContainer) {
    return // No ad is showing, so we do nothing.
  }

  // Find the actual HTML5 video element within the ad container.
  const adVideo = adContainer.querySelector("video")

  // If we find an ad video and it has a valid duration, skip it.
  if (adVideo && adVideo.duration) {
    // **The Fix:** Don't click. Force the video's time to its end.
    adVideo.currentTime = adVideo.duration
    console.log(
      `Skipper: Force-skipped ad by setting currentTime to ${adVideo.duration}`
    )
  }

  // We also click the button as a backup to help dismiss the ad's UI elements.
  const skipButton = document.querySelector(
    ".ytp-ad-skip-button, .ytp-ad-skip-button-modern"
  )
  if (skipButton) {
    skipButton.click()
  }
}

/**
 * Creates and injects the manual skip button into the player's control bar.
 * It uses YouTube's own styles to ensure it looks perfect.
 */
const insertManualSkipButton = () => {
  // Don't insert button if it's disabled
  if (!manualSkipButtonEnabled) {
    return
  }

  const controlsContainer = document.querySelector(".ytp-right-controls")

  // Stop if the player controls aren't ready or if our button is already there.
  if (
    !controlsContainer ||
    document.getElementById("skipper-manual-force-skip-button")
  ) {
    return
  }

  const manualButton = document.createElement("button")
  manualButton.id = "skipper-manual-force-skip-button"

  // Use YouTube's native class for seamless styling. This is crucial.
  manualButton.className = "ytp-button"
  manualButton.title = "Force Skip Ad"

  // Use the same SVG as YouTube's next button for consistency
  const nextButtonSvg = document.querySelector(".ytp-next-button svg")
  if (nextButtonSvg) {
    // Clone the SVG element
    const clonedSvg = nextButtonSvg.cloneNode(true)
    manualButton.appendChild(clonedSvg)
  } else {
    // Fallback to hardcoded SVG if next button not found
    manualButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36 36" fill="white"><path d="M10 10v16l12-8zM22 10v16h2V10z"/></svg>`
  }

  // Make the button trigger our new force-skip function.
  manualButton.onclick = forceSkipAd

  // Place the button before the "Settings" gear for a consistent position.
  const settingsButton = controlsContainer.querySelector(".ytp-settings-button")
  if (settingsButton) {
    controlsContainer.insertBefore(manualButton, settingsButton)
  }
}

/**
 * Removes the manual skip button from the player's control bar.
 */
const removeManualSkipButton = () => {
  const existingButton = document.getElementById(
    "skipper-manual-force-skip-button"
  )
  if (existingButton) {
    existingButton.remove()
  }
}

// --- MAIN OBSERVER ---

// A single, powerful MutationObserver watches for all changes on the page.
const observer = new MutationObserver(() => {
  // Every time the page updates, we run our functions.
  forceSkipAd() // Check for any ads that need to be skipped.
  insertManualSkipButton() // Check if our button needs to be added to the UI.
})

// Start the observer.
observer.observe(document.body, {
  childList: true,
  subtree: true,
})

console.log("YouTube Ad Skipper: Observer is active and ready.")

// --- TOGGLE FUNCTIONALITY ---

/**
 * Initialize the toggle state from storage
 */
const initializeToggleState = () => {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(["manualSkipButtonEnabled"], (result) => {
      manualSkipButtonEnabled = result.manualSkipButtonEnabled !== false // default to true
      console.log(
        `Manual skip button initialized: ${
          manualSkipButtonEnabled ? "enabled" : "disabled"
        }`
      )

      // If disabled, remove any existing button
      if (!manualSkipButtonEnabled) {
        removeManualSkipButton()
      }
    })
  }
}

/**
 * Handle messages from the background script
 */
const handleMessage = (message, sender, sendResponse) => {
  if (message.action === "toggleManualSkipButton") {
    manualSkipButtonEnabled = message.enabled
    console.log(
      `Manual skip button toggled: ${
        manualSkipButtonEnabled ? "enabled" : "disabled"
      }`
    )

    if (manualSkipButtonEnabled) {
      // Button enabled - it will be inserted by the observer
      insertManualSkipButton()
    } else {
      // Button disabled - remove it
      removeManualSkipButton()
    }

    sendResponse({ success: true })
  }
}

// Listen for messages from background script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener(handleMessage)
}

// Initialize toggle state on page load
initializeToggleState()

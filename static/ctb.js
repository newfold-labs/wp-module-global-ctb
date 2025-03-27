/**
 * Global Click-to-Buy (CTB) Handler
 * Manages CTB modals for product purchase flows with fallback support
 */
(function () {
  let ctbmodal;

  // -------------------------------------------------------------------------
  // Core CTB functionality
  // -------------------------------------------------------------------------

  /**
   * Main handler for CTB clicks
   * @param {Event} e - Click event
   */
  const loadCtb = (e) => {
    // Find the actual CTB element
    const ctbElement = e.target.closest("[data-ctb-id]");
    const ctbId = ctbElement.getAttribute("data-ctb-id");
    const destinationUrl = ctbElement.getAttribute("href");

    // Disable element during loading
    ctbElement.setAttribute("disabled", "true");

    // Create and display modal
    const modal = openModal(e, ctbId);
    const modalWindow = modal.querySelector(".global-ctb-modal-content");
    const modalLoader = modal.querySelector(".global-ctb-loader");

    // Track click event
    ctbClickEvent(e, ctbId);

    // Fetch CTB iframe URL from API
    window
      .fetch(`${window.NewfoldRuntime.restUrl}newfold-ctb/v2/ctb/${ctbId}`, {
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window.NewfoldRuntime.restNonce
        }
      })
      .then((response) => {
        // Re-enable element
        ctbElement.removeAttribute("disabled");

        if (response.ok) {
          return response.json();
        }
        throw Error(response.statusText);
      })
      .then((data) => {
        // Show close button
        modalWindow.querySelector(".global-ctb-modal-close").style.display =
          "flex";

        // Create and load iframe
        const iframe = document.createElement("iframe");
        iframe.src = data.url;
        modalWindow.replaceChild(iframe, modalLoader);
      })
      .catch((error) => {
        displayError(modalWindow, error, ctbElement);
        closeModal();

        // Remove CTB attributes from element
        if (ctbElement) {
          ctbElement.removeAttribute("data-ctb-id");
          ctbElement.removeAttribute("data-action");
        }

        // Fall back to opening destination URL
        window.open(destinationUrl, "_blank", "noopener noreferrer");
      });
  };

  // -------------------------------------------------------------------------
  // Modal management
  // -------------------------------------------------------------------------

  /**
   * Opens the CTB modal
   * @param {Event} e - Click event
   * @param {string} ctbId - CTB identifier
   * @return {HTMLElement} - Modal container
   */
  const openModal = (e, ctbId) => {
    const modalContent = `
			<div class="global-ctb-modal" style="z-index: 100001 !important;">
				<div class="global-ctb-modal-overlay" data-a11y-dialog-destroy></div>
				<div role="document" class="global-ctb-modal-content">
					<div class="global-ctb-modal-close" data-a11y-dialog-destroy style="display:none;">✕</div>
					<div class="global-ctb-loader"></div>
				</div>
			</div>
		`;

    // Create or reuse container
    let ctbContainer = document.getElementById("nfd-global-ctb-container");
    if (ctbContainer) {
      ctbContainer.innerHTML = modalContent;
    } else {
      ctbContainer = document.createElement("div");
      ctbContainer.setAttribute("id", "nfd-global-ctb-container");
      ctbContainer.innerHTML = modalContent;
      document.body.appendChild(ctbContainer);
    }

    // Set container attributes and show modal
    ctbContainer.setAttribute("data-ctb-id", ctbId);
    ctbmodal = new A11yDialog(ctbContainer);
    ctbmodal.show();
    document.querySelector("body").classList.add("noscroll");

    return ctbContainer;
  };

  /**
   * Closes the CTB modal
   */
  const closeModal = () => {
    if (ctbmodal) {
      ctbmodal.destroy();
      document.querySelector("body").classList.remove("noscroll");
    }
  };

  /**
   * Displays error message in modal
   * @param {HTMLElement} modalWindow - Modal window element
   * @param {string|Error} error - Error message or object
   * @param {HTMLElement} ctbElement - CTB element that was clicked
   */
  const displayError = (modalWindow, error, ctbElement) => {
    const message =
      error === "purchase"
        ? "complete the transaction"
        : "load the product information";
    modalWindow.innerHTML = `<div style="text-align:center;">
			<h3>${error}</h3>
			<p>Sorry, we are unable to ${message} at this time.</p>
			<button class="components-button bluehost is-primary" data-a11y-dialog-destroy>Cancel</button>
		</div>`;

    // Remove attributes from clicked element
    if (ctbElement) {
      ctbElement.removeAttribute("data-ctb-id");
      ctbElement.removeAttribute("data-action");
    }
  };

  // -------------------------------------------------------------------------
  // Analytics and context detection
  // -------------------------------------------------------------------------

  /**
   * Tracks CTB click events
   * @param {Event} e - Click event
   * @param {string} ctbId - CTB identifier
   */
  const ctbClickEvent = (e, ctbId) => {
    window.wp.apiFetch({
      url: window.nfdgctb.eventendpoint,
      method: "POST",
      data: {
        action: "ctb_modal_opened",
        data: {
          label_key: "ctb_id",
          ctb_id: ctbId,
          brand: window.nfdgctb.brand,
          context: determineContext(e),
          page: window.location.href
        }
      }
    });
  };

  /**
   * Determines the context of a CTB button
   * @param {Event} e - Click event
   * @return {string} - Context identifier
   */
  const determineContext = (e) => {
    // Check for explicit context attribute
    const ctbElement = e.target.closest("[data-ctb-id]");
    if (ctbElement && ctbElement.hasAttribute("data-ctb-context")) {
      return ctbElement.getAttribute("data-ctb-context");
    }

    // Check for context based on parent elements
    if (e.target.closest(".marketplace-item")) {
      return "marketplace-item";
    }

    if (e.target.closest(".newfold-notifications-wrapper")) {
      return "notification";
    }

    if (e.target.closest(".nfd-root")) {
      return "plugin-app";
    }

    // Default context
    return "external";
  };

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  /**
   * Checks if global CTB is supported
   * @return {boolean} - Whether global CTB is supported
   */
  const supportsGlobalCTB = () => {
    return (
      "NewfoldRuntime" in window &&
      "capabilities" in window.NewfoldRuntime &&
      "canAccessGlobalCTB" in window.NewfoldRuntime.capabilities &&
      window.NewfoldRuntime.capabilities.canAccessGlobalCTB === true
    );
  };

  // -------------------------------------------------------------------------
  // Event listeners
  // -------------------------------------------------------------------------

  /**
   * Set up click event delegation for CTB elements
   */
  document.addEventListener("click", function (event) {
    // Find CTB element
    const ctbElement = event.target.closest("[data-ctb-id]");

    // Handle CTB element clicks
    if (ctbElement && ctbElement.getAttribute("disabled") !== "true") {
      if (supportsGlobalCTB()) {
        event.preventDefault();
        loadCtb(event);
      }
      // Otherwise fall back to default link behavior
    }

    // Handle modal close button clicks
    if (event.target.hasAttribute("data-a11y-dialog-destroy")) {
      closeModal();
    }
  });

  /**
   * Handle iframe resize and close messages
   */
  window.addEventListener("message", function (event) {
    // Only process messages from trusted origins
    if (!event.origin.includes("hiive")) {
      return;
    }

    const iframe = document.querySelector(".global-ctb-modal-content iframe");

    // Handle iframe width adjustments
    if (event.data.type === "frameWidth" && iframe) {
      iframe.style.width = event.data.width;
      iframe.contentWindow.postMessage({ type: "getFrameHeight" }, "*");
    }

    // Handle iframe height adjustments
    if (event.data.type === "frameHeight" && iframe) {
      iframe.style.height = event.data.height;
    }

    // Handle modal close requests
    if (event.data === "closeModal") {
      closeModal();
    }
  });
})();

let scrapedReviews = [];

const scrapeBtn = document.getElementById("scrapeBtn");
const exportBtn = document.getElementById("exportBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const reviewCountEl = document.getElementById("reviewCount");
const formatEl = document.getElementById("format");
const maxReviewsEl = document.getElementById("maxReviews");

function showStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove("hidden");
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

scrapeBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();

  if (!tab.url || !tab.url.includes("google.com/maps")) {
    showStatus("Navigate to a Google Maps business page first.", "error");
    return;
  }

  const maxReviews = parseInt(maxReviewsEl.value, 10);

  showStatus("Scraping reviews… this may take a moment.", "info");
  scrapeBtn.disabled = true;
  exportBtn.disabled = true;
  scrapedReviews = [];

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeReviews,
      args: [maxReviews],
    });

    const data = results[0]?.result;

    if (!data || data.error) {
      showStatus(data?.error || "Failed to scrape reviews.", "error");
      return;
    }

    scrapedReviews = data.reviews;

    if (scrapedReviews.length === 0) {
      showStatus("No reviews found. Make sure the reviews panel is open.", "error");
    } else {
      showStatus(`Found ${scrapedReviews.length} review(s).`, "success");
      reviewCountEl.textContent = `${scrapedReviews.length} review(s) ready to export`;
      previewEl.classList.remove("hidden");
      exportBtn.disabled = false;
    }
  } catch (err) {
    showStatus("Error: " + err.message, "error");
  } finally {
    scrapeBtn.disabled = false;
  }
});

exportBtn.addEventListener("click", () => {
  if (!scrapedReviews.length) return;

  if (formatEl.value === "csv") {
    downloadCSV(scrapedReviews);
  } else {
    downloadJSON(scrapedReviews);
  }
});

function downloadCSV(reviews) {
  const headers = ["reviewer", "rating", "date", "review", "localGuide", "ownerResponse"];
  const rows = reviews.map((r) =>
    headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  download(csv, "reviews.csv", "text/csv");
}

function downloadJSON(reviews) {
  download(JSON.stringify(reviews, null, 2), "reviews.json", "application/json");
}

function download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Injected into the page via chrome.scripting.executeScript
function scrapeReviews(maxReviews) {
  return new Promise((resolve) => {
    const REVIEW_SELECTOR = "[data-review-id]";
    const SCROLL_CONTAINER_SELECTOR = ".m6QErb[data-scroll-hide]";
    const EXPAND_SELECTOR = 'button[jsaction*="pane.review.expandReview"]';

    const scrollContainer = document.querySelector(SCROLL_CONTAINER_SELECTOR);
    if (!scrollContainer) {
      resolve({ error: "Reviews panel not found. Open the reviews tab on a business page." });
      return;
    }

    let lastCount = 0;
    let stableRounds = 0;
    const MAX_STABLE = 5;

    function parseReviews() {
      const nodes = document.querySelectorAll(REVIEW_SELECTOR);
      const reviews = [];

      nodes.forEach((node) => {
        const expandBtn = node.querySelector(EXPAND_SELECTOR);
        if (expandBtn) expandBtn.click();

        const reviewer = node.querySelector(".d4r55")?.textContent?.trim() ?? "";
        const ratingEl = node.querySelector('[role="img"]');
        const ratingText = ratingEl?.getAttribute("aria-label") ?? "";
        const ratingMatch = ratingText.match(/(\d)/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
        const date = node.querySelector(".rsqaWe")?.textContent?.trim() ?? "";
        const review = node.querySelector(".wiI7pd")?.textContent?.trim() ?? "";
        const localGuide = !!node.querySelector(".RfnDt");
        const ownerResponse =
          node.querySelector(".wiI7pd ~ .wiI7pd")?.textContent?.trim() ?? "";

        reviews.push({ reviewer, rating, date, review, localGuide, ownerResponse });
      });

      return reviews;
    }

    const interval = setInterval(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;

      const reviews = parseReviews();
      const currentCount = reviews.length;

      if (maxReviews > 0 && currentCount >= maxReviews) {
        clearInterval(interval);
        resolve({ reviews: reviews.slice(0, maxReviews) });
        return;
      }

      if (currentCount === lastCount) {
        stableRounds++;
        if (stableRounds >= MAX_STABLE) {
          clearInterval(interval);
          resolve({ reviews });
        }
      } else {
        stableRounds = 0;
        lastCount = currentCount;
      }
    }, 1200);
  });
}

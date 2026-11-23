module.exports = {
  ci: {
    collect: {
      staticDistDir: "./",
      maxAutodiscoverUrls: 1,
      numberOfRuns: 2,
      settings: {
        chromeFlags: "--no-sandbox --headless"
      }
    },
    assert: {
      // Informational baseline. Thresholds become release gates after a stable deployment.
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }]
      }
    },
    upload: { target: "filesystem", outputDir: "./lighthouse-results" }
  }
};

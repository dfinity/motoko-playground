const loadMoc = async () => {
  if (typeof self.Motoko === "undefined") {
    const scriptUrl = new URL("/moc.js", self.location.origin);
    const response = await fetch(scriptUrl);
    const scriptContent = await response.text();

    // Create a blob with the script content
    const blob = new Blob([scriptContent], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);

    // Import the blob as a module
    await import(blobUrl);

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  }
  return self.Motoko;
};

export default await loadMoc();

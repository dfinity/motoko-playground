let mocPromise;

export const loadMoc = async () => {
  if (!mocPromise) {
    mocPromise = (async () => {
      const scriptUrl = new URL("/moc.js", self.location.origin);
      const response = await fetch(scriptUrl);
      const scriptContent = await response.text();

      // Execute the script content
      self.eval(scriptContent);

      return self.Motoko;
    })();
  }
  return mocPromise;
};

let Motoko;

const loadMoc = async () => {
  if (!Motoko) {
    const scriptUrl = new URL("/moc.js", self.location.origin);
    const response = await fetch(scriptUrl);
    const scriptContent = await response.text();

    // Execute the script content
    (0, eval)(scriptContent);

    Motoko = self.Motoko;
  }
  return Motoko;
};

export { loadMoc };

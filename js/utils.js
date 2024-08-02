function stringify(obj) {
  let cache = [];
  let s = JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      // Duplicate reference found, discard key
      if (cache.includes(value)) return;

      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // Enable garbage collection
  return s;
}

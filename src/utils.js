export const availableModules = new Map([
  [
    "autoplay",
    {
      name: "Autoplay",
      js: import("swiper/modules"),
      css: import("swiper/css/autoplay"),
    },
  ],
  [
    "pagination",
    {
      name: "Pagination",
      js: import("swiper/modules"),
      css: import("swiper/css/pagination"),
    },
  ],
  [
    "navigation",
    {
      name: "Navigation",
      js: import("swiper/modules"),
      css: import("swiper/css/navigation"),
    },
  ],
  [
    "controller",
    {
      name: "Controller",
      js: import("swiper/modules"),
      css: import("swiper/css/controller"),
    },
  ],
  [
    "effect-fade",
    {
      name: "EffectFade",
      js: import("swiper/modules"),
      css: import("swiper/css/effect-fade"),
    },
  ],
]);

export const tailwindScreenSizes = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const unitModifiers = new Map([
  ["autoplay", true],
  ["loop", true],
  ["cross-fade", true],
  ["no-swiping", true],
  ["slide-to-clicked-slide", true],
  ["auto-height", true],
  ["equal-height", true],
]);

export const customFunctions = new Map([["equalHeight", setEqualHeight]]);

function setEqualHeight(swiper) {
  let slides = swiper.slides;
  let tallestSlide = Math.max(...slides.map((slide) => slide.offsetHeight));
  slides.forEach((slide) => (slide.style.height = `${tallestSlide}px`));
}

/**
 * Parses a JSON string and purifies it by adding quotes around keys and text values,
 * and replacing single quotes with double quotes.
 *
 * @param {string} json - The JSON string to be purified.
 * @returns {object} - The purified JSON object.
 */
export function purifyJSON(json) {
  return JSON.parse(
    json
      .replace(/([a-zA-Z0-9]+):/g, '"$1":') // Add quotes around keys
      .replace(/:([a-zA-Z0-9]+)/g, ':"$1"') // Add quotes around text values
      .replace(/'/g, '"') // Replace single quotes with double quotes
  );
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @param {string} str - The snake_case string to convert.
 * @returns {string} The camelCase version of the input string.
 */
export function snakeCaseToCamelCase(str) {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

/**
 * Parses a value based on the given key.
 * @param {string} key - The key to determine how to parse the value.
 * @param {string} value - The value to be parsed.
 * @returns {number|string} - The parsed value.
 */
export function parseValue(key, value) {
  if (unitModifiers.has(key)) {
    return unitModifiers.get(key);
  }

  if (value.includes("_")) {
    return convertIfNumber(value.replace("_", "."));
  }

  if (key === "duration") {
    // Support .duration.500ms && duration.500
    let match = value.match(/([0-9]+)ms/);
    if (match) return match[1];
  }

  return convertIfNumber(value);
}

/**
 * Converts a value to a number if possible.
 * If the value is already a number, it returns the value unchanged.
 * If the value is not a number, it returns the value as is.
 * @param {*} value - The value to be converted.
 * @returns {number|*} - The converted value.
 */
export function convertIfNumber(value) {
  let number = !isNaN(value) ? Number(value) : value;
  return number;
}

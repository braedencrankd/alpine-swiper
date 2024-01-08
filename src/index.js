import Swiper from "swiper";
import {
  Autoplay,
  Navigation,
  Pagination,
  Controller,
  EffectFade,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import "swiper/css/controller";
import "swiper/css/effect-fade";

const tailwindScreenSizes = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

const unitModifiers = new Map([
  ["autoplay", true],
  ["loop", true],
  ["cross-fade", true],
  ["no-swiping", true],
  ["slide-to-clicked-slide", true],
  ["auto-height", true],
]);

const directiveFunctions = new Map([
  ["control", setControllerOptions],
  ["sync", syncSliders],
  ["navigation", setupNavigationOptions],
  ["sm", setupResponsiveOptions],
  ["md", setupResponsiveOptions],
  ["lg", setupResponsiveOptions],
  ["xl", setupResponsiveOptions],
  ["2xl", setupResponsiveOptions],
]);

export default function (Alpine) {
  Alpine.directive(
    "swiper",
    (el, { modifiers, value, expression }, { cleanup }) => {
      let swiper = null;

      function init() {
        // We don't need to do anything if the value is a defined function for this directive
        if (isDirectiveFunction(value)) return;

        Swiper.use([Autoplay, Pagination, Navigation, Controller, EffectFade]);

        el.classList.add("swiper");

        if (!el.hasAttribute("x-swiper:control")) {
          createSwiper();
          return;
        }

        deferSwiperCreation();
      }

      init();

      cleanup(() => {
        if (swiper) {
          swiper.destroy();
          swiper = null;
        }
      });

      function deferSwiperCreation() {
        window.addEventListener("swiper-created", function (event) {
          // listen for the controlled swiper to be created
          if (
            event.detail.swiper.el.id === el.getAttribute("x-swiper:control")
          ) {
            createSwiper();
          }
        });
      }

      function createSwiper() {
        swiper = new Swiper(el, {
          on: {
            init: function (swiper) {
              const swiperCreated = new CustomEvent("swiper-created", {
                detail: {
                  swiper,
                },
              });
              window.dispatchEvent(swiperCreated);
            },
          },

          // // And if we need scrollbar
          scrollbar: {
            el: el.querySelector(".swiper-scrollbar") ?? null,
          },
          loopAddBlackSlide: true,
          ...createOptions(el, modifiers),
        });

        // find child element with .swiper-active-index then set the real index to it
        const activeIndex = document.querySelector(".swiper-current-index");
        if (activeIndex) {
          activeIndex.textContent = (swiper.realIndex + 1)
            .toString()
            .padStart(2, "0");
        }

        const swiperChanged = new CustomEvent("swiper-changed", {
          detail: {
            swiper,
          },
        });

        swiper.on("activeIndexChange", function () {
          if (activeIndex) {
            activeIndex.textContent = ((swiper.activeIndex % 4) + 1)
              .toString()
              .padStart(2, "0");
          }
          window.dispatchEvent(swiperChanged);
        });
      }
    }
  );

  function isDirectiveFunction(functionName) {
    return directiveFunctions.has(functionName);
  }

  /*
   * @param {Array} modifiers
   * @returns object
   *
   * Creates an options object based on an array of modifiers,
   * pairing adjacent elements and processing them accordingly,
   * such as converting values to  numbers and organizing breakpoints.
   */
  function createOptions(el, modifiers) {
    let unitOffset = 0;

    const pairedModifiers = modifiers.reduce((acc, modifier, index) => {
      // Whenever we have a unit modifier, we need to offset the index by 1
      let isUnitModifier = unitModifiers.has(modifier);

      if (isUnitModifier) {
        acc.push([modifier, unitModifiers.get(modifier)]);
        unitOffset++;
        return acc;
      }

      if ((index + unitOffset) % 2 === 0) {
        acc.push([modifier, modifiers[index + 1]]);
      }
      return acc;
    }, []);

    let options = pairedModifiers.reduce((acc, modifier, index) => {
      const [key, value] = modifier;

      // If the modifier is a breakpoint, add it to the breakpoints object.
      if (key.indexOf(":") > -1) {
        const breakpoint = key.split(":")[0];
        const breakpointKey = snakeCaseToCamelCase(key.split(":")[1]);

        if (!acc.breakpoints) acc.breakpoints = {};

        if (!acc.breakpoints[tailwindScreenSizes[breakpoint]]) {
          acc.breakpoints[tailwindScreenSizes[breakpoint]] = {};
        }

        // check if the value can be parsed as a number

        acc.breakpoints[tailwindScreenSizes[breakpoint]][breakpointKey] =
          parseValue(key, value);
        return acc;
      }

      acc[snakeCaseToCamelCase(key)] = parseValue(key, value);

      return acc;
    }, {});

    // Check for any directive functions and run them
    directiveFunctions.forEach((fn, key) => {
      if (el.hasAttribute(`x-swiper:${key}`)) {
        switch (key) {
          case "control":
            options = { ...options, ...fn(el.getAttribute(`x-swiper:${key}`)) };
            break;
          case "sync":
            fn(el.getAttribute(`x-swiper:${key}`));
            break;
          case "navigation":
            options = { ...options, ...fn(el.getAttribute(`x-swiper:${key}`)) };
            break;
          case "sm" || "md" || "lg" || "xl" || "2xl":
            options = {
              ...options,
              ...fn(el.getAttribute(`x-swiper:${key}`), key),
            };
            break;
          default:
            break;
        }
      }
    });

    return options;
  }

  function convertIfNumber(value) {
    let number = !isNaN(value) ? Number(value) : value;
    return number;
  }

  function snakeCaseToCamelCase(str) {
    return str.replace(/([-_][a-z])/g, (group) =>
      group.toUpperCase().replace("-", "").replace("_", "")
    );
  }

  function parseValue(key, value) {
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
}

/**
 *
 * @param {HTMLElement} rootEl
 * @param {Number} swiperId
 * @returns object
 *
 * Creates options for any controlled swipers
 * For now this only works for a single controlled swiper
 */
function setControllerOptions(swiperId) {
  // get swiper instance from id
  const swiper = document.querySelector(`#${swiperId}`);

  return {
    controller: {
      by: "slide",
      control: `#${swiperId}`,
    },
  };
}

function setupResponsiveOptions(options, size) {
  const breakpoints = purifyJSON(options);

  return {
    breakpoints: {
      [tailwindScreenSizes[size]]: {
        ...breakpoints,
      },
    },
  };
}

function setupNavigationOptions(options) {
  const navigation = purifyJSON(options);

  return {
    navigation: {
      nextEl: navigation.nextEl ?? ".swiper-button-next",
      prevEl: navigation.prevEl ?? ".swiper-button-prev",
    },
  };
}

/**
 * @param {HTMLElement} rootEl
 * @param {String} swiperId
 * @returns object
 *
 * Syncs to sliders by responding to each others change events
 */

function syncSliders(swiperId) {
  const swiperEl = document.querySelector(`#${swiperId}`);

  if (!swiperEl) return;

  window.addEventListener("swiper-changed", function (event) {
    swiperEl.swiper.slideTo(event.detail.swiper.realIndex);
  });
}

function purifyJSON(json) {
  return JSON.parse(
    json
      .replace(/([a-zA-Z0-9]+):/g, '"$1":') // Add quotes around keys
      .replace(/:([a-zA-Z0-9]+)/g, ':"$1"') // Add quotes around text values
      .replace(/'/g, '"') // Replace single quotes with double quotes
  );
}

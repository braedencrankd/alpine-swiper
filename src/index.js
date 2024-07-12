import Swiper from "swiper";
import { Navigation, Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";

import {
  availableModules,
  tailwindScreenSizes,
  unitModifiers,
  purifyJSON,
  snakeCaseToCamelCase,
  parseValue,
  customFunctions,
} from "./utils";

const directiveFunctions = new Map([
  ["control", setControllerOptions],
  ["sync", syncSliders],
  ["navigation", setupNavigationOptions],
  ["autoplay", setupAutoplayOptions],
]);

export default function (Alpine) {
  Alpine.directive(
    "swiper",
    (el, { modifiers, value, expression }, { cleanup, evaluate }) => {
      let swiper = null;

      const init = async () => {
        // We don't need to do anything if the value is a defined function for this directive
        if (isDirectiveFunction(value)) return;

        el.classList.add("swiper");

        if (!el.hasAttribute("x-swiper:control")) {
          await createSwiper(expression);
          return;
        }

        await deferSwiperCreation();
      };

      init();

      cleanup(() => {
        if (swiper) {
          swiper.destroy();
          swiper = null;
        }
      });

      async function deferSwiperCreation() {
        window.addEventListener("swiper-created", async function (event) {
          // listen for the controlled swiper to be created
          if (
            event.detail.swiper.el.id === el.getAttribute("x-swiper:control")
          ) {
            await createSwiper();
          }
        });
      }

      /**
       * Creates a Swiper instance with the given expression or modifier options.
       * If the expression is provided, it will be used as the default options.
       * Otherwise, the modifier options will be used if they exist.
       * @param {string} expression - The expression to evaluate as options.
       * @returns {Promise<void>} - A promise that resolves when the Swiper instance is created.
       */
      async function createSwiper(expression) {
        // Use the expression as the default otherwise use the modifiers if they exist
        const options =
          expression !== ""
            ? evaluate(expression)
            : createModifierOptions(el, modifiers);

        swiper = new Swiper(el, {
          on: {
            init: function (swiper) {
              const swiperCreated = new CustomEvent("swiper-created", {
                detail: {
                  swiper,
                },
              });
              window.dispatchEvent(swiperCreated);

              customFunctions.forEach((fn, key) => {
                if (options[key]) {
                  fn(swiper);
                }
              });
            },
          },

          // // And if we need scrollbar
          scrollbar: {
            el: el.querySelector(".swiper-scrollbar") ?? null,
          },
          loopAddBlackSlide: true,
          ...options,
        });

        Swiper.use([Navigation, Autoplay, Pagination, EffectFade]);
      }
    }
  );

  /**
   * Imports modules based on the provided options.
   *
   * @param {Object} options - The options object containing the modules to import.
   * @returns {Promise<void>} - A promise that resolves when all modules are imported.
   */
  async function importModules(options) {
    const modules = Object.keys(options).filter((option) =>
      availableModules.has(option)
    );

    for (let module of modules) {
      let { js, css, name } = await availableModules.get(module);

      let moduleBundle = await js;

      let swiperModule = moduleBundle[name];

      Swiper.use([swiperModule]);

      // Load the CSS if necessary
      if (css) {
        css.then((module) => {
          module.default;
        });
      }
    }
  }

  /**
   * Checks if a given function name is a directive function.
   *
   * @param {string} functionName - The name of the function to check.
   * @returns {boolean} - True if the function is a directive function, false otherwise.
   */
  function isDirectiveFunction(functionName) {
    return directiveFunctions.has(functionName);
  }

  /**
   * @param {HTMLElement} rootEl
   * @param {Array} modifiers
   * @returns object
   *
   * Creates an options object based on an array of modifiers,
   * pairing adjacent elements and processing them accordingly,
   * such as converting values to  numbers and organizing breakpoints.
   */
  function createModifierOptions(el, modifiers) {
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
          case "autoplay":
            options = { ...options, ...fn(el.getAttribute(`x-swiper:${key}`)) };
            break;
          default:
            break;
        }
      }
    });

    return options;
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

/**
 * Sets up navigation options for the Swiper component.
 * @param {Object} options - The navigation options.
 * @returns {Object} - The configured navigation options.
 */
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
 * Sets up autoplay options for the swiper.
 *
 * @param {Object} options - The autoplay options.
 * @returns {Object} - The autoplay options object.
 */
function setupAutoplayOptions(options) {
  const autoplay = purifyJSON(options);

  console.log("autoplay", autoplay);
  return {
    autoplay: {
      delay: autoplay.delay ?? 5000,
      disableOnInteraction: autoplay.disableOnInteraction ?? false,
      pauseOnMouseEnter: autoplay.pauseOnMouseEnter ?? false,
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

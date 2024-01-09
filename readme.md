# alpine-swiper

**DISCLAIMER: This package is still in active development and is not ready for production use. I'm open to any suggestions on improving this package.**

An AlpineJS plugin to create a SwiperJS slider using the elegance alpine directives.

## Resources

- [Swiper JS](https://swiperjs.com/)
- [Alpine JS](https://alpinejs.dev/)

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Modifiers Syntax](#modifiers-syntax)
  - [Config Object Syntax](#config-object-syntax)
- [Available Swiper Modules](#available-swiper-modules)

## Installation

To install the "alpine-swiper" package, you can use npm, pnpm or yarn. Run the following command in your project directory:

```bash
npm install alpine-swiper
# or
yarn add alpine-swiper
# or
pnpm add alpine-swiper
```

## Setup

Import the `alpine-swiper` plugin in your project entry point.

```js
import alpineSwiper from "alpine-swiper";
Alpine.plugin(alpineSwiper);
```

## Usage

### Basic Usage

Define the `x-swiper` directive on the swiper container element.
Inside the container element, you must define a wrapper element with the class `swiper-wrapper`. Each child element can be defined as a slide using the class `swiper-slide`.

_**Note:** make sure to add the `x-init` or `x-data` directive to the container element to ensure the swiper is initialized when Alpine is loaded._

```html
<div x-init>
  <div x-swiper>
    <!-- Additional required wrapper -->
    <div class="swiper-wrapper">
      <!-- Slides -->
      <div class="swiper-slide">Slide 1</div>
      <div class="swiper-slide">Slide 2</div>
      <div class="swiper-slide">Slide 3</div>
      <div class="swiper-slide">Slide 4</div>
    </div>
  </div>
</div>
```

### Modifiers Syntax

Use the `x-swiper` directive to initialize the swiper component.

The simplist way to configure the slider is to use modifiers. The following example will create a slider with 3 slides per view, space between slides of 20px.

```html
<div x-swiper.space-between.20.slides-per-view.3>...</div>
```

You can also define the breakpoints for the slider using modifiers. The following example will create a slider with 3 slides per view, space between slides of 20px on screens larger than 640px, and 1 slide per view, space between slides of 10px on screens smaller than 640px.

```html
<div x-swiper.space-between.20.slides-per-view.1.lg:slides-per-view.3>...</div>
```

Each modifier usually has a following modifier to define the value.
Eg. `slides-per-view.1` or `slides-per-view.3`.

Properties that are booleans are defined without a value for brevity.
Eg. `loop` or `autoplay`.

_Note: Each modifier corresponds to the options defined by the SwiperJS package: the documentation can be found [here](https://swiperjs.com/swiper-api)._

### Config Object Syntax

Alternativly you can use the `x-swiper` directive with a config object. The following example will create a slider with 3 slides per view, space between slides of 20px.

```html
<div x-swiper="{ spaceBetween: 20, slidesPerView: 3 }">...</div>
```

## Available Swiper Modules

Only some of the SwiperJS modules are available for now. The following modules are listed below:

- [Navigation](https://swiperjs.com/swiper-api#navigation)
- [Pagination](https://swiperjs.com/swiper-api#pagination)
- [Autoplay](https://swiperjs.com/swiper-api#autoplay)
- [Controller](https://swiperjs.com/swiper-api#controller)
- [Effect Fade](https://swiperjs.com/swiper-api#effect-fade)

These modules can be used by there associated properties.
For example autoplay can be used by addding the `autoplay` modifier to the `x-swiper` directive.

```html
<div x-swiper.autoplay>...</div>
```

The swiper navigation buttons can be added by adding an additional `navigation` directive type.

```html
<div
  x-swiper
  x-swiper:navigation="{
      nextEl: '.product-swiper-next',
      prevEl: '.product-swiper-prev'
    }"
>
  ...
</div>
```

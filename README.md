<a href="https://newfold.com/" target="_blank">
    <img src="https://newfold.com/content/experience-fragments/newfold/site-header/master/_jcr_content/root/header/logo.coreimg.svg/1621395071423/newfold-digital.svg" alt="Newfold Logo" title="Newfold Digital" align="right" 
height="42" />
</a>

# WordPress Global CTB Module

[![Version Number](https://img.shields.io/github/v/release/newfold-labs/wp-module-global-ctb?color=21a0ed&labelColor=333333)](https://github.com/newfold-labs/wp-module-global-ctb/releases)
[![Lint](https://github.com/newfold-labs/wp-module-global-ctb/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/newfold-labs/wp-module-global-ctb/actions/workflows/lint.yml)
[![License](https://img.shields.io/github/license/newfold-labs/wp-module-global-ctb?labelColor=333333&color=666666)](https://raw.githubusercontent.com/newfold-labs/wp-module-global-ctb/master/LICENSE)

Newfold module for 'Click to Buy' functionality in brand plugins.

## Module Responsibilities

- Detect clicks on elements with a `ctb-id` attribute if the user has the `canAccessGlobalCTB` capability.
  - These elements are in the marketplace section, notification banners, and even other plugins.
- Open a purchase modal window for the specific CTB id.
- The purchase window shows the same CTB MFE as in the hosting account manager with integrated payment to the hosting account.

## Critical Paths

- A user has the `canAccessGlobalCTB` capability, a CTB link should open a CTB modal and allow purchase.
- A user does not have the `canAccessGlobalCTB` capability, a CTB link should not open a modal but the fallback link should open a new tab.

## Installation

### 1. Add the Newfold Satis to your `composer.json`.

 ```bash
 composer config repositories.newfold composer https://newfold-labs.github.io/satis
 ```

### 2. Require the `newfold-labs/wp-module-global-ctb` package.

 ```bash
 composer require newfold-labs/wp-module-global-ctb
 ```

[More on Newfold WordPress Modules](https://github.com/newfold-labs/wp-module-loader)

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
  Possible subsections:
    _Added_ for new features.
    _Changed_ for changes in existing functionality.
    _Deprecated_ for soon-to-be removed features.
    _Removed_ for now removed features.
    _Fixed_ for any bug fixes.
    _Security_ in case of vulnerabilities.
 -->

## Unreleased

## [0.22.6](https://github.com/o1-labs/zkapp-cli/compare/0.22.5...0.22.6) - 2025-02-18

## [0.22.5](https://github.com/o1-labs/zkapp-cli/compare/v0.22.4...v0.22.5) - 2025-02-07

## [0.22.4](https://github.com/o1-labs/zkapp-cli/compare/v0.22.3...v0.22.4) - 2025-01-29

### Added

- Allow overriding the slot time for lightnet. [#718](https://github.com/o1-labs/zkapp-cli/pull/718)

## [0.22.2](https://github.com/o1-labs/zkapp-cli/compare/v0.22.1...v0.22.2) - 2024-12-01

### Changed

- Add interactivity to Next.js starter app ui. [#709](https://github.com/o1-labs/zkapp-cli/pull/709)

## [0.22.1](https://github.com/o1-labs/zkapp-cli/compare/v0.22.0...v0.22.1) - 2024-11-17

### Changed

- Resolved deprecation warning caused by older version of `whatwg-url`'s dependency on `punycode` library

## [0.22.0](https://github.com/o1-labs/zkapp-cli/compare/v0.21.6...v0.22.0) - 2024-10-23

### Changed

- Release `0.22.0` corresponding with o1js [release](https://github.com/o1-labs/o1js/pull/1881) `2.0.0`. [#702](https://github.com/o1-labs/zkapp-cli/pull/702)
  - o1js minor version dependency updated in cli package.json to `^2.*`\*.
  - o1js minor version peer dependency updated in template/example contract package.json to `^2.*`\*.

## [0.21.8](https://github.com/o1-labs/zkapp-cli/compare/0.21.7...0.21.8) - 2024-10-23

### Changed

- Svelte project scaffold now uses latest `sv create` and sources migrated to `Svelte 5`. [#701](https://github.com/o1-labs/zkapp-cli/pull/701)

## [0.21.7](https://github.com/o1-labs/zkapp-cli/compare/0.21.6...0.21.7) - 2024-10-01

### Changed

- Updated Next.js project starter to use app router and skip `src` directory
- Forces TS in Next.js projects

## [0.21.6](https://github.com/o1-labs/zkapp-cli/compare/0.21.5...0.21.6) - 2024-09-03

### Fixed

- Fixed zkProgramFile to support nested paths. [#690](https://github.com/o1-labs/zkapp-cli/pull/690)
- Fixed o1js dependency issue for next js server [#693](https://github.com/o1-labs/zkapp-cli/pull/693)

## [0.21.5](https://github.com/o1-labs/zkapp-cli/compare/0.21.4...0.21.5) - 2024-06-06

### Changed

- Improved the NPM packaging and changed the way sources are fetched during the project generation. [#662](https://github.com/o1-labs/zkapp-cli/pull/662)
  - Generic project and example templates are now fetched from the locally installed `zkapp-cli` package path (local file system copy).

## [0.21.4](https://github.com/o1-labs/zkapp-cli/compare/0.21.3...0.21.4) - 2024-06-06

### Fixed

- Fixed the Next.js configuration. [#656](https://github.com/o1-labs/zkapp-cli/pull/656)

## [0.21.3](https://github.com/o1-labs/zkapp-cli/compare/0.21.2...0.21.3) - 2024-05-20

### Fixed

- Fixed the deployment procedure for zkApps that use `o1js` of version < `v1.0.1` and that use local imports without the `.js` extension. [#654](https://github.com/o1-labs/zkapp-cli/pull/654)

## [0.21.2](https://github.com/o1-labs/zkapp-cli/compare/0.21.0...0.21.2) - 2024-05-20

### Changed

- Migrate **Next.js** UI scaffold to **Next.js** `v14.2.3` and fix the latest `o1js` usage issue. [#652](https://github.com/o1-labs/zkapp-cli/pull/652)

## [0.21.0](https://github.com/o1-labs/zkapp-cli/compare/0.20.1...0.21.0) - 2024-05-16

### Breaking changes

- NodeJS minimum version changed in order to reflect the `o1js` requirements. [#641](https://github.com/o1-labs/zkapp-cli/pull/641)

### Changed

- Update ZkProgram proof detection during deployment [#649](https://github.com/o1-labs/zkapp-cli/pull/649)
- Improved `SmartContract` classes inheritance lookup used during the zkApps deployment procedure. [#640](https://github.com/o1-labs/zkapp-cli/pull/640)

### Fixed

- Handle case when ZkProgram name argument is in double quotes during deployment [#649](https://github.com/o1-labs/zkapp-cli/pull/649)

## [0.20.2](https://github.com/o1-labs/zkapp-cli/compare/0.20.1...0.20.2) - 2024-05-07

### Fixed

- [Hotfix] SmartContract classes lookup for deployment. [#637](https://github.com/o1-labs/zkapp-cli/pull/637)

## [0.20.1](https://github.com/o1-labs/zkapp-cli/compare/0.20.0...0.20.1) - 2024-04-30

### Added

- Extend information printed during deployment procedure. [#631](https://github.com/o1-labs/zkapp-cli/pull/631)
- Add ASCII o1Labs logo to zk help menu. [#620](https://github.com/o1-labs/zkapp-cli/pull/620)

### Fixed

- Fix for Faucet URL. [#631](https://github.com/o1-labs/zkapp-cli/pull/631)

## [0.20.0](https://github.com/o1-labs/zkapp-cli/compare/v19.0...v20.0) - 2024-04-22

- The CLI, templates, and examples have been updated to be compatible with the latest version `1.0.0` of `o1js`. This includes updating all instances of Mina.LocalBlochain() and Proof.fromJSON() to be async. [#623](https://github.com/o1-labs/zkapp-cli/pull/623)

## [0.19.0](https://github.com/o1-labs/zkapp-cli/compare/v18.0...v19.0) - 2024-04-09

### Breaking changes

- The CLI, templates, and examples have been updated to be compatible with the latest version `0.18.0` of `o1js` that was released to be compatible with the `Devnet` upgrade. This includes updating all code with async circuits, and removing all deprecated APIs. [#606](https://github.com/o1-labs/zkapp-cli/pull/606)

### Changed

- Add support to deploy smart contracts that verify ZkProgram proofs. [#547](https://github.com/o1-labs/zkapp-cli/pull/547)
- Remove `node-fetch` dependency in favor of NodeJS native fetch. [#602](https://github.com/o1-labs/zkapp-cli/pull/602)

### Fixed

- Issue when `zk system` command did not reported the `zkapp-cli` version on Windows. [#612](https://github.com/o1-labs/zkapp-cli/pull/612)

## [0.18.0](https://github.com/o1-labs/zkapp-cli/compare/v17.2...v18.0) - 2024-03-06

### Breaking changes

- Lightnet error and edge cases handling. [#597](https://github.com/o1-labs/zkapp-cli/pull/597)
  - We removed common `--debug` CLI option in favor of [DEBUG](https://www.npmjs.com/package/debug) environment variable presence.
  - From now on, in order to enable debug logging, you must set `DEBUG` environment variable to `<namespace>` value.
    - Where `<namespace>` can be one of the following:
      - `*`
      - `zk:*`
      - `zk:lightnet`
    - Example: `DEBUG=zk:lightnet zk lightnet start`
    - For details about the `DEBUG` environment variable, see Debug [Usage](https://www.npmjs.com/package/debug#usage).
  - This improved debug logging capabilities can be leveraged with other parts of the zkApp CLI in the future.

### Changed

- Improve CLI error handling. [#591](https://github.com/o1-labs/zkapp-cli/pull/591)

## [0.17.2](https://github.com/o1-labs/zkapp-cli/compare/v17.1...v17.2) - 2024-02-19

### Changed

- Improve error handling when imported smart contract is not found. [#586](https://github.com/o1-labs/zkapp-cli/pull/586)

## [0.17.1](https://github.com/o1-labs/zkapp-cli/compare/v17.0...v17.1) - 2024-02-17

### Changed

- Update `getCachedFeepayerAliases()` logic to prevent edge case bugs. [#581](https://github.com/o1-labs/zkapp-cli/pull/581)
- Improve error handling for zk deploy when fee payer has insufficient permissions. [#580](https://github.com/o1-labs/zkapp-cli/pull/580)
- Automate "zk config" if Lightnet is in use. [#579](https://github.com/o1-labs/zkapp-cli/pull/579)
  - The `--lightnet` option was added to `zk config` in order to automatically configures zkApp project's deploy aliases.
  - The [Lightnet](https://docs.minaprotocol.com/zkapps/testing-zkapps-lightnet) should be up and running before executing the `zk config --lightnet` command.
- Allow to use locally available lightweight Mina explorer in case of network issues. [#577](https://github.com/o1-labs/zkapp-cli/pull/577)

## [0.17.0](https://github.com/o1-labs/zkapp-cli/compare/v16.2...v17.0) - 2024-02-03

### Changed

- Bump minor version to 0.17.0. [#574](https://github.com/o1-labs/zkapp-cli/pull/574)

## [0.16.2](https://github.com/o1-labs/zkapp-cli/compare/v16.1...v16.2) - 2024-02-03

### Changed

- Update project scaffold tsconfig to handle esnext and es2022 targets. [#570](https://github.com/o1-labs/zkapp-cli/pull/570)
- Dependencies updated. [#573](https://github.com/o1-labs/zkapp-cli/pull/573)

## [0.16.1](https://github.com/o1-labs/zkapp-cli/compare/v16.0...v16.1) - 2024-02-01

### Added

- Possibility to configure the target network to testnet or mainnet during the `zk config` process. [#564](https://github.com/o1-labs/zkapp-cli/pull/564)

## [0.16.0](https://github.com/o1-labs/zkapp-cli/compare/v15.2...v16.0) - 2023-12-11

### Added

- Possibility to configure the `lightnet` Mina processes logging level. [#536](https://github.com/o1-labs/zkapp-cli/pull/536)

### Changed

- Updates the Github Pages UI scaffold deploy flow configuration in the `next.config.js` to be compatible with the current version of NextJS. [#534](https://github.com/o1-labs/zkapp-cli/pull/534)

### Fixed

- Fix to allow a deployment to Github Pages using the npm run deploy command in a NextJS UI project[#534](https://github.com/o1-labs/zkapp-cli/pull/534).

## [0.15.2](https://github.com/o1-labs/zkapp-cli/compare/v15.1...v15.2) - 2023-12-04

### Added

- Lightnet sub-commands implementation (`explorer`). [#521](https://github.com/o1-labs/zkapp-cli/pull/521)

## [0.15.1](https://github.com/o1-labs/zkapp-cli/compare/v15.0...v15.1) - 2023-11-29

### Added

- Lightnet sub-commands implementation (`logs`). [#520](https://github.com/o1-labs/zkapp-cli/pull/520)

## [0.15.0](https://github.com/o1-labs/zkapp-cli/compare/v14.1...v15.0) - 2023-11-07

### Added

- Lightnet sub-commands implementation (`start`/`stop`/`status`). [#510](https://github.com/o1-labs/zkapp-cli/pull/510)

## [0.14.1](https://github.com/o1-labs/zkapp-cli/compare/v14.0...v14.1) - 2023-11-03

### Changed

- Explorer links for deployment and interaction transactions. [#516](https://github.com/o1-labs/zkapp-cli/pull/516)

## [0.14.0](https://github.com/o1-labs/zkapp-cli/compare/v13.2...v14.0) - 2023-10-31

### Changed

- Release `0.14.0` corresponding with o1js [release](https://github.com/o1-labs/o1js/pull/1209) `0.14.0`. The o1js release includes constraint optimizations in Field methods and core crypto changes that break all verification keys. All contracts need to be redeployed. See the docs for more guidance on [deploying](https://docs.minaprotocol.com/zkapps/how-to-deploy-a-zkapp) contracts. [#514](https://github.com/o1-labs/zkapp-cli/pull/514)
  - o1js minor version dependency updated in cli package.json to 0.14.\*.
  - o1js minor version peer dependency updated in template/example contract package.json to 0.14.\*.

## [0.13.2](https://github.com/o1-labs/zkapp-cli/compare/v0.13.0...v13.2) - 2023-10-22

### Changed

- The husky pre-commit hooks configuration steps during project generation with an accompanying UI project were removed. [#507](https://github.com/o1-labs/zkapp-cli/pull/507).

## [0.13.1] - 2022-10-20

### Changed

- This PR removes Husky and the pre-commit hooks from the project templates to remove friction and create a better DX when building zkApps. [#505](https://github.com/o1-labs/zkapp-cli/pull/505).

## [0.13.0](https://github.com/o1-labs/zkapp-cli/compare/v0.12.1...v0.13.0) - 2023-09-14

### Changed

- Release `0.13.0` corresponding with o1js [release](https://github.com/o1-labs/o1js/pull/1123) `0.13.0`. The o1js release includes changes to verification keys caused by updates to the proof system, which breaks all deployed contracts. [#492](https://github.com/o1-labs/zkapp-cli/pull/492)
  - o1js minor version dependency updated in cli package.json to 0.13.\*.
  - o1js minor version peer dependency updated in template/example contract package.json to 0.13.\*.

## [0.12.1](https://github.com/o1-labs/zkapp-cli/compare/v0.12.0...v0.12.1) - 2023-09-09

### Changed

- Both local and global installed versions are checked to determine if an update of the zkApp-cli is necessary[#448](https://github.com/o1-labs/zkapp-cli/pull/448).

### Fixed

- Fix to allow the zkApp-cli to be used from a projects local node_modules[#448](https://github.com/o1-labs/zkapp-cli/pull/448).

## [0.12.0](https://github.com/o1-labs/zkapp-cli/compare/v0.11.2...v0.12.0) - 2023-09-09

### Changed

- Project migrated to ESM [#447](https://github.com/o1-labs/zkapp-cli/pull/447).

### Added

- E2E tests for critical user flows against mocked and real networks [#447](https://github.com/o1-labs/zkapp-cli/pull/447).

## [0.11.2](https://github.com/o1-labs/zkapp-cli/compare/v0.11.0...v0.11.2) - 2023-09-05

### Changed

- Update all instances of `SnarkyJS` to `o1js` throught the CLI to coincide with the rebrand of the package [#481](https://github.com/o1-labs/zkapp-cli/pull/481)

## [0.11.1] - 2023-08-16

### Added

- A post build script was added to prepend a project repo name to built css asset urls so a NextJS UI project can be correctly deployed to GitHub Pages [#468](https://github.com/o1-labs/zkapp-cli/pull/468)

### Fixed

- A fix to deploy a NextJS UI project to GitHub Pages without manual configuration by running `npm run deploy` [#468](https://github.com/o1-labs/zkapp-cli/pull/468)

## [0.11.0](https://github.com/o1-labs/zkapp-cli/compare/v0.10.2...v0.11.0) - 2023-07-14

### Changed

- Release `0.11.0` [#459](https://github.com/o1-labs/zkapp-cli/pull/459)
  - o1js minor version dependency updated in cli package.json to 0.12.\*.
  - o1js minor version peer dependency updated in template/example contract package.json to 0.12.\*.

## [0.10.2](https://github.com/o1-labs/zkapp-cli/compare/v0.10.1...v0.10.2) - 2023-07-09

### Changed

- Welcome page getting started text changed for the zkApp project generated with the `NextJS` UI framework ([#450](https://github.com/o1-labs/zkapp-cli/issues/450))

## Fixed

- Fix for zkApp project generation with `Nuxt` UI framework issue ([#449](https://github.com/o1-labs/zkapp-cli/issues/449))

## [0.10.1](https://github.com/o1-labs/zkapp-cli/compare/v0.10.0...v0.10.1) - 2023-06-22

### Changed

- Update cli prompt language and upgrade version instructions [#437](https://github.com/o1-labs/zkapp-cli/pull/437) & [#438](https://github.com/o1-labs/zkapp-cli/pull/438)

## [0.10.0](https://github.com/o1-labs/zkapp-cli/compare/v0.9.1...v0.10.0) - 2023-06-20

## Added

- Third-party fee payer accounts for deployment transactions can be used across multiple projects [#424](https://github.com/o1-labs/zkapp-cli/pull/424)
  - A new `zk config` option creates or selects a third-party fee payer account.

## Fixed

- A fee payer tries to pay the fee using signature authorization (proofs are not supported). If the zkApp account is used as fee payer after deployment, the transaction was rejected because the permissions of the account would be violated, breaking all re-deployments and the interact.ts script in the template project. [#424](https://github.com/o1-labs/zkapp-cli/pull/424)

## [0.9.1](https://github.com/o1-labs/zkapp-cli/compare/v0.1.4...v0.9.1) - 2023-06-17

### Changed

- Update the Svelte UI scaffold vite config. [#432] (https://github.com/o1-labs/zkapp-cli/pull/432)

## [0.9.0] - 2023-06-06

### Changed

- Release `0.9.0` [#426](https://github.com/o1-labs/zkapp-cli/pull/426)
  - o1js minor version dependency updated in cli package.json to 0.11.\*.
  - o1js minor version peer dependency updated in template/example contract package.json to 0.11.\*.
  - Replace deprecated `Circuit.if` with `Provable.if` in the `tictactoe` example.
  - Replace deprecated `Circuit.array` with `Provable.Array` in the `sudoku` example.

## [0.8.2] - 2023-05-12

### Changed

- Clean up deploy and log full errors to the console. [#408](https://github.com/o1-labs/zkapp-cli/pull/408)

## [0.8.1] - 2023-05-03

### Changed

- Update NextJS UI scaffold defaults. [#402](https://github.com/o1-labs/zkapp-cli/pull/402)

## [0.8.0] - 2023-05-03

### Changed

- Release `0.8.0` [#399](https://github.com/o1-labs/zkapp-cli/pull/399)
  - Remove deprecated isReady and shutdown from cli, template/examples contracts, and UI scaffolds for each supported framework.
  - Add state.getAndAssertEquals() to examples and test contracts.
  - Configure UI scaffolds for NextJS, Svelte, and Nuxt to support top-level await used in the latest o1js release.
  - Exit the cli config and deploy processes on success and error.
  - Increase the template/example project jest test timeout.
- Update interact script config field. [#396](https://github.com/o1-labs/zkapp-cli/pull/396)
- Update help text. [#392](https://github.com/o1-labs/zkapp-cli/pull/392)

## [0.7.6] - 2023-04-25

### Changed

- Remove postinstall script to speed up zkApp cli installations and upgrades [#391](https://github.com/o1-labs/zkapp-cli/pull/391)
- UI scaffold updates. [#388](https://github.com/o1-labs/zkapp-cli/pull/388)

### Added

- Landing page with next steps for Nuxt UI scaffold. [#386](https://github.com/o1-labs/zkapp-cli/pull/386)
- Landing page with next steps for Svelte UI scaffold. [#385](https://github.com/o1-labs/zkapp-cli/pull/385)
- Landing page with next steps for NextJS UI scaffold. [#384](https://github.com/o1-labs/zkapp-cli/pull/384)

## [0.7.5] - 2023-03-16

### Added

- Adds an Interactive flow for UI scaffolds. [#382](https://github.com/o1-labs/zkapp-cli/pull/382)

## [0.7.4] - 2023-03-011

### Changed

- Bug fixes. [#378](https://github.com/o1-labs/zkapp-cli/pull/378)

## [0.7.3] - 2023-03-09

### Changed

- Updates the template projects to use the o1js version of `0.9.*`. [#376](https://github.com/o1-labs/zkapp-cli/pull/376)

## [0.7.2] - 2023-03-07

### Changed

- Upgraded o1js to `0.9.2`. [#367](https://github.com/o1-labs/zkapp-cli/pull/367)

## [0.7.1] - 2023-02-27

- Update for o1js state getting fix. [#367](https://github.com/o1-labs/zkapp-cli/pull/367)

## [0.7.0] - 2023-02-14

### Changed

- Upgraded o1js to `0.9.0`. [#367](https://github.com/o1-labs/zkapp-cli/pull/367)

## [0.6.3] - 2023-02-14

### Changed

- Add timeout to warm gittar cache step during zkapp-cli install or upgrade. [#362](https://github.com/o1-labs/zkapp-cli/pull/362)
- Update 'networks' in config.json to 'deployAliases'. [#360](https://github.com/o1-labs/zkapp-cli/pull/360)

## [0.6.2] - 2023-02-02

### Added

- Show desired blockchain explorer transaction urls [#358](https://github.com/o1-labs/zkapp-cli/pull/358)

## [0.6.1] - 2023-01-030

### Changed

- Bug fixes. [#353](https://github.com/o1-labs/zkapp-cli/pull/347)

## [0.6.0] - 2023-01-018

### Changed

- Upgraded o1js to `0.8.0`. [#349](https://github.com/o1-labs/zkapp-cli/pull/347)

## [0.5.5] - 2023-01-011

### Changed

- Fix to show o1js version with `zk system` command. [#349](https://github.com/o1-labs/zkapp-cli/pull/349)
- Allow '.js' imports to work in Jest. [#339](https://github.com/o1-labs/zkapp-cli/pull/339)
- Minor fix to exit the cli process after generating a new project. [#330](https://github.com/o1-labs/zkapp-cli/pull/330)

### Added

- Add dropdown to select an example project. [#348](https://github.com/o1-labs/zkapp-cli/pull/348)
- Show a warning when users must upgrade their zkApp-cli version. [#327](https://github.com/o1-labs/zkapp-cli/pull/327)
- Add a `tsc watch` script. [#326](https://github.com/o1-labs/zkapp-cli/pull/326)

## [0.5.4] - 2022-12-01

### Changed

- Fix build errors when using `zk file`. [#325](https://github.com/o1-labs/zkapp-cli/pull/325)

## [0.5.3]

### Changed

- Fix template contract, add interaction script, and upgrade to o1js `0.7.3`. [#320](https://github.com/o1-labs/zkapp-cli/pull/320)
- Fix tictactoe example. [#318](https://github.com/o1-labs/zkapp-cli/pull/318)

## [0.5.2]

### Changed

- Upgraded o1js to `0.7.2` [#316](https://github.com/o1-labs/zkapp-cli/pull/316)
- Fix Sudoku and enable CLI to create init() proofs. [#315](https://github.com/o1-labs/zkapp-cli/pull/315)

## [0.5.1]

### Changed

- Upgraded o1js to `0.7.1`. [#309](https://github.com/o1-labs/zkapp-cli/pull/309)
- Fix GraphQL error handling. [#307](https://github.com/o1-labs/zkapp-cli/pull/307/files)

## [0.5.0]

### Changed

- Upgraded o1js to `0.7.0`. [#306](https://github.com/o1-labs/zkapp-cli/pull/306)
- Update tsconfig ES target. [#303](https://github.com/o1-labs/zkapp-cli/pull/303)

### Added

- Import a smart contract into the Nuxt UI project scaffold. [#305](https://github.com/o1-labs/zkapp-cli/pull/305)
- Provide a better error message when an unknown error occurs in deployment. [#304](https://github.com/o1-labs/zkapp-cli/pull/304)
- Import a smart contract into the Svelte UI project scaffold. [#302](https://github.com/o1-labs/zkapp-cli/pull/302)

## [0.4.19] - 2022-11-04

## [0.4.18] - 2022-10-02

### Changed

- Exit the CLI when a project step fails. [#281](https://github.com/o1-labs/zkapp-cli/pull/281)
- Fix confirmation step to not consume user input entered earlier. [#265](https://github.com/o1-labs/zkapp-cli/pull/265)
- Set default verion of user's smart contract project to `0.1.0`. [#264](https://github.com/o1-labs/zkapp-cli/pull/264)
- Constrain valid example names for better error handling. [#263](https://github.com/o1-labs/zkapp-cli/pull/263)

### Added

- Add ability to generate UI project alongsde the smart contract.
  - Add an option to NextJS to set it up for github pages. [#292](https://github.com/o1-labs/zkapp-cli/pull/292)
  - Import a smart contract into the NextJS UI project scaffold. [#290](https://github.com/o1-labs/zkapp-cli/pull/290)
  - Fixes to the NextJS project for o1js + typescript. [#287](https://github.com/o1-labs/zkapp-cli/pull/287)
  - Add a NextJS typescript prompt. [#285](https://github.com/o1-labs/zkapp-cli/pull/285)
  - Add COOP & COEP headers for SvelteKit, NextJS, & NuxtJS. [#279](https://github.com/o1-labs/zkapp-cli/pull/279)
  - Working mvp of UI monorepo. [#266](https://github.com/o1-labs/zkapp-cli/pull/266)
- Add Github issue templates. [#270](https://github.com/o1-labs/zkapp-cli/pull/270), [#275](https://github.com/o1-labs/zkapp-cli/pull/275), & [#276](https://github.com/o1-labs/zkapp-cli/pull/276)

## [0.4.17] - 2022-10-07

### Changed

- Fix running `zk deploy` on windows. [#256](https://github.com/o1-labs/zkapp-cli/pull/256)

## [0.4.16] - 2022-9-026

### Changed

- Update readme. [#253](https://github.com/o1-labs/zkapp-cli/pull/253)

## [0.4.15] - 2022-09-015

### Changed

- Upgraded o1js to `0.6.0`. [#249](https://github.com/o1-labs/zkapp-cli/pull/249)
- Renamed the references of Party to AccountUpdate and parties to zkappCommand in CLI and template/examples to match changes in Mina Protocol and o1js.

## [0.4.7] - 2022-06-14

### Added

- Better error handling on unknown errors. [#207](https://github.com/o1-labs/zkapp-cli/pull/207)
- Contributing section in README. [#215](https://github.com/o1-labs/zkapp-cli/pull/215)

### Changed

- Upgraded o1js to `0.4.1`. [#207](https://github.com/o1-labs/zkapp-cli/pull/207)
- Renamed the deploy parameter `network` to `alias`. [#218](https://github.com/o1-labs/zkapp-cli/pull/218)
- Updated template and example file structure to support publishing to npm. [#213](https://github.com/o1-labs/zkapp-cli/pull/213)
- Fixed bug with CI not cleaning up node_modules after testing. [#219](https://github.com/o1-labs/zkapp-cli/pull/219)

## [0.3.7] - 2021-06-03

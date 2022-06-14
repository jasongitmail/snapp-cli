# Mina zkApp CLI

The Mina zkApp CLI allows you to scaffold, write, test, & deploy zkApps
("zero-knowledge apps") for [Mina Protocol](https://minaprotocol.com/) using
recommended best practices. Apps are written using
[SnarkyJS](https://docs.minaprotocol.com/en/zkapps/snarkyjs-reference), a
TypeScript framework for writing zero-knowledge proof-based smart contracts,
which is included by default in projects created using this CLI.

## Get started

To get started, please read this README, followed by [Mina Protocol's zkApp
docs](https://docs.minaprotocol.com/zkapps) for a step-by-step guide.

## Dependencies

You'll need the following installed to use the zkApp CLI:

- NodeJS 16+ (or 14 using `--experimental-wasm-threads`)
- NPM 6+
- Git 2+

If you have an older version installed, we suggest installing a newer version
using the package manager for your system: [Homebrew](https://brew.sh/) (Mac),
[Chocolatey](https://chocolatey.org/) (Windows), or apt/yum/etc (Linux). On
Linux, you may need to install a recent NodeJS version via NodeSource
([deb](https://github.com/nodesource/distributions#debinstall) or
[rpm](https://github.com/nodesource/distributions#rpminstall)), as recommended
by the NodeJS Project.

## Installation

```sh
npm install -g zkapp-cli
```

## Usage

```sh
zk --help
```

### Create a new project

```sh
zk project my-proj  # or path/to/my-proj

✔ Fetch project template
✔ Initialize Git repo
✔ NPM install
✔ Set project name
✔ Git init commit

Success!

Next steps:
  cd my-proj
  git remote add origin <your-repo-url>
  git push -u origin main
```

This command creates a directory containing a new project template, fully set up
& ready for local development.

- See the included [README](templates/project-ts/README.md) for usage instructions.
  All usual commands will be available: `npm run build`, `npm run test`,
  `npm run coverage`, etc.
- A Git repo will be initialized in the project directory automatically. For
  consistency, we use `main` as the default Git branch, by convention.
- A [Github Actions CI workflow](templates/project-ts/.github/workflows/ci.yml) is
  also included. If you push your project to Github, Github Actions will run
  your tests (named as `*.test.js`) automatically, whenever you push a commit or
  open a pull request.
- Code style consistency (via Prettier) and linting (via ES Lint) are
  automatically enforced using Git pre-commit hooks. This requires no
  configuration and occurs automatically when you commit to Git--e.g. `git commit -m 'feat: add awesome feature'`.
- To skip all checks in the Git pre-commit hook (not recommended), you can pass
  the `-n` flag to Git--e.g. `git commit -m 'a bad commit' -n`. But we'd
  recommend avoiding this and resolving any errors which exist in your project
  until the pre-commit hook passes.

### Create an example project

```sh
zk example <name>
```

Where `name` is one of the names found in the [example directory](examples).

All examples are based on the standard project template created by the
zkApp CLI, and only contain changes within the `src` directory, so feel free to use
one of these as your project base.

When inside an example folder in your terminal, you can run the example using
the following command:

```sh
npm run build && node ./build/src/index.js
```

### Create a new file

```sh
zk file <name>  # or path/to/name
```

This will create `name.js` and `name.test.js`.

For convenience, running this command in your project's _root_ directory will
create the files inside your project's `src` dir automatically, even if you
don't specify `src/` as part of your file path. When _not_ in your project's
root dir, files will be created at the path you specify relative to your
terminal's current working directory.

### Show system info

```sh
zk system
```

This will output system info such as your NodeJS version, NPM version,
`zkapp-cli` version, etc. Please include this if submitting a bug report for
`zkapp-cli`, for easier troubleshooting.

## Contributing

The best way to contribute to the zkApp CLI is to help us test it broadly to
ensure it works as expected on all platforms. If you encounter any issues,
please submit an issue on Github and include the info printed when running `zk
system`, which contains your OS, NodeJS, & zkapp-cli versions to help us
reproduce the issue.

To submit a PR:

```sh
# Visit https://github.com/o1-labs/zkapp-cli & fork it.
git clone https://github.com/<your-username>/zkapp-cli.git
git remote add upstream https://github.com/o1-labs/zkapp-cli.git
cd zkapp-cli
npm install
npm link # makes it available globally on your system

git checkout -b upstream/main
# Make desired changes and commit
git push origin <your-branch>
# Submit a pull request
# To switch back to the released version, run `npm i -g zkapp-cli`
```

## License

[Apache-2.0](LICENSE)

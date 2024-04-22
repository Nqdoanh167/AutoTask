Should be use node exactly version 16.14.0 or 18.10.0

Save in nvmrc
# Angular Core

# Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Documentation

1. NgxBootstrap `https://valor-software.com/ngx-bootstrap`
2. Boostrap 5 `https://getbootstrap.com/docs/5.0`
3. Sass Docs `https://sass-lang.com/documentation`
4. Axios Docs `https://axios-http.com/docs/intro`
5. Angular Docs `https://angular.io/`
6. Moment.js Docs `https://momentjs.com/docs/`
7. Lodash Docs `https://lodash.com/docs/`
8. NgRx Docs `https://ngrx.io/`
9. Ng-Select `https://www.npmjs.com/package/@ng-select/ng-select`

# Plugins

1. Prettier `https://prettier.io/`
2. Eslint `https://eslint.org/`

# Team

- SE: `@duonglong` from `SmaxDev team`

## Getting Started

1. Clone this project `git clone https://gitlab.com/smaxai/smaxapp_action/fe.git`
2. Switch to the repo folder `cd smaxapp_action/fe`
3. Create your own branch from `develop` branch by run `git checkout -b your-branch-name`
4. Run `npm install` to install all dependencies
5. Run `npm start` to start the project
6. Open `http://localhost:4200/` in your browser

## Development rules

1. Never use branch master for anything
2. Only work on branch you in charge of
3. Always merge develop to your branch before commit
4. Run `npm run pre-commit` to check if your code have any problem before commit
5. Must clean code before create merge request

## Commit convention

`[type]: [description]`

- Type: `Feat`, `Fix`, `Refactor`, `Style`, `Docs`, `Test`, `Chore`
- Description: Short description of your commit
- Example: `Feat: add new feature`

## Coding convention

1. Observable variable must have suffixes `$` (`timer$`)
2. Class Name must be a Pascal case (`People`)
3. Func Name must be a Camel case (`calculateNumber`)
4. Folder Name must be a Kebab case (`main-site`)
5. Constant Variable must be an Upper case (`CONST`)

## Folder structure

```
src
|____app
|    |____admin
|    |____main
|    |    |____dashboard
|    |    |____flow
|    |    |____setting
|    |____notfound
|    |____services
|    |    |____api
|    |    |____common
|    |____share
|    |    |____breadcrumb
|    |    |____common
|    |    |____directive
|    |    |____icon
|    |    |____input
|    |    |____layout
|    |    |____modal
|    |    |____pipe
|    |____styles
|    |____types
|    |____utils
|    |____variable
|
|____assets
|    |____fontawesome
|    |    |____css
|    |    |____webfonts
|    |____images
|    |____js
|    |____plugins
|      
|____environments
|    |____environment.prod.ts
|    |____environment.ts
```

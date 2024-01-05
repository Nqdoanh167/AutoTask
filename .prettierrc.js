module.exports = {
  quoteProps: 'consistent',
  endOfLine: 'lf',
  tabWidth: 2,
  singleQuote: true,
  printWidth: 80,
  bracketSpacing: false,
  semi: true,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'angular',
        htmlWhitespaceSensitivity: 'ignore',
        endOfLine: 'lf',
        insertPragma: false,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        quoteProps: 'as-needed',
        jsxSingleQuote: true,
        jsxBracketSameLine: false,
        vueIndentScriptAndStyle: false,
      },
    },
  ],
};

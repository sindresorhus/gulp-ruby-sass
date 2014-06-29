Issues with the output should be reported on the Sass [issue tracker](https://github.com/nex3/sass/issues).

Before posting a "this plugin can't do X" issue make sure your command works by running it with the `sass` command line tool directly.

If a command works with the `sass` command line tool but not with this plugin you are probably missing files from your `gulp.src()` glob. You must pipe all of the files `sass` needs to compile your stylesheets into this plugin for it to work correctly.

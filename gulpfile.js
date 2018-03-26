const path = require('path');
const gulp = require('gulp');

const helioGulp = require('@helio/wc-tasks');
const helioTasks = Object.keys(helioGulp.tasks);

//this registers the helio gulpfile functions to the local gulp
helioTasks.forEach((key) => {
  let task = helioGulp.tasks[key];
  gulp.task(key, task.dep || task.fn, task.fn)
});

module.exports = gulp;
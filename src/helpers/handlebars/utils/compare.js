import util from 'handlebars-utils';

export default function(a, operator, b, options) {
  var result;
  switch (operator) {
    case '===':
      result = a === b;
      break;
    case '!==':
      result = a !== b;
      break;
    case '<':
      result = a < b;
      break;
    case '>':
      result = a > b;
      break;
    case '<=':
      result = a <= b;
      break;
    case '>=':
      result = a >= b;
      break;
    default: {
      throw new Error('helper {{compare}}: invalid operator: ' + operator);
    }
  }

  return util.value(result, this, options);
}
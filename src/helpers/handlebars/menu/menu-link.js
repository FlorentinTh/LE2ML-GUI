import URLHelper from '@URLHelper';

export default function(context, options) {
  // eslint-disable-next-line no-prototype-builtins
  const label = context.hasOwnProperty('label') ? context.label : context.name;
  let link;
  if (context.url === null) {
    link = URLHelper.toAnchor(URLHelper.toSlug(context.name));
  } else {
    link = context.url;
  }

  return '<a href="' + link + '">' + label + '</a>';
}

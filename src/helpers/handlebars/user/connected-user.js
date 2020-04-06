import APIHelper from '@APIHelper';

export default function(id, options) {
  const connectedUser = APIHelper.getConnectedUser();
  if (id === connectedUser._id) {
    return options.fn(this);
  }
  return options.inverse(this);
}

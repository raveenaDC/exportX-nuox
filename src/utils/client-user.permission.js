export function checkPermission(user, action, view) {
  if (action === user.action && action === true) {
    return {
      status: 'found',
      message: 'This user already has action permission',
    };
  } else if (view === user.view && view === true) {
    return {
      status: 'found',
      message: 'This user already has view permission',
    };
  } else if (view === user.view && view === false) {
    return {
      status: 'found',
      message: 'This user already denied for viewing',
    };
  } else if (action === user.action && action === false) {
    return {
      status: 'found',
      message: 'This user already denied for performing',
    };
  } else {
    return { status: 'notFound' };
  }
}

import Swal from 'sweetalert2';

class ModalHelper {
  static notification(type, message) {
    const timer = type === 'error' ? undefined : 3500;
    return Swal.fire({
      target: document.getElementById('root'),
      position: 'top-end',
      icon: type,
      toast: true,
      title: message,
      showConfirmButton: false,
      timer: timer
    });
  }

  static edit(
    title,
    content,
    confirmText,
    formElements = [],
    cancelable = true,
    cancelText = 'cancel'
  ) {
    return Swal.fire({
      title: '<strong>' + title + '</strong>',
      position: 'top',
      width: 600,
      target: document.getElementById('root'),
      html: content,
      showClass: {
        popup: 'animated fadeInDown'
      },
      hideClass: {
        popup: 'animated fadeOutUp'
      },
      focusConfirm: false,
      allowOutsideClick: false,
      confirmButtonText: confirmText,
      showCancelButton: cancelable,
      cancelButtonText: cancelable ? cancelText : '',
      allowEscapeKey: cancelable,
      preConfirm: () => {
        const data = {};

        formElements.forEach(elem => {
          const e = document.getElementById(elem);
          if (e.type.includes('select')) {
            data[elem] = e.options[e.selectedIndex].value.toLowerCase();
          } else {
            data[elem] = e.value.toLowerCase();
          }
        });

        return data;
      }
    });
  }

  static error(message) {
    return Swal.fire({
      icon: 'error',
      target: document.getElementById('root'),
      position: 'top',
      title: 'Oops...',
      allowOutsideClick: false,
      text: message,
      showConfirmButton: true,
      showClass: {
        popup: 'animated fadeInDown'
      },
      hideClass: {
        popup: 'animated fadeOutUp'
      }
    });
  }

  static confirm(title, message, confirmText = 'Yes', cancelable = true) {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      position: 'top',
      confirmButtonText: confirmText,
      showCancelButton: cancelable,
      cancelButtonText: cancelable ? 'No' : '',
      allowEscapeKey: cancelable,
      allowOutsideClick: false,
      target: document.getElementById('root')
    });
  }
}

export default ModalHelper;

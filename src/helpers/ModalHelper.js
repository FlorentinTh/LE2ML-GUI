import Swal from 'sweetalert2';

class ModalHelper {
  static notification(type, message, timer = undefined) {
    let notifTimer;
    if (timer === undefined) {
      notifTimer = type === 'error' ? undefined : 3500;
    } else {
      notifTimer = timer;
    }
    return Swal.fire({
      target: document.getElementById('root'),
      position: 'top-end',
      icon: type,
      toast: true,
      title: message,
      showConfirmButton: false,
      timer: notifTimer
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
      allowEscapeKey: false,
      allowEnterKey: false,
      stopKeydownPropagation: false,
      keydownListenerCapture: true,
      didOpen: () => {
        formElements.forEach(elem => {
          const e = document.getElementById(elem);
          e.addEventListener(
            'keydown',
            event => {
              if (event.key === 'Enter') {
                event.preventDefault();
              }
            },
            false
          );
        });
      },
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

  static error(message, customPopupClass = null) {
    return Swal.fire({
      icon: 'error',
      target: document.getElementById('root'),
      position: 'top',
      title: 'Oops...',
      allowOutsideClick: false,
      text: message,
      showConfirmButton: true,
      customClass: {
        popup: customPopupClass
      },
      showClass: {
        popup: 'animated fadeInDown'
      },
      hideClass: {
        popup: 'animated fadeOutUp'
      }
    });
  }

  static confirm(
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'No',
    cancelable = true,
    esc = true,
    icon = 'warning'
  ) {
    return Swal.fire({
      title,
      html: message,
      icon,
      position: 'top',
      confirmButtonText: confirmText,
      showCancelButton: cancelable,
      cancelButtonText: cancelable ? cancelText : '',
      allowEscapeKey: esc,
      allowOutsideClick: false,
      target: document.getElementById('root')
    });
  }

  static loading(title, message) {
    return Swal.fire({
      title,
      html: message,
      position: 'top',
      width: 600,
      allowEscapeKey: false,
      allowOutsideClick: false,
      target: document.getElementById('root'),
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
}

export default ModalHelper;

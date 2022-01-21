import StringHelper from '@StringHelper';

class Search {
  static addSearchListener(data, props, callback) {
    const search = document.getElementById('search');

    const count = document.querySelector('.result-count');
    const countNb = document.querySelector('.result-count span.badge');
    const countMsg = document.querySelector('.result-count p');

    let timer = null;
    let query = '';

    const keydownEvt = [
      'keydown',
      event => {
        const inputValue = event.keyCode;
        if (
          (inputValue >= 48 && inputValue <= 90) ||
          inputValue === 8 ||
          inputValue === 46
        ) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            query = search.value.trim().toLowerCase();

            if (StringHelper.isAlphaNum(query)) {
              // eslint-disable-next-line array-callback-return
              const result = data.filter(item => {
                for (let i = 0; i < props.length; ++i) {
                  const prop = props[i];
                  if (item[prop].includes(query)) {
                    return item;
                  }
                }
              });

              if (count.classList.contains('hidden')) {
                count.classList.remove('hidden');
                count.classList.add('active');
              }

              countNb.textContent = result.length;
              if (result.length > 1) {
                countMsg.textContent = 'results found';
              } else {
                countMsg.textContent = 'result found';
              }

              callback(result);
            }
          }, 200);
        }
      },
      false
    ];

    const keyupEvt = [
      'keyup',
      event => {
        if (search.value.trim() === '' && !(query === '')) {
          if (event.keyCode === 8 || event.keyCode === 46) {
            if (count.classList.contains('active')) {
              count.classList.remove('active');
              count.classList.add('hidden');
            }

            callback(data);
          }
        }
      },
      false
    ];

    search.removeEventListener(...keydownEvt);
    search.removeEventListener(...keydownEvt);

    search.addEventListener(...keydownEvt);
    search.addEventListener(...keyupEvt);
  }
}

export default Search;

const renderingPosts = (state, i18nInstance, card) => {
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');

  state.uploadedData.posts.forEach((post) => {
    const listGroupItem = document.createElement('li');
    listGroupItem.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0'
    );

    const a = document.createElement('a');
    a.classList.add(
      'fw-bold',
      state.readPostIds.has(post.id) ? 'link-secondary' : 'fw-normal'
    );
    a.href = post.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('data-id', post.id);
    a.textContent = post.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.type = 'button';
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18nInstance.t('preview');

    listGroupItem.append(a, button);
    listGroup.append(listGroupItem);
  });

  card.append(listGroup);
};

const renderingFeeds = (state, card) => {
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');

  state.uploadedData.feeds.forEach((feed) => {
    const listGroupItem = document.createElement('li');
    listGroupItem.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    listGroupItem.append(h3, p);
    listGroup.append(listGroupItem);
  });

  card.append(listGroup);
};

const makeContainer = (title, state, elements, i18nInstance) => {
  const containerElement = elements[title];
  containerElement.textContent = '';

  const card = document.createElement('div');
  card.className = 'card border-0';

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const cardTitle = document.createElement('h2');
  cardTitle.className = 'card-title h4';
  cardTitle.textContent = i18nInstance.t(title);

  cardBody.append(cardTitle);
  card.append(cardBody);
  containerElement.append(card);

  if (title === 'feeds') {
    renderingFeeds(state, card);
  }

  if (title === 'posts') {
    renderingPosts(state, i18nInstance, card);
  }
};

const errorHandler = (elements, err, i18nInstance) => {
  const feedbackElement = elements.feedback;
  feedbackElement.classList.remove('text-success');
  feedbackElement.classList.add('text-danger');
  feedbackElement.textContent = i18nInstance.t(
    `errors.${err.replace(/ /g, '')}`
  );

  if (err !== 'Network Error') {
    elements.input.classList.add('is-invalid');
  }

  elements.btn.disabled = false;
};

const finishHandler = (state, elements, i18nInstance) => {
  elements.input.classList.remove('is-invalid');
  elements.feedback.textContent = '';

  makeContainer('posts', state, elements, i18nInstance);
  makeContainer('feeds', state, elements, i18nInstance);

  elements.input.focus();
  elements.form.reset();
  elements.btn.disabled = false;

  const feedbackElement = elements.feedback;
  feedbackElement.classList.remove('text-danger');
  feedbackElement.classList.add('text-success');
  feedbackElement.textContent = i18nInstance.t('rssAdded');
};

const openModalWindow = (state, elements, postId) => {
  const { title, description, link } = state.uploadedData.posts.find(
    (post) => postId === post.id
  );

  elements.modal.title.textContent = title;
  elements.modal.body.textContent = description;
  elements.modal.fullArticleButton.href = link;
};

export default (state, elements, i18nInstance) => (path, value) => {
  switch (path) {
    case 'processOfAddingRss.state':
      if (value === 'sending') {
        elements.btn.disabled = true;
      }

      if (value === 'failed') {
        errorHandler(elements, state.processOfAddingRss.error, i18nInstance);
      }

      if (value === 'finished') {
        finishHandler(state, elements, i18nInstance);
      }

      break;

    case 'readPostIds':
      makeContainer('posts', state, elements, i18nInstance);
      break;

    case 'posts':
      makeContainer('posts', state, elements, i18nInstance);
      break;

    case 'modalPostId':
      openModalWindow(state, elements, value);
      break;

    default:
      break;
  }
};

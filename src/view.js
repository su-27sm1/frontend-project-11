const renderPosts = (state, i18nInstance, card) => {
  const groupList = document.createElement('ul');
  groupList.classList.add('list-group', 'border-0', 'rounded-0');
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
      state.readPostIds.has(post.id)
        ? ('fw-normal', 'link-secondary')
        : 'fw-bold'
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
    groupList.append(listGroupItem);
  });
  card.append(groupList);
};

const renderFeeds = (state, card) => {
  const groupList = document.createElement('ul');
  groupList.classList.add('list-group', 'border-0', 'rounded-0');
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
    groupList.append(listGroupItem);
  });
  card.append(groupList);
};

const makeContainer = (title, state, elements, i18nInstance) => {
  elements[title].textContent = '';

  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18nInstance.t(title);
  cardBody.append(cardTitle);
  card.append(cardBody);
  elements[title].append(card);
  if (title === 'feeds') {
    renderFeeds(state, card);
  }
  if (title === 'posts') {
    renderPosts(state, i18nInstance, card);
  }
};

const openModalWindow = (state, elements, postId) => {
  const post = state.uploadedData.posts.find(({ id }) => postId === id);
  const { title, description, link } = post;
  elements.modal.title.textContent = title;
  elements.modal.body.textContent = description;
  elements.modal.fullArticleButton.href = link;
};

const errorHandler = (elements, err, i18nInstance) => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = i18nInstance.t(
    `errors.${err.replace(/ /g, '')}`
  );
  if (err !== 'Network Error') elements.input.classList.add('is-invalid');
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

  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = i18nInstance.t('rssAdded');
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

    case 'posts':
      makeContainer('posts', state, elements, i18nInstance);
      break;
    case 'readPostIds':
      makeContainer('posts', state, elements, i18nInstance);
      break;

    case 'modalPostId':
      openModalWindow(state, elements, value);
      break;

    default:
      break;
  }
};
